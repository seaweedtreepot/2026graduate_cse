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

  const plantId = searchParams.get('id');
  const plantName = searchParams.get('plant') || '바질';

  const [showCamera, setShowCamera] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>(''); // 스트리밍 주소 저장
  const [isCapturing, setIsCapturing] = useState(false); // 캡처 로딩 상태
  const [lastUpdated, setLastUpdated] = useState<string>(''); // 마지막 동기화 시간
  const [isLighting, setIsLighting] = useState(false); // 빛 쐬기 애니메이션용
  const [lightComplete, setLightComplete] = useState(false); // 완료 표시용

  // [추가] 실시간 센서 데이터를 담을 상태 변수입니다.
  const [statusData, setStatusData] = useState<StatusIndicator[]>([
    { icon: Droplets, label: '습도', value: 'good', currentValue: 0, unit: '%' },
    { icon: Thermometer, label: '온도', value: 'good', currentValue: 0, unit: '°C' },
    { icon: Sun, label: '조도', value: 'good', currentValue: 0, unit: 'lux' },
    { icon: Sprout, label: '흙의 상태', value: 'good', currentValue: 0, unit: '%' },
    { icon: Bug, label: '벌레', value: 'good', currentValue: 0, unit: '마리' },
    { icon: AlertTriangle, label: '질병', value: 'good', currentValue: '정상', unit: '' },
  ]);

  // 3. [추가] 서버의 숫자 데이터를 'good' 등으로 변환해주는 도구 (함수)
  const determineStatus = (label: string, value: number): 'good' | 'warning' | 'critical' => {
    if (label === '벌레' || label === '질병') return value > 0 ? 'critical' : 'good';
    if (label === '습도') return value < 30 ? 'critical' : value < 60 ? 'warning' : 'good';
    if (label === '온도') return (value < 15 || value > 30) ? 'critical' : 'good';
    return 'good';
  };

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
    if (!plantId) return; // plantId가 없으면 실행 안 함

    try {
      // 1. 백엔드 API 호출
      const res = await api.get(`/plants/${plantId}/status`);
      const data = res.data;
      console.log("🚀 백엔드에서 도착한 데이터:", data);

      // 2. 서버에서 준 레벨이 있다면 즉시 업데이트
      if (data.level) {
        setCurrentLevel(data.level);
      }

      // 3. [핵심] 중복 선언을 없애고, 실측값(currentValue)과 상태(value)를 한 번에 매핑
      const updatedData: StatusIndicator[] = [
        {
          icon: Droplets,
          label: '습도',
          currentValue: data.humidity || 0,
          unit: '%',
          value: determineStatus('습도', data.humidity || 0)
        },
        {
          icon: Thermometer,
          label: '온도',
          currentValue: data.temp || 0,
          unit: '°C',
          value: determineStatus('온도', data.temp || 0)
        },
        {
          icon: Sun,
          label: '조도',
          currentValue: data.light || 0,
          unit: 'lux',
          value: determineStatus('조도', data.light || 0)
        },
        {
          icon: Sprout,
          label: '흙의 상태',
          currentValue: data.soil || 0,
          unit: '%',
          value: 'good' // 필요 시 determineStatus 추가
        },
        {
          icon: Bug,
          label: '벌레',
          currentValue: data.bugs || 0,
          unit: '마리',
          value: determineStatus('벌레', data.bugs || 0)
        },
        {
          icon: AlertTriangle,
          label: '질병',
          currentValue: data.disease > 0 ? '위험' : '정상',
          unit: '',
          value: determineStatus('질병', data.disease || 0)
        },
      ];

      // 4. 상태 저장
      setStatusData(updatedData);
      setLastUpdated(new Date().toLocaleTimeString('ko-KR'));
      setError(false);

    } catch (err) {
      console.error("데이터 호출 실패:", err);
      setError(true);
    }
  };

  // 마우스 위치 추적
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      mouseX.set(x);
      mouseY.set(y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const x = (touch.clientX / window.innerWidth - 0.5) * 40;
      const y = (touch.clientY / window.innerHeight - 0.5) * 40;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (showCamera && plantId) {
      const fetchStreamUrl = async () => {
        try {
          const res = await api.get(`/plants/${plantId}/cam/stream-url`);
          setStreamUrl(res.data.streamUrl);
        } catch (err) {
          console.error("스트리밍 주소 로드 실패:", err);
        }
      };
      fetchStreamUrl();
    } else {
      setStreamUrl('');
    }
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
  const soilStatus = statusData.find((s: StatusIndicator) => s.label === '흙의 상태');
  const bugStatus = statusData.find((s: StatusIndicator) => s.label === '벌레');
  const tempStatus = statusData.find((s: StatusIndicator) => s.label === '온도');
  const diseaseStatus = statusData.find((s: StatusIndicator) => s.label === '질병');

  // 배경 스타일 결정
  const getBackgroundStyle = () => {

    // 건강한 상태
    return {
      gradient: 'from-sky-200 via-emerald-100 to-emerald-200',
      overlay: 'rgba(34, 197, 94, 0.1)',
      description: 'healthy',
    };
  };

  const backgroundStyle = getBackgroundStyle();

  const handleLightToggle = async () => {
    if (!plantId) return;

    // 다음 상태 결정 (켜져 있으면 끄기, 꺼져 있으면 켜기)
    const nextStatus = isLighting ? "off" : "on";

    try {
      // 백엔드에 현재 필요한 상태 전송
      const res = await api.post(`/plants/${plantId}/control/light`, {
        status: nextStatus
      });

      if (res.status === 200) {
        // 성공 시 프론트엔드 상태 변경
        setIsLighting(!isLighting);
        fetchStatus(); // 상태 변경 후 최신 센서 데이터 확인
      }
    } catch (err) {
      console.error("제어 실패:", err);
      alert(`햇빛을 ${nextStatus === 'on' ? '켜는' : '끄는'} 데 실패했습니다.`);
    }
  };


  const handleCapture = async () => {
    if (!plantId) return;
    setIsCapturing(true);
    try {
      const res = await api.post(`/plants/${plantId}/cam/capture`);
      console.log("캡처 성공:", res.data);
      alert('스냅샷이 갤러리에 저장되었습니다!');
    } catch (err) {
      console.error("캡처 실패:", err);
      alert('캡처에 실패했습니다. 카메라 상태를 확인해주세요.');
    } finally {
      setIsCapturing(false);
    }
  };
  // 캐릭터의 표정 결정
  const getCharacterMood = () => {
    const criticalItems = statusData.filter(s => s.value === 'critical');
    const warningItems = statusData.filter(s => s.value === 'warning');

    // 기본 설정 (단계별 기본 이미지 이름 예시)
    let mood = 'happy';
    let scale = 1.05;
    let rotation = 0;
    let color = 'text-green-600';

    // 상태에 따른 mood 결정
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

    // [수정 포인트] 이미지 경로 생성
    // 예: /assets/character/lv1_happy.png
    const imageSrc = `/src/public/assets/character/lv${currentLevel}_${mood}.png`;

    return { imageSrc, mood, scale, rotation, color };
  };

  const characterMood = getCharacterMood();




  const getIndicatorMessage = (label: string, value: 'good' | 'warning' | 'critical') => {
    const messages: Record<string, { good: string; warning: string; critical: string }> = {
      '습도': { good: '습도가 적당합니다', warning: '습도가 조금 높아요', critical: '물이 부족합니다' },
      '조도': { good: '빛이 충분합니다', warning: '어두워지고 있어요', critical: '빛이 너무 부족해요' },
      '흙의 상태': { good: '토양이 건강합니다', warning: '영양분이 마르고 있어요', critical: '흙에 먹을것이 없어요' },
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
      '흙의 상태': {
        good: '토양에 영양분이 충분합니다. 분갈이 걱정 없어요.',
        warning: '조금 있으면 영양분이 부족해질 것 같아요. 알비료를 준비해주세요.',
        critical: '흙에 영양분이 전혀 없어요! 액체 비료를 주거나 흙을 갈아줄 때입니다.'
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
    <div className="min-h-[100dvh] w-full relative overflow-x-hidden"> {/* overflow-hidden을 overflow-x-hidden으로 변경 */}
      {/* 인터랙티브 배경 (상태에 따라 변화) */}
      <motion.div
        className="fixed inset-0 -z-10 w-[110vw] h-[110dvh] -left-[5vw] -top-[5dvh]" // 크기를 키우고 살짝 위/왼쪽으로 이동
        style={{
          x: smoothMouseX,
          y: smoothMouseY,
        }}
      >
        <motion.div
          className={`absolute inset-0 bg-gradient-to-b ${backgroundStyle.gradient}`}
          animate={{
            opacity: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* [추가] 은은한 햇살 효과 레이어 */}
        <AnimatePresence>
          {isLighting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0" // 배경 그라데이션 바로 위
            >
              {/* 전체적인 따뜻한 톤 입히기 */}
              <div className="absolute inset-0 bg-yellow-300/10 mix-blend-soft-light" />

              {/* 중앙에서 은은하게 퍼지는 광원 (Radial Glow) */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-yellow-200/20 blur-[120px]"
              />

              {/* 아주 작고 투명한 해 아이콘 (선택 사항, 은은하게) */}
              <div className="absolute top-20 right-20 text-6xl opacity-10 filter blur-sm">☀️</div>
            </motion.div>
          )}
        </AnimatePresence>

        {backgroundStyle.description === 'healthy' && (
          <>
            {/* 건강한 나무 실루엣 */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-green-800/40 to-transparent"
              style={{ x: smoothMouseX }}
            >
              <div className="absolute bottom-0 left-10 w-16 h-48 bg-green-900/30 rounded-t-full" />
              <div className="absolute bottom-0 left-32 w-20 h-56 bg-green-900/40 rounded-t-full" />
              <div className="absolute bottom-0 right-40 w-24 h-52 bg-green-900/35 rounded-t-full" />
              <div className="absolute bottom-0 right-10 w-16 h-44 bg-green-900/30 rounded-t-full" />
            </motion.div>

            {/* 떠다니는 잎사귀들 */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -50,
                  rotate: 0
                }}
                animate={{
                  y: window.innerHeight + 50,
                  rotate: 360,
                  x: Math.random() * window.innerWidth,
                }}
                transition={{
                  duration: 10 + Math.random() * 10,
                  repeat: Infinity,
                  delay: i * 2,
                  ease: 'linear',
                }}
              >
                🍃
              </motion.div>
            ))}
          </>
        )}


      </motion.div>


      {/*캐릭터*/}
      <div className="relative z-10 w-full max-w-4xl mx-auto p-6 space-y-6">
        <motion.div
          className="h-[45vh] flex flex-col items-center justify-start pt-10 relative" // justify-center 대신 justify-start + pt-10 사용
          animate={{
            scale: characterMood.scale,
            rotate: characterMood.rotation,
          }}
          transition={{ duration: 0.5 }}
        >

          {/* 캐릭터 */}
          <motion.div
            className={`text-9xl mb-4 ${characterMood.color} relative z-30`}
            animate={{
              y: characterMood.mood === 'suffering' ? [-5, 5, -5] :
                characterMood.mood === 'relieved' ? [0, -20, 0] :
                  characterMood.mood === 'watered' ? [0, -15, 0] :
                    characterMood.mood === 'fighting' ? [-8, 8, -8] :
                      [0, -10, 0],
              rotate: characterMood.mood === 'suffering' ? [-10, 10, -10] :
                characterMood.mood === 'relieved' ? [-10, 10, -10] :
                  characterMood.mood === 'watered' ? [5, -5, 5] :
                    characterMood.mood === 'fighting' ? [-15, 15, -15] :
                      [0, 0, 0],
              scale: characterMood.mood === 'relieved' ? [1, 1.2, 1] :
                characterMood.mood === 'watered' ? [1, 1.3, 1] :
                  [1, 1, 1],
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
            {/* 캐릭터 이미지 컨테이너: 마진을 줄여서 버튼과의 간격을 좁힘 */}
            <motion.div
              className={`relative z-30 mb-2`} // mb-4에서 mb-2로 줄임
              animate={{
                y: characterMood.mood === 'suffering' ? [-5, 5, -5] : [0, -10, 0],
                rotate: characterMood.mood === 'fighting' ? [-15, 15, -15] : [0, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <img
                src={characterMood.imageSrc}
                alt="반려식물 캐릭터"
                className="w-100 h-60 object-contain drop-shadow-2xl" // 크기를 소폭 조정해서 비율 최적화
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `/assets/character/lv${currentLevel}_happy.png`;
                }}
              />
            </motion.div>
          </motion.div>

          {/* 카메라 버튼 */}
          <motion.button
            onClick={() => setShowCamera(true)}
            className="text-2xl font-bold text-green-800 hover:text-green-600 transition-colors flex items-center gap-3 bg-white/70 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-lg z-30 relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {plantName}
            <Video className="size-5" />
          </motion.button>

          <p className={`text-base font-bold mt-3 text-center ${characterMood.color} z-30 relative bg-white/30 px-4 py-1 rounded-full backdrop-blur-xs`}>
            {characterMood.mood === 'happy' ? '건강하게 자라고 있어요!' :
              characterMood.mood === 'worried' ? '조금 신경써주세요' :
                characterMood.mood === 'suffering' ? '벌레들이 괴롭혀요!' :
                  characterMood.mood === 'relieved' ? '고마워요! 이제 괜찮아요! 🎉' :
                    characterMood.mood === 'watered' ? '시원해요! 감사합니다! 💙' :
                      characterMood.mood === 'fighting' ? '인공 햇빛 충전 중! ☀️' :
                        characterMood.mood === 'sick' ? '아파요... 도와주세요' :
                          '도움이 필요해요!'}
          </p>
        </motion.div>

        {/* --- 생장 단계 인터페이스 --- */}
        {/* --- 생장 단계 인터페이스 (실제 레벨 연동형) --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-md rounded-3xl border-2 border-emerald-100 p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                <Sprout className="size-5 text-emerald-500" />
                생장 타임라인
              </h3>
              <p className="text-sm text-emerald-700/70 mt-1">
                심은 지 {daysSincePlanted}일째, 현재 <span className="font-bold text-emerald-600">{LEVEL_NAMES[currentLevel]}</span> 단계입니다!
              </p>
            </div>
            <div className="text-right">
              {/* 4. 퍼센트 대신 레벨 이름 표시 */}
              <span className="text-2xl font-black text-emerald-600">{LEVEL_NAMES[currentLevel]}</span>
              <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Current Level</p>
            </div>
          </div>

          <div className="relative pt-8 pb-4 px-2">
            <div className="absolute top-[42px] left-0 right-0 h-1.5 bg-emerald-100 rounded-full" />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${growthProgress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-[42px] left-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full z-10 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            />

            <div className="relative flex justify-between z-20">
              {growthStages.map((stage, idx) => {
                // 현재 레벨인지, 이미 지나온 레벨인지 판단
                const isReached = currentLevel >= (idx + 1);
                const isCurrent = currentLevel === (idx + 1);

                return (
                  <div key={idx} className="flex flex-col items-center group">
                    <motion.div
                      animate={{
                        scale: isCurrent ? [1, 1.2, 1] : 1,
                        backgroundColor: isReached ? '#10b981' : '#ecfdf5',
                      }}
                      className={`size-10 rounded-full flex items-center justify-center text-xl shadow-lg border-2 ${isReached ? 'border-white text-white' : 'border-emerald-100 text-emerald-300'
                        }`}
                    >
                      {stage.icon}
                    </motion.div>
                    <span className={`text-[11px] mt-2 font-bold ${isReached ? 'text-emerald-700' : 'text-emerald-300'}`}>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
        {/* ------------------------- */}

        {/* 상세 지표 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statusData.map((status: StatusIndicator, index: number) => {
            const StatusIcon = status.icon;
            const colors = getStatusColor(status.value);
            const StatusBadgeIcon = colors.icon;
            const isLightCard = status.label === '조도';

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card className={`border-2 ${colors.border} ${colors.bg} shadow-lg overflow-hidden transition-all`}>
                  <CardContent className="pt-6">
                    {/* 카드 상단: 클릭 시 상세 정보 토글 */}
                    <button
                      onClick={() => setSelectedAction(selectedAction === status.label ? null : status.label)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${colors.iconBg}`}>
                          <StatusIcon className={`size-6 ${colors.text}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-800">{status.label}</h3>
                            {/* 실측 수치 표시 */}
                            <div className="flex items-center gap-2">
                              <span className={`text-base font-black ${colors.text}`}>
                                {status.currentValue}{status.unit}
                              </span>
                              <StatusBadgeIcon className={`size-4 ${colors.text}`} />
                            </div>
                          </div>
                          <p className={`text-xs font-medium opacity-80 ${colors.text}`}>
                            {getIndicatorMessage(status.label, status.value)}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* 펼쳐지는 상세 영역 */}
                    {selectedAction === status.label && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-black/5"
                      >
                        {isLightCard ? (
                          /* 조도 카드: 현재 상태에 따라 버튼이 변함 */
                          <Button
                            onClick={handleLightToggle}
                            className={`w-full font-bold h-11 rounded-xl transition-all ${isLighting
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' // 꺼짐 버튼 스타일
                              : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-md' // 켜짐 버튼 스타일
                              }`}
                          >
                            {isLighting ? (
                              <>
                                <div className="size-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mr-2" />
                                인공 햇빛 끄기
                              </>
                            ) : (
                              <>
                                <Sun className="size-4 mr-2" />
                                인공 햇빛 켜기
                              </>
                            )}
                          </Button>
                        ) : (
                          /* 2. 그 외 카드: Care Tip 가이드 표시 */
                          <div className="bg-white/50 p-3.5 rounded-xl border border-white/40 shadow-inner">
                            <div className="flex items-center gap-2 mb-2 text-emerald-800/70">
                              <Leaf className="size-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-wider">Management Guide</span>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed font-medium">
                              {getCareTip(status.label, status.value)}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* 마지막 업데이트 시간 */}
        <div className="text-center text-sm text-gray-600 bg-white/40 backdrop-blur-sm rounded-full py-2 px-4 inline-block mx-auto w-full">
          마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
        </div>
      </div>


      {/* 실시간 카메라 모달 */}
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
            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner">
              {/* 🚀 실제 스트리밍 URL 연동 */}
              {streamUrl ? (
                <img
                  src={streamUrl}
                  alt="실시간 스트림"
                  className="w-full h-full object-contain"
                  onError={() => console.error("스트림 연결 오류")}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-emerald-100 gap-3">
                  <div className="size-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium">카메라 연결 중...</p>
                </div>
              )}

              {/* 라이브 표시 */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider shadow-lg">
                <span className="size-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl"
                onClick={handleCapture}
                disabled={isCapturing || !streamUrl}
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
    </div>
  );
}