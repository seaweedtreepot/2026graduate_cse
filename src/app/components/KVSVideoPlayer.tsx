import { useEffect, useRef, useState } from 'react';
import { KinesisVideoClient, DescribeSignalingChannelCommand, GetSignalingChannelEndpointCommand } from "@aws-sdk/client-kinesis-video";
import { KinesisVideoSignalingClient, GetIceServerConfigCommand } from "@aws-sdk/client-kinesis-video-signaling";
import { SignalingClient, Role } from 'amazon-kinesis-video-streams-webrtc';
import { Loader2, AlertCircle, RefreshCw, Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import api from '../api/axios';

interface KVSVideoPlayerProps {
  plantId: string | number;
  channelName: string;
  region: string;
  viewerTokenPath: string;
  initialCredentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiration?: string;
  };
  onStreamError?: (err: Error) => void;
}

export function KVSVideoPlayer({
  plantId,
  channelName,
  region,
  viewerTokenPath,
  initialCredentials,
  onStreamError,
}: KVSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingClientRef = useRef<SignalingClient | null>(null);
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState('채널 초기화 중...');
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // 1. 스트림 종료 및 자원 해제 함수
  const stopPlayback = () => {
    console.log('[KVS Player] 스트림 종료 및 자원 해제 진행');

    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = null;
    }

    if (signalingClientRef.current) {
      try {
        signalingClientRef.current.close();
      } catch (e) {
        console.warn('SignalingClient close error:', e);
      }
      signalingClientRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.warn('PeerConnection close error:', e);
      }
      peerConnectionRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // 2. KVS WebRTC 연결 수립 함수
  const startPlayback = async (customCredentials?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      stopPlayback();

      let credentials = customCredentials;

      if (!credentials) {
        // ① 백엔드에서 AWS 임시 자격 증명 토큰 갱신
        setLoadingStep('보안 토큰 갱신 중...');
        const tokenRes = await api.get(viewerTokenPath);
        credentials = tokenRes.data.viewer || tokenRes.data;
      }

      const { accessKeyId, secretAccessKey, sessionToken, expiration } = credentials;

      // ② Kinesis Video 클라이언트 초기화
      setLoadingStep('AWS KVS 접속 채널 찾는 중...');
      const kinesisVideoClient = new KinesisVideoClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken,
        },
      });

      // ③ 채널 ARN 조회 (DescribeSignalingChannel)
      const describeResponse = await kinesisVideoClient.send(
        new DescribeSignalingChannelCommand({
          ChannelName: channelName,
        })
      );
      const channelARN = describeResponse.ChannelInfo?.ChannelARN;
      if (!channelARN) {
        throw new Error('시그널링 채널 ARN을 찾을 수 없습니다.');
      }

      // ④ 시그널링 엔드포인트 가져오기 (WSS / HTTPS)
      setLoadingStep('스트리밍 게이트웨이 연결 중...');
      const endpointResponse = await kinesisVideoClient.send(
        new GetSignalingChannelEndpointCommand({
          ChannelARN: channelARN,
          SingleMasterChannelEndpointConfiguration: {
            Protocols: ['WSS', 'HTTPS'],
            Role: 'VIEWER',
          },
        })
      );

      const endpointsByProtocol = (endpointResponse.ResourceEndpointList || []).reduce<Record<string, string>>((acc, endpoint) => {
        if (endpoint.Protocol && endpoint.ResourceEndpoint) {
          acc[endpoint.Protocol] = endpoint.ResourceEndpoint;
        }
        return acc;
      }, {});

      const wssEndpoint = endpointsByProtocol.WSS;
      const httpsEndpoint = endpointsByProtocol.HTTPS;

      if (!wssEndpoint || !httpsEndpoint) {
        throw new Error('시그널링 연결 엔드포인트를 불러오지 못했습니다.');
      }

      // ⑤ ICE Server(STUN/TURN) 정보 가져오기
      setLoadingStep('네트워크 경로 탐색 중...');
      const signalingClientForIce = new KinesisVideoSignalingClient({
        region,
        endpoint: httpsEndpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken,
        },
      });

      const iceResponse = await signalingClientForIce.send(
        new GetIceServerConfigCommand({
          ChannelARN: channelARN,
        })
      );

      const iceServers = (iceResponse.IceServerList || []).map((ice) => ({
        urls: ice.Uris || [],
        username: ice.Username,
        credential: ice.Password,
      }));

      // ⑥ RTCPeerConnection 생성
      const pc = new RTCPeerConnection({
        iceServers,
        iceTransportPolicy: 'all',
      });
      peerConnectionRef.current = pc;

      // ⑦ WebRTC Signaling Client 초기화 및 이벤트 연결
      setLoadingStep('비디오 피드 동기화 중...');
      const signalingClient = new SignalingClient({
        channelARN,
        channelEndpoint: wssEndpoint,
        role: Role.VIEWER,
        region,
        clientId: 'viewer-' + Math.random().toString(36).substring(2, 11),
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken,
        },
      });
      signalingClientRef.current = signalingClient;

      // ICE candidate 교환 이벤트 연결
      pc.onicecandidate = ({ candidate }) => {
        if (candidate && signalingClientRef.current) {
          signalingClient.sendIceCandidate(candidate);
        }
      };

      // 원격 미디어 트랙 수신 시 비디오 엘리먼트에 스트림 바인딩
      pc.ontrack = (event) => {
        console.log('[KVS Player] 원격 비디오 트랙 감지 성공');
        setIsLoading(false);
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      // 시그널링 채널 연결 수립 시 WebRTC SDP Offer 생성 및 전송
      signalingClient.on('open', async () => {
        console.log('[KVS Player] 시그널링 채널 오픈. WebRTC Offer 생성 중...');
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          signalingClient.sendSdpOffer(pc.localDescription!);
        } catch (err) {
          console.error('[KVS Player] SDP Offer 생성/전송 실패:', err);
          setError('비디오 스트림 요청을 생성하는 데 실패했습니다.');
          setIsLoading(false);
        }
      });

      // Master(카메라)로부터 SDP Answer 수신 시 등록
      signalingClient.on('sdpAnswer', async (answer) => {
        console.log('[KVS Player] Master 로부터 SDP Answer 수신 완료');
        try {
          await pc.setRemoteDescription(answer);
        } catch (err) {
          console.error('[KVS Player] SDP Answer 등록 실패:', err);
          setError('비디오 스트림 응답 처리에 실패했습니다.');
          setIsLoading(false);
        }
      });

      // Master(카메라)로부터 ICE candidate 수신 시 등록
      signalingClient.on('iceCandidate', async (candidate) => {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error('[KVS Player] ICE candidate 추가 실패:', err);
        }
      });

      signalingClient.on('close', () => {
        console.log('[KVS Player] 시그널링 연결 닫힘');
      });

      signalingClient.on('error', (err) => {
        console.error('[KVS Player] 시그널링 에러 발생:', err);
        setError('카메라 실시간 신호 전송 오류가 발생했습니다.');
        setIsLoading(false);
        if (onStreamError) onStreamError(new Error(err.toString()));
      });

      // 시그널링 클라이언트 소켓 연결 개시
      signalingClient.open();

      // ⑧ 토큰 자동 만료 갱신 예약 (expiration 기준 10분 전 또는 최대 50분 후 갱신)
      if (expiration) {
        const expireMs = new Date(expiration).getTime() - Date.now();
        const refreshDelay = Math.max(1000 * 60 * 5, expireMs - 1000 * 60 * 10); // 최소 5분, 만료 10분 전
        console.log(`[KVS Player] 토큰 갱신 예약: ${Math.round(refreshDelay / 1000 / 60)}분 후`);

        tokenRefreshTimerRef.current = setTimeout(() => {
          console.log('[KVS Player] 토큰 만료 전 스트리밍 연결 자동 갱신 진행');
          startPlayback();
        }, refreshDelay);
      } else {
        // 백엔드 만료 정보가 없는 경우 50분 기본 예약
        tokenRefreshTimerRef.current = setTimeout(() => {
          startPlayback();
        }, 1000 * 60 * 50);
      }

    } catch (err: any) {
      console.error('[KVS Player] 스트리밍 초기화 실패:', err);
      setError(err?.message || '실시간 비디오 연결에 실패했습니다.');
      setIsLoading(false);
      if (onStreamError) onStreamError(err);
    }
  };

  useEffect(() => {
    startPlayback(initialCredentials);
    return () => {
      stopPlayback();
    };
  }, [plantId]);

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center rounded-2xl overflow-hidden shadow-inner group">
      {/* 원격 비디오 뷰어 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-contain ${isLoading || error ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
      />

      {/* 로딩 인디케이터 오버레이 */}
      {isLoading && !error && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white gap-4 z-10">
          <div className="relative flex items-center justify-center">
            <Loader2 className="size-10 text-emerald-500 animate-spin" />
            <span className="absolute text-[10px] text-emerald-400 font-bold">KVS</span>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-slate-200">실시간 홈캠 연결 중</p>
            <p className="text-xs text-slate-400 font-semibold animate-pulse">{loadingStep}</p>
          </div>
        </div>
      )}

      {/* 에러 오버레이 */}
      {error && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 gap-4 z-10 text-center">
          <AlertCircle className="size-12 text-rose-500 animate-bounce" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-200">카메라 스트림 재생 불가</p>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-[240px]">
              {error}
            </p>
          </div>
          <Button
            size="sm"
            onClick={startPlayback}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-xl px-4 flex items-center gap-1.5 shadow-md shadow-emerald-950"
          >
            <RefreshCw className="size-3.5" /> 다시 시도
          </Button>
        </div>
      )}

      {/* 비디오 비디오 컨트롤 바 (호버 시 하단 노출) */}
      {!isLoading && !error && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button
              onClick={startPlayback}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="스트림 새로고침"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider animate-pulse">
            <span className="size-1.5 bg-white rounded-full" />
            LIVE
          </div>
        </div>
      )}
    </div>
  );
}
