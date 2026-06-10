import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Droplets, Sun, Sprout, Bug, AlertTriangle, CheckCircle2, AlertCircle, Leaf, Video, X, Thermometer } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion, useMotionValue, useSpring } from 'motion/react';
import api from '../api/axios';
import { PlantChatbot } from './PlantChatbot';
import { KVSVideoPlayer } from './KVSVideoPlayer';


interface StatusIndicator {
  icon: React.ElementType;
  label: string;
  value: 'good' | 'warning' | 'critical';
  currentValue: number | string; // 추가: 실측 숫자
  unit: string;                  // 추가: 단위 (%, lux 등)
}


const LEVEL_NAMES: Record<number, string> = { 1: '씨앗', 2: '새싹', 3: '성장', 4: '개화', 5: '결실' };

const LEVEL_TO_PROGRESS: Record<number, number> = {
  1: 5, 2: 25, 3: 55, 4: 85, 5: 100,
};

interface StatusViewProps { setError: (val: boolean) => void; }

export function StatusView({ setError }: StatusViewProps) {
  const [searchParams] = useSearchParams();

  const plantId = searchParams.get('plantId');
  const plantName = searchParams.get('plant') || '바질';

  const [showCamera, setShowCamera] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>(''); // 스트리밍 주소 저장
  const [streamConfig, setStreamConfig] = useState<{
    channelName: string;
    region: string;
    viewerTokenPath: string;
    initialCredentials: {
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken: string;
      expiration?: string;
    };
  } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false); // 캡처 로딩 상태
  const [streamError, setStreamError] = useState(false); // 스트리밍 연결 에러 여부
  const [fallbackLoaded, setFallbackLoaded] = useState(false); // 대체 이미지 로드 완료 여부
  const [fallbackSrc, setFallbackSrc] = useState('/assets/my_plant.jpg'); // 대체 이미지 소스 경로
  const [lastUpdated, setLastUpdated] = useState<string>(''); // 마지막 동기화 시간
  const [isLighting, setIsLighting] = useState(false); // 빛 쐬기 애니메이션용
  const [lightComplete, setLightComplete] = useState(false); // 완료 표시용
  const [isWatering, setIsWatering] = useState(false); // 물주기 애니메이션용
  const [autoWater, setAutoWater] = useState({ enabled: false, threshold: 30 }); // 스마트 자동 물주기
  const [autoLight, setAutoLight] = useState({ enabled: false, threshold: 3000 }); // 스마트 자동 햇빛
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'water' | 'light' | null>(null);
  const [tempThreshold, setTempThreshold] = useState(30); // 모달 내 임시 설정값
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const LOADING_MESSAGES = [
    '정원에서 센서 데이터를 동기화하고 있어요...',
    '오늘 식물의 기분을 물어보는 중...',
    '빛과 바람의 기록을 읽어오는 중...',
    '실시간 정원 상태를 분석하고 있습니다...',
    '생장 데이터를 불러오고 있어요...'
  ];

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  useEffect(() => {
    if (!isInitialLoading) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isInitialLoading]);

  // [추가] 실시간 센서 데이터를 담을 상태 변수입니다.
  const [statusData, setStatusData] = useState<StatusIndicator[]>([
    { icon: Sprout, label: '토양습도', value: 'good', currentValue: 0, unit: '%' },
    { icon: Sun, label: '조도', value: 'good', currentValue: 0, unit: 'lux' },
    { icon: Thermometer, label: '온도', value: 'good', currentValue: 0, unit: '°C' },
    { icon: Droplets, label: '습도', value: 'good', currentValue: 0, unit: '%' },
    { icon: Bug, label: '벌레', value: 'good', currentValue: 0, unit: '마리' },
    { icon: AlertTriangle, label: '질병', value: 'good', currentValue: '정상', unit: '' },
  ]);


  // 2. 기존 growthProgress 상태는 지우고 이걸 넣으세요
  const [currentLevel, setCurrentLevel] = useState<number>(Number(searchParams.get('level')) || 1);
  const growthProgress = LEVEL_TO_PROGRESS[currentLevel] || 5;

  // 1. [수정] URL에서 심은 날짜를 가져옵니다. (없으면 오늘 날짜로 방어)
  const plantedAtParam = searchParams.get('plantedAt') || new Date().toISOString().split('T')[0];
  const plantedDate = new Date(plantedAtParam);

  // 2. [수정] 현재 시간과의 차이를 계산합니다.
  const daysSincePlanted = Math.floor(
    (new Date().getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1; // 오늘 심었으면 1일째로 표시
  const growthStages = [
    { label: '씨앗', icon: '🌱', minProgress: 0 },
    { label: '새싹', icon: '🌿', minProgress: 20 },
    { label: '성장', icon: '🌳', minProgress: 50 },
    { label: '개화', icon: '🌸', minProgress: 80 },
    { label: '결실', icon: '🍅', minProgress: 100 },
  ];

  const fetchStatus = async () => {
    if (!plantId) return;

    const formatSensorValue = (val: any, precision: number = 0) => {
      if (val === undefined || val === null) return 0;
      const num = Number(val);
      if (!isNaN(num)) {
        return precision === 0 ? Math.round(num) : Number(num.toFixed(precision));
      }
      return val;
    };

    try {
      // 1. 백엔드 API 호출 (최신 센서 및 상태 데이터 가져오기)
      const res = await api.get(`/plants/${plantId}/sensors/latest`);
      const data = res.data;
      console.log("🚀 백엔드에서 도착한 센서 데이터:", data);

      // 2. 서버에서 식물 레벨(level)을 같이 주면 즉시 업데이트
      // (백엔드 명세에 따라 level 필드가 없을 수도 있으므로 옵셔널 처리)
      if (data.level) {
        setCurrentLevel(data.level);
      }

      // 💡 자동 제어 설정 상태 바인딩
      if (data.autoWaterEnabled !== undefined) {
        setAutoWater({
          enabled: data.autoWaterEnabled,
          threshold: data.autoMoistureThreshold ?? 30
        });
      }
      if (data.autoLightEnabled !== undefined) {
        setAutoLight({
          enabled: data.autoLightEnabled,
          threshold: data.autoLightThreshold ?? 3000
        });
      }

      // 3. 백엔드의 { value, status } 구조를 프론트엔드 UI 카드에 맞게 매핑
      const updatedData: StatusIndicator[] = [
        {
          icon: Sprout,
          label: '토양습도',
          currentValue: formatSensorValue(data.soil?.value ?? 0, 0),
          unit: '%',
          value: data.soil?.status ?? 'good'
        },
        {
          icon: Sun,
          label: '조도',
          currentValue: formatSensorValue(data.light?.value ?? 0, 0),
          unit: 'lux',
          value: data.light?.status ?? 'good'
        },
        {
          icon: Thermometer,
          label: '온도',
          currentValue: formatSensorValue(data.temperature?.value ?? 0, 1),
          unit: '°C',
          value: data.temperature?.status ?? 'good'
        },
        {
          icon: Droplets,
          label: '습도',
          currentValue: formatSensorValue(data.moisture?.value ?? 0, 0),
          unit: '%',
          value: data.moisture?.status ?? 'good'  // 백엔드가 준 status (good/warning/critical) 직접 사용
        },
        {
          icon: Bug,
          label: '벌레',
          // 💡 Boolean(true/false) 값을 사용자가 읽기 편한 한국어로 변환
          currentValue: data.bug?.value ? '발견됨' : '없음',
          unit: '',
          value: data.bug?.status ?? 'good'
        },
        {
          icon: AlertTriangle,
          label: '질병',
          currentValue: data.disease?.value ?? '없음', // '탄저병', '없음' 등 문자열이 들어옴
          unit: '',
          value: data.disease?.status ?? 'good'
        },
      ];

      // 4. 리액트 상태(State)에 저장하여 화면에 랜더링
      setStatusData(updatedData);
      setLastUpdated(new Date().toLocaleTimeString('ko-KR'));
      setError(false);

    } catch (err) {
      console.warn("⚠️ 센서 API 미연결 → 더미 데이터 사용:", err);
      // API 미연결 시 데모용 더미 데이터 (warning 배경 체험)
      const dummyData: StatusIndicator[] = [
        { icon: Sprout, label: '토양습도', currentValue: 35, unit: '%', value: 'critical' },
        { icon: Sun, label: '조도', currentValue: 320, unit: 'lux', value: 'warning' },
        { icon: Thermometer, label: '온도', currentValue: 28, unit: '°C', value: 'warning' },
        { icon: Droplets, label: '습도', currentValue: 65, unit: '%', value: 'good' },
        { icon: Bug, label: '벌레', currentValue: '없음', unit: '', value: 'good' },
        { icon: AlertTriangle, label: '질병', currentValue: '정상', unit: '', value: 'good' },
      ];
      setStatusData(dummyData);
      setError(true);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // 마우스 위치 추적
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isTouchDevice, mouseX, mouseY]);

  useEffect(() => {
    setStreamError(false);
    setFallbackLoaded(false);
    setFallbackSrc('/assets/my_plant.jpg');
    
    let isMounted = true;

    if (showCamera && plantId) {
      const startLiveStream = async () => {
        try {
          // 🟢 라이브 송출 시작 API 호출
          const res = await api.post(`/plants/${plantId}/cam/live/start`);
          if (!isMounted) return;

          if (res.data.status === 'success' && res.data.viewer) {
            const viewer = res.data.viewer;
            setStreamConfig({
              channelName: viewer.channelName,
              region: viewer.region || 'us-east-1',
              viewerTokenPath: `/api/v1/plants/${plantId}/cam/viewer-token`,
              initialCredentials: {
                accessKeyId: viewer.accessKeyId,
                secretAccessKey: viewer.secretAccessKey,
                sessionToken: viewer.sessionToken,
                expiration: viewer.expiration
              }
            });
            setStreamUrl('');
          } else {
            // 구형 호환용 fallback 처리 (API 응답 구조에 viewer 정보가 없는 경우)
            if (res.data.streamUrl) {
              const url = res.data.streamUrl;
              if (url.startsWith('rtsp://')) {
                setStreamError(true);
              } else {
                setStreamUrl(url);
              }
            } else {
              setStreamError(true);
            }
          }
        } catch (err) {
          console.error("라이브 송출 시작 실패:", err);
          if (isMounted) {
            setStreamError(true);
          }
        }
      };
      startLiveStream();
    } else {
      // 카메라 닫을 때
      const stopLiveStream = async () => {
        try {
          if (plantId && (streamConfig || streamUrl)) {
            // 🟢 라이브 송출 중지 API 호출
            await api.post(`/plants/${plantId}/cam/live/stop`);
          }
        } catch (err) {
          console.error("라이브 송출 중지 실패:", err);
        }
      };
      stopLiveStream();
      setStreamUrl('');
      setStreamConfig(null);
    }

    return () => {
      isMounted = false;
    };
  }, [showCamera, plantId]);

  // 실제로는 기기에서 받아온 데이터를 사용


  // 시뮬레이션: 주기적으로 상태 업데이트
  // PlantStatus.tsx 내부의 기존 useEffect를 아래로 교체
  useEffect(() => {
    if (!plantId) return;

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // 30초 주기
    return () => clearInterval(interval);
  }, [plantId]);

  const getStatusColor = (value: 'good' | 'warning' | 'critical') => {
    switch (value) {
      case 'good':
        return {
          bg: 'bg-green-50/80 backdrop-blur-sm',
          border: 'border-green-300',
          text: 'text-green-800',
          iconBg: 'bg-green-200/60',
          icon: CheckCircle2,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/80 backdrop-blur-sm',
          border: 'border-amber-300',
          text: 'text-amber-800',
          iconBg: 'bg-amber-200/60',
          icon: AlertCircle,
        };
      case 'critical':
        return {
          bg: 'bg-rose-50/80 backdrop-blur-sm',
          border: 'border-rose-300',
          text: 'text-rose-800',
          iconBg: 'bg-rose-200/60',
          icon: AlertTriangle,
        };
    }
  };

  const getOverallStatus = () => {
    const currentStatus = isInitialLoading 
        ? (searchParams.get('status') || 'good') 
        : null;

    if (currentStatus === 'critical') {
      return {
        status: '주의 필요',
        message: '식물의 일부 상태에 즉시 조치가 필요합니다',
        color: 'text-rose-700',
        bgColor: 'bg-rose-100/80 backdrop-blur-sm border-rose-300',
        emoji: '😰',
      };
    }
    if (currentStatus === 'warning') {
      return {
        status: '양호',
        message: '일부 상태에 관심이 필요합니다',
        color: 'text-amber-700',
        bgColor: 'bg-amber-100/80 backdrop-blur-sm border-amber-300',
        emoji: '🙂',
      };
    }
    if (currentStatus === 'good') {
      return {
        status: '건강함',
        message: '모든 상태가 좋습니다',
        color: 'text-green-700',
        bgColor: 'bg-green-100/80 backdrop-blur-sm border-green-300',
        emoji: '😊',
      };
    }

    const criticalCount = statusData.filter((s: StatusIndicator) => s.value === 'critical').length;
    const warningCount = statusData.filter((s: StatusIndicator) => s.value === 'warning').length;

    if (criticalCount > 0) {
      return {
        status: '주의 필요',
        message: `${criticalCount}개의 항목에 즉시 조치가 필요합니다`,
        color: 'text-rose-700',
        bgColor: 'bg-rose-100/80 backdrop-blur-sm border-rose-300',
        emoji: '😰',
      };
    }
    if (warningCount > 0) {
      return {
        status: '양호',
        message: `${warningCount}개의 항목에 관심이 필요합니다`,
        color: 'text-amber-700',
        bgColor: 'bg-amber-100/80 backdrop-blur-sm border-amber-300',
        emoji: '🙂',
      };
    }
    return {
      status: '건강함',
      message: '모든 상태가 좋습니다',
      color: 'text-green-700',
      bgColor: 'bg-green-100/80 backdrop-blur-sm border-green-300',
      emoji: '😊',
    };
  };

  const overall = getOverallStatus();

  // 각 팩터별 상태 가져오기
  const humidityStatus = statusData.find((s: StatusIndicator) => s.label === '습도');
  const lightStatus = statusData.find((s: StatusIndicator) => s.label === '조도');
  const soilStatus = statusData.find((s: StatusIndicator) => s.label === '토양습도');
  const bugStatus = statusData.find((s: StatusIndicator) => s.label === '벌레');
  const tempStatus = statusData.find((s: StatusIndicator) => s.label === '온도');
  const diseaseStatus = statusData.find((s: StatusIndicator) => s.label === '질병');

  // 배경 스타일 결정
  const getBackgroundStyle = () => {
    const currentStatus = isInitialLoading 
        ? (searchParams.get('status') || 'good') 
        : null;

    if (currentStatus === 'critical') {
      return {
        gradient: 'from-rose-300 via-orange-100 to-amber-200',
        description: 'critical',
      };
    }
    if (currentStatus === 'warning') {
      return {
        gradient: 'from-amber-200 via-yellow-50 to-lime-100',
        description: 'warning',
      };
    }
    if (currentStatus === 'good') {
      return {
        gradient: 'from-sky-200 via-emerald-100 to-emerald-200',
        description: 'healthy',
      };
    }

    const criticalCount = statusData.filter((s: StatusIndicator) => s.value === 'critical').length;
    const warningCount = statusData.filter((s: StatusIndicator) => s.value === 'warning').length;

    if (criticalCount > 0) {
      return {
        gradient: 'from-rose-300 via-orange-100 to-amber-200',
        description: 'critical',
      };
    }
    if (warningCount > 0) {
      return {
        gradient: 'from-amber-200 via-yellow-50 to-lime-100',
        description: 'warning',
      };
    }
    return {
      gradient: 'from-sky-200 via-emerald-100 to-emerald-200',
      description: 'healthy',
    };
  };

  const backgroundStyle = getBackgroundStyle();

  const handleLightToggle = async () => {
    console.log("🚀 버튼 클릭됨! 현재 plantId는:", plantId);
    if (!plantId) return;

    // 💡 1. [수정] 백엔드 명세서에 맞게 상태값을 대문자 "OFF" / "ON"으로 변경
    const nextStatus = isLighting ? "OFF" : "ON";

    try {
      // 💡 2. [수정] API 엔드포인트 주소를 'light'에서 'led'로 변경
      const res = await api.post(`/plants/${plantId}/control/led`, {
        status: nextStatus
      });

      if (res.status === 200) {
        // 성공 시 프론트엔드 상태 변경
        setIsLighting(!isLighting);
        fetchStatus(); // 상태 변경 후 최신 센서 데이터 확인
      }
    } catch (err) {
      console.error("제어 실패:", err);
      // 알림창 조건문도 대문자 'ON' 기준으로 맞춤
      alert(`햇빛을 ${nextStatus === 'ON' ? '켜는' : '끄는'} 데 실패했습니다.`);
    }
  };

  const handleWaterToggle = async () => {
    console.log("🚀 물주기 버튼 클릭됨! 현재 plantId는:", plantId);
    if (!plantId) return;

    try {
      const res = await api.post(`/plants/${plantId}/control/water`, {
        amount: 50 // 백엔드 DTO(WaterControlRequest) 명세에 맞춰 amount(ml) 전송
      });

      if (res.status === 200) {
        setIsWatering(true);
        fetchStatus();
        // 5초 동안 급수 애니메이션을 유지한 뒤 자동으로 완료 처리
        setTimeout(() => {
          setIsWatering(false);
        }, 5000);
      }
    } catch (err) {
      console.error("물주기 제어 실패:", err);
      alert("물주기에 실패했습니다. 기기 상태나 네트워크를 확인해 주세요.");
    }
  };

  const handleAutoSettingsUpdate = async (type: 'water' | 'light', enabled: boolean, threshold: number) => {
    if (!plantId) return;
    try {
      const endpoint = type === 'water' ? 'auto-water' : 'auto-light';
      await api.post(`/plants/${plantId}/control/${endpoint}`, { enabled, threshold });
      
      if (type === 'water') {
        setAutoWater({ enabled, threshold });
      } else {
        setAutoLight({ enabled, threshold });
      }
    } catch (err) {
      console.error(`${type} 자동화 설정 변경 실패:`, err);
      // 에러가 나더라도 데모 테스트 및 클라이언트 UI 동기화를 위해 로컬 상태는 강제로 업데이트합니다.
      if (type === 'water') {
        setAutoWater({ enabled, threshold });
      } else {
        setAutoLight({ enabled, threshold });
      }
    }
  };

  const handleToggleClick = (type: 'water' | 'light', currentEnabled: boolean) => {
    if (!currentEnabled) {
      // 꺼진 상태에서 켤 때는 설정 모달 팝업 오픈
      setModalType(type);
      setTempThreshold(type === 'water' ? autoWater.threshold : autoLight.threshold);
      setIsModalOpen(true);
    } else {
      // 켜진 상태에서 끌 때는 모달 없이 즉시 반영
      handleAutoSettingsUpdate(type, false, type === 'water' ? autoWater.threshold : autoLight.threshold);
    }
  };


  const handleCapture = async () => {
    if (!plantId) return;
    setIsCapturing(true);

    try {
      let imageUrlToDownload = '';

      // 만약 대체 이미지가 작동 중인 오프라인 상태라면, 로컬 대체 이미지를 바로 다운로드하도록 설정
      if (fallbackLoaded || streamError || (!streamUrl && !streamConfig)) {
        imageUrlToDownload = fallbackSrc;
      } else {
        // 1. 백엔드에 캡처 요청 (서버가 사진을 찍고 클라우드에 올림)
        const res = await api.post(`/plants/${plantId}/cam/capture`);
        imageUrlToDownload = res.data.imageUrl; // 서버가 준 이미지 주소 추출
      }

      if (!imageUrlToDownload) throw new Error("이미지 주소가 없습니다.");

      // 2. 💡 [핵심] 이미지 URL을 블롭(Blob) 데이터로 변환하여 폰에 다운로드 트리거
      const imageResponse = await fetch(imageUrlToDownload);
      const blob = await imageResponse.blob();
      const fileName = `${plantName}_홈캠_${new Date().toISOString().split('T')[0]}.jpg`;

      // 📱 모바일 브라우저(특히 iOS Safari 등)에서 파일 공유 창(Share Sheet)을 띄워
      // 사용자가 파일 앱을 거치지 않고 곧바로 '이미지 저장(사진첩)'할 수 있도록 지원
      const file = new File([blob], fileName, { type: blob.type });
      if (isTouchDevice && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${plantName} 홈캠 사진`,
            text: '식물 실시간 모니터링 캡처본입니다.'
          });
          return; // 공유 창 띄우기에 성공하면 기존의 a.download 방식을 실행하지 않고 종료합니다.
        } catch (shareErr) {
          if ((shareErr as Error).name !== 'AbortError') {
            console.error("공유 기능 오류, 일반 다운로드로 전환합니다.", shareErr);
          } else {
            return; // 사용자가 단순히 취소 창을 닫은 경우 함수 종료
          }
        }
      }

      // 💻 navigator.share를 지원하지 않는 기기/브라우저는 가상의 다운로드 링크 클릭 방식으로 폴백
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // 링크 제거 및 메모리 정리
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      alert('📸 사진이 내 기기(다운로드 폴더/갤러리)에 저장되었습니다!');
    } catch (err) {
      console.error("캡처 또는 기기 다운로드 실패:", err);
      alert('캡처 요청 처리 중 오류가 발생했습니다. 기기 연결 상태 또는 다운로드 권한을 확인하세요.');
    } finally {
      setIsCapturing(false);
    }
  };
  // 캐릭터의 표정 결정
  const getCharacterMood = () => {
    let mood = 'happy';
    let scale = 1.05;
    let rotation = 0;
    let color = 'text-green-600';

    if (isInitialLoading) {
      const currentStatus = searchParams.get('status') || 'good';
      if (currentStatus === 'critical') {
        mood = 'sad';
        scale = 0.9;
      } else if (currentStatus === 'warning') {
        mood = 'worried';
        scale = 0.95;
      }
    } else {
      const criticalItems = statusData.filter(s => s.value === 'critical');
      const warningItems = statusData.filter(s => s.value === 'warning');

      if (diseaseStatus?.value === 'critical') {
        mood = 'sick';
        scale = 0.85;
        rotation = -10;
      } else if (bugStatus?.value === 'critical' || bugStatus?.value === 'warning') {
        mood = 'suffering';
        scale = 0.9;
        rotation = -5;
      } else if (criticalItems.length > 0) {
        mood = 'sad';
        scale = 0.9;
      } else if (warningItems.length > 0) {
        mood = 'worried';
        scale = 0.95;
      }
    }

    const imageSrc = `/assets/character/lv1_${mood}.png`;
    return { imageSrc, mood, scale, rotation, color };
  };

  const characterMood = getCharacterMood();




  const getIndicatorMessage = (label: string, value: 'good' | 'warning' | 'critical') => {
    const messages: Record<string, { good: string; warning: string; critical: string }> = {
      '습도': { good: '대기 습도가 쾌적합니다', warning: '주변이 조금 다습합니다', critical: '주변이 너무 건조합니다' },
      '조도': { good: '빛이 충분합니다', warning: '어두워지고 있어요', critical: '빛이 너무 부족해요' },
      '토양습도': { good: '토양 수분이 적당합니다', warning: '흙이 조금 건조합니다', critical: '흙이 바짝 말라 물이 필요합니다!' },
      '벌레': { good: '벌레가 없습니다', warning: '벌레가 보입니다', critical: '벌레가 발견되었습니다!' },
      '온도': { good: '온도가 적절합니다', warning: '조금 덥거나 추워요', critical: '온도 조절이 필요합니다' },
      '질병': { good: '상태가 아주 좋습니다', warning: '주의가 필요합니다', critical: '질병이 의심됩니다' },
    };
    return messages[label]?.[value] || '상태를 확인 중입니다';
  };

  const getCareTip = (label: string, value: 'good' | 'warning' | 'critical') => {
    const tips: Record<string, { good: string; warning: string; critical: string }> = {
      '조도': {
        good: '현재 광량이 충분합니다. 지금 자리를 유지해주세요.',
        warning: '햇빛이 조금 더 필요해요. 창가 쪽으로 한 걸음 옮겨볼까요?',
        critical: '광량이 너무 부족합니다! 식물등을 켜거나 밝은 곳으로 즉시 옮겨주세요.'
      },
      '토양습도': {
        good: '현재 토양 수분이 아주 적절합니다. 지금처럼 유지해 주세요.',
        warning: '흙이 다소 마르고 있습니다. 조만간 물을 줄 준비를 해 주세요.',
        critical: '흙이 바짝 말라 위험한 상태입니다! 아래 [물주기 시작] 버튼을 눌러 물을 주세요.'
      },
      '습도': {
        good: '주변 공기의 습도가 식물이 자라기에 딱 좋습니다.',
        warning: '실내가 약간 다습합니다. 환기를 자주 시켜 공기를 순환해 주세요.',
        critical: '실내가 너무 건조합니다. 분무기로 물을 뿌려주거나 가습기를 켜 주세요.'
      },
      '온도': {
        good: '식물이 딱 좋아하는 온도입니다. 쾌적하네요!',
        warning: '주변 온도가 조금 불안정해요. 외풍이 있는지 확인해주세요.',
        critical: '온도가 생존 범위를 벗어났습니다! 에어컨 근처나 추운 곳을 피해주세요.'
      },
      '질병': {
        good: '잎이 아주 깨끗하고 건강합니다. 훌륭해요!',
        warning: '잎 끝이 타거나 반점이 생기려 해요. 통풍에 신경 써주세요.',
        critical: '곰팡이나 반점이 발견되었습니다! 아픈 잎은 떼어내고 약제를 뿌려주세요.'
      }
    };

    return tips[label]?.[value] || '정보를 불러오는 중입니다...';
  };
  return (
    <div className="h-[100dvh] w-full relative overflow-hidden pb-28 select-none touch-none"> {/* 스크롤을 방지하고 네이티브 앱 대시보드처럼 고정 */}
      {/* 프리미엄 로딩 스크린 오버레이 */}
      <AnimatePresence>
        {isInitialLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-teal-900 to-green-950 z-[9999] text-white p-6"
          >
            {/* 은은하게 빛나는 배경 오라 */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />

            <div className="relative flex flex-col items-center max-w-xs text-center space-y-8 z-[10000]">
              {/* 로더 원형 용기 */}
              <div className="relative flex items-center justify-center w-32 h-32">
                {/* 외곽 회전 링 */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-500/30 border-t-emerald-400"
                />
                
                {/* 내부 맥박 오라 */}
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl shadow-emerald-950/50"
                >
                  {/* 새싹 아이콘 바운스 */}
                  <motion.span
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-4xl filter drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  >
                    🌱
                  </motion.span>
                </motion.div>
              </div>

              {/* 로딩 텍스트 */}
              <div className="space-y-3">
                <h3 className="text-xl font-black tracking-tight text-emerald-100 animate-pulse">
                  식물과 연결 중
                </h3>
                {/* 롤링 메시지 */}
                <div className="h-6 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={messageIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs text-emerald-300/80 font-semibold"
                    >
                      {LOADING_MESSAGES[messageIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 인터랙티브 배경 (상태에 따라 변화) */}
      <motion.div
        className="fixed inset-0 z-0 w-[110vw] h-[110dvh] -left-[5vw] -top-[5dvh]"
        style={isTouchDevice ? {} : {
          x: smoothMouseX,
          y: smoothMouseY,
        }}
      >
        <motion.div
          className={`absolute inset-0 bg-gradient-to-b ${backgroundStyle.gradient}`}
          animate={isTouchDevice ? {} : {
            opacity: [0.9, 1, 0.9],
          }}
          transition={isTouchDevice ? {} : {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* 은은한 햇살 효과 레이어 */}
        <AnimatePresence>
          {isLighting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0"
            >
              <div className="absolute inset-0 bg-yellow-300/10 mix-blend-soft-light" />
              <motion.div
                animate={isTouchDevice ? {} : {
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={isTouchDevice ? {} : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-yellow-200/20 blur-[120px] transform-gpu ${isTouchDevice ? 'opacity-40 scale-100 will-change-transform' : ''}`}
              />
              <div className="absolute top-20 right-20 text-6xl opacity-10 filter blur-sm">☀️</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 물주기(수분 공급) 효과 레이어 */}
        <AnimatePresence>
          {isWatering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0"
            >
              <div className="absolute inset-0 bg-sky-400/10 mix-blend-soft-light" />
              <motion.div
                animate={isTouchDevice ? {} : {
                  scale: [1, 1.05, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={isTouchDevice ? {} : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-sky-200/20 blur-[120px] transform-gpu ${isTouchDevice ? 'opacity-30 scale-100 will-change-transform' : ''}`}
              />
              {!isTouchDevice && (
                <div className="absolute inset-0 pointer-events-none flex justify-center items-center gap-10 text-4xl opacity-20">
                  <motion.div animate={{ y: [-15, 25, -15], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>💧</motion.div>
                  <motion.div animate={{ y: [25, -15, 25], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>💧</motion.div>
                  <motion.div animate={{ y: [-10, 20, -10], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>💧</motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* healthy: 초록 나무 + 잎사귀 */}
        {backgroundStyle.description === 'healthy' && (
          <>
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-green-800/40 to-transparent"
              style={isTouchDevice ? {} : { x: smoothMouseX }}
            >
              <div className="absolute bottom-0 left-10 w-16 h-48 bg-green-900/30 rounded-t-full" />
              <div className="absolute bottom-0 left-32 w-20 h-56 bg-green-900/40 rounded-t-full" />
              <div className="absolute bottom-0 right-40 w-24 h-52 bg-green-900/35 rounded-t-full" />
              <div className="absolute bottom-0 right-10 w-16 h-44 bg-green-900/30 rounded-t-full" />
            </motion.div>
            {!isTouchDevice && [...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{ x: Math.random() * window.innerWidth, y: -50, rotate: 0 }}
                animate={{ y: window.innerHeight + 50, rotate: 360, x: Math.random() * window.innerWidth }}
                transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, delay: i * 2, ease: 'linear' }}
              >
                🍃
              </motion.div>
            ))}
          </>
        )}

        {/* warning: 황금 햇살 글로우 + 느리게 흔들리는 꽃잎 */}
        {backgroundStyle.description === 'warning' && (
          <>
            <motion.div
              animate={isTouchDevice ? {} : { scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
              transition={isTouchDevice ? {} : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute top-[-5%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-300/30 blur-[100px] transform-gpu ${isTouchDevice ? 'opacity-35 scale-100 will-change-transform' : ''}`}
            />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-yellow-700/20 to-transparent" />
            {!isTouchDevice && [...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-xl opacity-70"
                initial={{ x: Math.random() * window.innerWidth, y: -40, rotate: 0, scale: 0.8 }}
                animate={{
                  y: window.innerHeight + 40,
                  rotate: 720,
                  x: Math.random() * window.innerWidth,
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{ duration: 8 + Math.random() * 8, repeat: Infinity, delay: i * 1.5, ease: 'easeInOut' }}
              >
                🌼
              </motion.div>
            ))}
            {!isTouchDevice && (
              <>
                <motion.div
                  animate={{ x: ['-5%', '5%', '-5%'] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-16 left-[-5%] text-6xl opacity-10"
                >☁️</motion.div>
                <motion.div
                  animate={{ x: ['5%', '-5%', '5%'] }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-24 right-[-5%] text-5xl opacity-10"
                >☁️</motion.div>
              </>
            )}
          </>
        )}

        {/* critical: 붉은 긴급 경고 글로우 + 빠른 파티클 */}
        {backgroundStyle.description === 'critical' && (
          <>
            <motion.div
              animate={isTouchDevice ? {} : { scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={isTouchDevice ? {} : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-rose-400/20 blur-[120px] transform-gpu ${isTouchDevice ? 'opacity-35 scale-100 will-change-transform' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-rose-400/10 via-transparent to-rose-500/15 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-rose-900/25 to-transparent" />
            {!isTouchDevice && [...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-lg opacity-40"
                initial={{ x: Math.random() * window.innerWidth, y: window.innerHeight + 20 }}
                animate={{
                  y: -40,
                  x: Math.random() * window.innerWidth,
                  opacity: [0, 0.5, 0],
                }}
                transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay: i * 0.8, ease: 'linear' }}
              >
                ⚠️
              </motion.div>
            ))}
            <motion.div
              animate={isTouchDevice ? {} : { opacity: [0, 0.08, 0] }}
              transition={isTouchDevice ? {} : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute inset-0 border-[6px] border-rose-500/40 rounded-none pointer-events-none ${isTouchDevice ? 'opacity-[0.04]' : ''}`}
            />
          </>
        )}
      </motion.div>

      {/* 메인 콘텐츠 영역 */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-2 pt-14 md:pt-16 pb-4 md:p-6 h-full flex flex-col justify-between gap-3">
        
        {/* 마지막 업데이트 시간 표시 (컨디션 영역 위로 분리) */}
        <div className="flex justify-between items-center px-2 text-[10px] text-emerald-800/60 font-black">
          <span /> {/* 여백 균형용 */}
          <span>마지막 동기화: {lastUpdated || '연결됨'}</span>
        </div>

        {/* 상단 알림 영역 */}
        <div className={`p-4 rounded-3xl border-2 shadow-xl ${overall.bgColor} transition-all duration-300 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{overall.emoji}</span>
            <div>
              <h2 className={`font-black text-base md:text-lg ${overall.color}`}>{overall.status}</h2>
              <p className="text-xs text-gray-700/80 font-bold mt-0.5">{overall.message}</p>
            </div>
          </div>
        </div>

        {/* 🚀 Orbital 센서 & 캐릭터 배치 영역 */}
        <div className="grid grid-cols-[0.8fr_2.4fr_0.8fr] gap-1 md:gap-4 items-center justify-center py-3 bg-white/30 backdrop-blur-md rounded-[2rem] border border-white/40 shadow-xl p-1.5 md:p-4">
          
          {/* Left Cards: 흙의 상태, 조도, 온도 */}
          <div className="flex flex-col gap-2 justify-center">
            {[statusData[0], statusData[1], statusData[2]].map((status, idx) => {
              if (!status) return null;
              const StatusIcon = status.icon;
              const colors = getStatusColor(status.value);
              return (
                <motion.div
                  key={`left-${idx}`}
                  onClick={() => !isInitialLoading && setSelectedAction(status.label)}
                  className={`border p-1.5 py-2 md:p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg transition-all relative z-20 ${
                    isInitialLoading 
                      ? 'bg-white/20 border-white/40 animate-pulse pointer-events-none' 
                      : `${colors.bg} ${colors.border} cursor-pointer`
                  }`}
                  whileHover={isInitialLoading ? {} : { scale: 1.04 }}
                  whileTap={isInitialLoading ? {} : { scale: 0.96 }}
                >
                  <div className={`p-1 rounded-full mb-0.5 ${isInitialLoading ? 'bg-white/30 text-slate-400' : colors.iconBg}`}>
                    <StatusIcon className={`size-3 md:size-4.5 ${isInitialLoading ? 'text-slate-400/80' : colors.text}`} />
                  </div>
                  <span className="text-[7.5px] md:text-[10px] text-slate-500 font-extrabold block leading-none">{status.label}</span>
                  {isInitialLoading ? (
                    <div className="w-8 h-3.5 md:w-12 md:h-4 bg-slate-400/20 rounded-md mt-1 animate-pulse" />
                  ) : (
                    <span className={`text-[10px] md:text-sm font-black ${colors.text} mt-0.5 block leading-none`}>
                      {status.currentValue}{status.unit}
                    </span>
                  )}
                  {!isInitialLoading && (
                    <span className={`size-1 md:size-1.5 rounded-full mt-1 ${status.value === 'good' ? 'bg-emerald-500 animate-pulse' : status.value === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Center Character Column */}
          <div className="flex flex-col items-center justify-center">
            <motion.div
              className="flex flex-col items-center justify-center relative"
              animate={{
                scale: characterMood.scale,
                rotate: characterMood.rotation,
              }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className={`text-6xl ${characterMood.color} relative z-30`}
                animate={{
                  y: characterMood.mood === 'suffering' ? [-3, 3, -3] :
                    characterMood.mood === 'relieved' ? [0, -15, 0] :
                      characterMood.mood === 'watered' ? [0, -10, 0] :
                        characterMood.mood === 'fighting' ? [-5, 5, -5] :
                          [0, -6, 0],
                  rotate: characterMood.mood === 'suffering' ? [-5, 5, -5] :
                    characterMood.mood === 'relieved' ? [-5, 5, -5] :
                      characterMood.mood === 'watered' ? [3, -3, 3] :
                        characterMood.mood === 'fighting' ? [-10, 10, -10] :
                          [0, 0, 0],
                }}
                transition={{
                  duration: characterMood.mood === 'suffering' ? 0.5 :
                    characterMood.mood === 'relieved' ? 0.6 :
                      characterMood.mood === 'watered' ? 0.7 :
                        characterMood.mood === 'fighting' ? 0.4 :
                          2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <img
                  src={characterMood.imageSrc}
                  alt="반려식물 캐릭터"
                  className="w-44 h-44 md:w-72 md:h-72 scale-[1.65] md:scale-[1.3] transform origin-center object-contain drop-shadow-2xl mx-auto pointer-events-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `/assets/character/lv1_happy.png`;
                  }}
                />
              </motion.div>

              <motion.button
                onClick={() => setShowCamera(true)}
                className="text-xs font-bold text-green-900 hover:text-green-700 transition-colors flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-md z-30 relative mt-2 border border-emerald-100/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {plantName}
                <Video className="size-3.5 text-emerald-600" />
              </motion.button>
              
              <p className={`text-[9px] md:text-xs font-bold mt-2 text-center ${characterMood.color} z-30 relative bg-white/40 px-3 py-1 rounded-full backdrop-blur-xs max-w-[120px] truncate`}>
                {characterMood.mood === 'happy' ? '자라는 중! 🌱' :
                  characterMood.mood === 'worried' ? '신경써줘요' :
                    characterMood.mood === 'suffering' ? '벌레가 괴롭혀요!' :
                      characterMood.mood === 'relieved' ? '이제 편해요! 🎉' :
                        characterMood.mood === 'watered' ? '시원해요! 💙' :
                          characterMood.mood === 'fighting' ? '햇빛 충전! ☀️' :
                            characterMood.mood === 'sick' ? '도와주세요 😢' :
                              '확인 필요!'}
              </p>
            </motion.div>
          </div>

          {/* Right Cards: 습도, 벌레, 질병 */}
          <div className="flex flex-col gap-2 justify-center">
            {[statusData[3], statusData[4], statusData[5]].map((status, idx) => {
              if (!status) return null;
              const StatusIcon = status.icon;
              const colors = getStatusColor(status.value);
              return (
                <motion.div
                  key={`right-${idx}`}
                  onClick={() => !isInitialLoading && setSelectedAction(status.label)}
                  className={`border p-1.5 py-2 md:p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg transition-all relative z-20 ${
                    isInitialLoading 
                      ? 'bg-white/20 border-white/40 animate-pulse pointer-events-none' 
                      : `${colors.bg} ${colors.border} cursor-pointer`
                  }`}
                  whileHover={isInitialLoading ? {} : { scale: 1.04 }}
                  whileTap={isInitialLoading ? {} : { scale: 0.96 }}
                >
                  <div className={`p-1 rounded-full mb-0.5 ${isInitialLoading ? 'bg-white/30 text-slate-400' : colors.iconBg}`}>
                    <StatusIcon className={`size-3 md:size-4.5 ${isInitialLoading ? 'text-slate-400/80' : colors.text}`} />
                  </div>
                  <span className="text-[7.5px] md:text-[10px] text-slate-500 font-extrabold block leading-none">{status.label}</span>
                  {isInitialLoading ? (
                    <div className="w-8 h-3.5 md:w-12 md:h-4 bg-slate-400/20 rounded-md mt-1 animate-pulse" />
                  ) : (
                    <span className={`text-[10px] md:text-sm font-black ${colors.text} mt-0.5 block leading-none`}>
                      {status.currentValue}{status.unit}
                    </span>
                  )}
                  {!isInitialLoading && (
                    <span className={`size-1 md:size-1.5 rounded-full mt-1 ${status.value === 'good' ? 'bg-emerald-500 animate-pulse' : status.value === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
                  )}
                </motion.div>
              );
            })}
          </div>

        </div>

        {/* ── 컴팩트 생장 타임라인 ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/50 backdrop-blur-md rounded-3xl border border-white/40 p-4 shadow-lg w-full"
        >
          <div className="relative flex justify-between items-center px-4 py-2">
            <div className="absolute top-[18px] left-6 right-6 h-1 bg-emerald-100/60 rounded-full z-0" />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${growthProgress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-[18px] left-6 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full z-10 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            />
            {growthStages.map((stage, idx) => {
              const isReached = currentLevel >= (idx + 1);
              const isCurrent = currentLevel === (idx + 1);
              return (
                <div key={idx} className="flex flex-col items-center z-20 relative">
                  <motion.div
                    animate={{
                      scale: isCurrent ? [1, 1.15, 1] : 1,
                      backgroundColor: isReached ? '#10b981' : '#f0fdf4',
                    }}
                    transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
                    className={`size-8 rounded-full flex items-center justify-center text-sm shadow-md border ${isReached ? 'border-white text-white' : 'border-emerald-100 text-emerald-300'}`}
                  >
                    {stage.icon}
                  </motion.div>
                  <span className={`text-[9px] mt-1 font-bold ${isReached ? 'text-emerald-800' : 'text-emerald-400/80'}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-[10px] text-emerald-800/80 font-bold mt-2">
            심은 지 {daysSincePlanted}일째 • 현재 <span className="text-emerald-700 font-extrabold">{LEVEL_NAMES[currentLevel]}</span> 단계
          </p>
        </motion.div>

      </div>

      {/* ── 바텀시트 상세 팝업 ── */}
      <AnimatePresence>
        {selectedAction && (
          <>
            {/* 배경 흐리게 처리 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAction(null)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs"
            />
            {/* 시트 콘텐츠 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] border-t border-emerald-100 shadow-2xl z-50 p-6 pb-8 touch-auto"
            >
              {/* 드래그 핸들 모양 장식 */}
              <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-5 cursor-pointer" onClick={() => setSelectedAction(null)} />
              
              {(() => {
                const status = statusData.find((s) => s.label === selectedAction);
                if (!status) return null;
                const colors = getStatusColor(status.value);
                const StatusIcon = status.icon;
                const isWaterCard = status.label === '토양습도';
                const isLightCard = status.label === '조도';

                return (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className={`p-3.5 rounded-2xl ${colors.iconBg}`}>
                        <StatusIcon className={`size-7 ${colors.text}`} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-800">{status.label}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-2xl font-black ${colors.text}`}>
                            {status.currentValue}{status.unit}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {status.value}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">현재 상태</span>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">
                        {getIndicatorMessage(status.label, status.value)}
                      </p>
                    </div>

                    {isWaterCard && (
                      <div className="bg-white/40 p-4 rounded-2xl border border-white/50 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-slate-800 block">스마트 자동 물주기</span>
                            <span className="text-[9px] text-slate-500 font-bold block">토양이 건조해지면 자동으로 줍니다</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoWater.enabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                handleAutoSettingsUpdate('water', enabled, autoWater.threshold);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                          </label>
                        </div>

                        {autoWater.enabled && (
                          <div className="space-y-2 pt-2 border-t border-black/5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-700">
                              <span>임계 습도 설정</span>
                              <span className="text-sky-600 font-extrabold">{autoWater.threshold}% 이하</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="90"
                              step="5"
                              value={autoWater.threshold}
                              onChange={(e) => setAutoWater(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                              onMouseUp={() => handleAutoSettingsUpdate('water', true, autoWater.threshold)}
                              onTouchEnd={() => handleAutoSettingsUpdate('water', true, autoWater.threshold)}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {isLightCard && (
                      <div className="bg-white/40 p-4 rounded-2xl border border-white/50 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-slate-800 block">스마트 자동 햇빛</span>
                            <span className="text-[9px] text-slate-500 font-bold block">조도가 낮아지면 자동으로 켭니다</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoLight.enabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                handleAutoSettingsUpdate('light', enabled, autoLight.threshold);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                          </label>
                        </div>

                        {autoLight.enabled && (
                          <div className="space-y-2 pt-2 border-t border-black/5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-700">
                              <span>임계 광량 설정</span>
                              <span className="text-yellow-600 font-extrabold">{autoLight.threshold} lux 이하</span>
                            </div>
                            <input
                              type="range"
                              min="2500"
                              max="6000"
                              step="50"
                              value={autoLight.threshold}
                              onChange={(e) => setAutoLight(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                              onMouseUp={() => handleAutoSettingsUpdate('light', true, autoLight.threshold)}
                              onTouchEnd={() => handleAutoSettingsUpdate('light', true, autoLight.threshold)}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {!isWaterCard && !isLightCard && (
                      <div className="bg-white/50 p-4 rounded-2xl border border-white/40 shadow-inner space-y-2">
                        <div className="flex items-center gap-2 text-emerald-800/70">
                          <Leaf className="size-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Management Guide</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {getCareTip(status.label, status.value)}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={() => setSelectedAction(null)}
                      className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md mt-4"
                    >
                      닫기
                    </Button>
                  </div>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 하단 고정 제어 버튼 바 ── */}
      <div className="fixed bottom-4 left-4 right-4 bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl py-3 px-4 z-40 flex justify-center gap-3 max-w-sm mx-auto rounded-3xl">
        <div className="relative flex-1">
          <Button
            onClick={handleWaterToggle}
            disabled={autoWater.enabled || isWatering}
            className={`w-full font-bold h-12 rounded-2xl transition-all text-xs md:text-sm relative ${
              isWatering
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-sky-500 hover:bg-sky-600 text-white shadow-md'
            } ${(autoWater.enabled || isWatering) ? 'opacity-55' : ''}`}
          >
            {isWatering ? (
              <>
                <div className="size-3.5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mr-1.5" />
                물주는 중...
              </>
            ) : (
              <>
                <Droplets className="size-4 mr-1.5" />
                물주기 시작
              </>
            )}
          </Button>
          {autoWater.enabled && (
            <span className="absolute -top-1.5 -right-1 bg-sky-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-white">
              자동
            </span>
          )}
        </div>

        <div className="relative flex-1">
          <Button
            onClick={handleLightToggle}
            disabled={autoLight.enabled}
            className={`w-full font-bold h-12 rounded-2xl transition-all text-xs md:text-sm relative ${
              isLighting
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-md'
            } ${autoLight.enabled ? 'opacity-55 cursor-not-allowed' : ''}`}
          >
            {isLighting ? (
              <>
                <div className="size-3.5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mr-1.5" />
                햇빛 끄기
              </>
            ) : (
              <>
                <Sun className="size-4 mr-1.5" />
                햇빛 켜기
              </>
            )}
          </Button>
          {autoLight.enabled && (
            <span className="absolute -top-1.5 -right-1 bg-yellow-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-white">
              자동
            </span>
          )}
        </div>
      </div>

      {/* 실시간 카메라 모달 (기존 유지) */}
      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-md border-2 border-emerald-100 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-900">
              <Video className="size-5 text-emerald-600" />
              실시간 홈캠 - {plantName}
            </DialogTitle>
            <DialogDescription>
              기기의 카메라를 통해 실시간으로 식물 상태를 확인하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
              {streamConfig ? (
                <KVSVideoPlayer
                  plantId={plantId || ''}
                  channelName={streamConfig.channelName}
                  region={streamConfig.region}
                  viewerTokenPath={streamConfig.viewerTokenPath}
                  initialCredentials={streamConfig.initialCredentials}
                  onStreamError={(err) => {
                    console.error("KVS 스트림 에러:", err);
                    setStreamError(true);
                  }}
                />
              ) : streamUrl && !streamError ? (
                <img
                  src={streamUrl}
                  alt="실시간 스트림"
                  className="w-full h-full object-contain"
                  onError={() => {
                    console.error("스트림 연결 오류");
                    setStreamError(true);
                  }}
                />
              ) : (
                <div className="w-full h-full relative flex flex-col items-center justify-center text-emerald-100 gap-3">
                  <img
                    src={fallbackSrc}
                    alt="식물 대체 이미지"
                    className="absolute inset-0 w-full h-full object-cover"
                    onLoad={() => setFallbackLoaded(true)}
                    onError={(e) => {
                      if (fallbackSrc === '/assets/my_plant.jpg') {
                        setFallbackSrc('/assets/my_plant.JPG');
                      } else {
                        setFallbackLoaded(false);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }
                    }}
                  />
                  {!fallbackLoaded && (
                    <div className="relative z-10 flex flex-col items-center gap-2 bg-black/60 p-4 rounded-2xl text-center backdrop-blur-xs max-w-[80%]">
                      {streamError ? (
                        <>
                          <Video className="size-8 text-yellow-400 mb-1" />
                          <p className="text-sm font-bold text-white">실시간 홈캠 연결 실패</p>
                          <p className="text-[10px] text-slate-300 font-medium">기기 전원 및 네트워크 상태를 확인하세요.</p>
                        </>
                      ) : (
                        <>
                          <div className="size-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-xs font-semibold text-white">카메라 연결 중...</p>
                        </>
                      )}
                    </div>
                  )}
                  {fallbackLoaded && (
                    <div className="absolute bottom-4 right-4 bg-black/55 backdrop-blur-xs px-2.5 py-1 rounded-md text-[9px] text-emerald-300 font-semibold flex items-center gap-1">
                      <span className="size-1.5 bg-emerald-400 rounded-full animate-ping" />
                      대체 이미지 작동 중
                    </div>
                  )}
                </div>
              )}

              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider shadow-lg">
                <span className="size-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl"
                onClick={handleCapture}
                disabled={isCapturing || (!streamUrl && !streamConfig && !fallbackLoaded)}
              >
                {isCapturing ? '📸 캡처 중...' : '📸 현재 상태 캡처'}
              </Button>
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl border-emerald-200 text-emerald-800 font-bold"
                onClick={() => setShowCamera(false)}
              >
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🟢 AI 챗봇 컴포넌트 추가 */}
      <PlantChatbot plantName={plantName} sensorData={statusData} />
    </div>
  );
}