import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Droplets, Sun, Sprout, Bug, AlertTriangle, CheckCircle2, AlertCircle, Leaf, Video, X, Thermometer } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface StatusIndicator {
  icon: React.ElementType;
  label: string;
  value: 'good' | 'warning' | 'critical';
}

export function PlantStatus() {
  const [searchParams] = useSearchParams();
  const plantName = searchParams.get('plant') || '바질';
  const [showCamera, setShowCamera] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isBlowing, setIsBlowing] = useState(false);
  const [bugsBlownAway, setBugsBlownAway] = useState(false);
  const [showBlowHint, setShowBlowHint] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [wateringComplete, setWateringComplete] = useState(false);
  const [recentlySolved, setRecentlySolved] = useState<string | null>(null);

  const [growthProgress, setGrowthProgress] = useState(65); // 예시로 65% 설정
  const plantedDate = new Date('2026-02-20'); // 심은 날짜
  const daysSincePlanted = Math.floor((new Date().getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24));
  const growthStages = [
    { label: '씨앗', icon: '🌱', minProgress: 0 },
    { label: '새싹', icon: '🌿', minProgress: 20 },
    { label: '성장', icon: '🌳', minProgress: 50 },
    { label: '개화', icon: '🌸', minProgress: 80 },
    { label: '결실', icon: '🍅', minProgress: 100 },
  ];

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

  // 실제로는 기기에서 받아온 데이터를 사용
  const [statusData, setStatusData] = useState<StatusIndicator[]>([
    {
      icon: Droplets,
      label: '습도',
      value: 'good',
    },
    {
      icon: Sun,
      label: '조도',
      value: 'warning',
    },
    {
      icon: Sprout,
      label: '흙의 상태',
      value: 'critical',
    },
    {
      icon: Bug,
      label: '벌레',
      value: 'good',
    },
    {
      icon: Thermometer,
      label: '온도',
      value: 'good',
    },
    {
      icon: AlertTriangle,
      label: '질병',
      value: 'good',
    },
  ]);

  // 시뮬레이션: 주기적으로 상태 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusData(prev => prev.map(status => ({
        ...status,
        // 랜덤하게 상태 변경 (실제로는 기기 데이터 사용)
        value: 'critical',
      })));
    }, 120000); // 2분마다 업데이트

    return () => clearInterval(interval);
  }, []);

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
    const criticalCount = statusData.filter(s => s.value === 'critical').length;
    const warningCount = statusData.filter(s => s.value === 'warning').length;

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
  const humidityStatus = statusData.find(s => s.label === '습도');
  const lightStatus = statusData.find(s => s.label === '조도');
  const soilStatus = statusData.find(s => s.label === '흙의 상태');
  const bugStatus = statusData.find(s => s.label === '벌레');
  const tempStatus = statusData.find(s => s.label === '온도');
  const diseaseStatus = statusData.find(s => s.label === '질병');

  // 배경 스타일 결정
  const getBackgroundStyle = () => {
    // 우선순위: 벌레 > 질병 > 습도 > 조도 > 온도 > 기본

    // if (bugStatus?.value === 'critical' || bugStatus?.value === 'warning') {
    //   return {
    //     gradient: 'from-gray-700 via-gray-600 to-gray-500',
    //     overlay: 'rgba(0, 0, 0, 0.3)',
    //     description: 'bugs',
    //   };
    // }

    // if (diseaseStatus?.value === 'critical') {
    //   return {
    //     gradient: 'from-purple-900 via-purple-700 to-purple-600',
    //     overlay: 'rgba(139, 92, 246, 0.2)',
    //     description: 'disease',
    //   };
    // }

    // if (humidityStatus?.value === 'critical') {
    //   // 사막
    //   return {
    //     gradient: 'from-yellow-400 via-orange-300 to-amber-400',
    //     overlay: 'rgba(251, 191, 36, 0.3)',
    //     description: 'desert',
    //   };
    // }

    // if (humidityStatus?.value === 'warning') {
    //   // 홍수/비
    //   return {
    //     gradient: 'from-blue-400 via-blue-300 to-cyan-300',
    //     overlay: 'rgba(59, 130, 246, 0.3)',
    //     description: 'flood',
    //   };
    // }

    // if (lightStatus?.value === 'critical') {
    //   // 어두움
    //   return {
    //     gradient: 'from-slate-700 via-slate-600 to-gray-600',
    //     overlay: 'rgba(0, 0, 0, 0.5)',
    //     description: 'dark',
    //   };
    // }

    // if (lightStatus?.value === 'warning') {
    //   // 뜨거운 태양
    //   return {
    //     gradient: 'from-red-400 via-orange-400 to-yellow-400',
    //     overlay: 'rgba(239, 68, 68, 0.3)',
    //     description: 'hot',
    //   };
    // }

    // if (tempStatus?.value === 'critical') {
    //   return {
    //     gradient: 'from-blue-900 via-indigo-800 to-blue-700',
    //     overlay: 'rgba(29, 78, 216, 0.3)',
    //     description: 'cold',
    //   };
    // }

    // 건강한 상태
    return {
      gradient: 'from-sky-200 via-emerald-100 to-emerald-200',
      overlay: 'rgba(34, 197, 94, 0.1)',
      description: 'healthy',
    };
  };

  const backgroundStyle = getBackgroundStyle();

  const handleActionClick = (actionType: string) => {
    if (actionType === 'humidity') {
      console.log('물주기 시작');
      setIsWatering(true);
      setSelectedAction(null);

      // 3초 후 물주기 완료
      setTimeout(() => {
        setIsWatering(false);
        setWateringComplete(true);
        setRecentlySolved('humidity');
        console.log('물주기 완료! 기기에 신호 전송');

        setStatusData(prev => prev.map(status => { // 습도와 흙의 상태를 'good'으로 업데이트 => 나중에 흙상태 센싱 처리 어케할지 생각해봐야할듯
          if (status.label === '습도' || status.label === '흙의 상태') {
            return {
              ...status,
              value: 'good'
            };
          }
          return status;
        }));
        // 3초 후 완료 상태 해제
        setTimeout(() => {
          setWateringComplete(false);
          setRecentlySolved(null);
        }, 3000);
      }, 3000);
    } else if (actionType === 'bug') {
      console.log('바람불기 시작');
      setSelectedAction(null); // 메뉴 닫기
      setIsBlowing(true); // 바람 애니메이션(💨) 시작

      // 1.5초(바람 부는 시간) 후에 벌레가 실제로 사라지도록 설정
      setTimeout(() => {
        setIsBlowing(false);
        setBugsBlownAway(true); // 벌레들이 화면 밖으로 날아감
        setRecentlySolved('bug'); // 캐릭터가 기뻐하는 표정으로 변경
        setBugsBlownAway(false); // 바람 애니메이션 종료 후 상태 초기화
        // **핵심**: statusData에서 벌레 상태를 'good'으로 업데이트
        setStatusData(prev => prev.map(status =>
          status.label === '벌레'
            ? { ...status, value: 'good', message: '벌레를 모두 쫓아냈습니다!' }
            : status
        ));

        // 3초 후 캐릭터 표정을 평상시로 되돌림
        setTimeout(() => {
          setRecentlySolved(null);
          // 필요하다면 다시 벌레가 나타날 수 있게 setBugsBlownAway(false)를 할 수 있지만, 
          // 현재는 2분마다 전체가 critical로 바뀌게 설정하셨으니 그대로 두셔도 됩니다.
        }, 3000);
      }, 1500); // 1.5초 동안 바람 연출 후 결과 반영
    }
  };

  // 캐릭터의 표정 결정
  const getCharacterMood = () => {
    const criticalItems = statusData.filter(s => s.value === 'critical');
    const warningItems = statusData.filter(s => s.value === 'warning');

    // 물주기 완료 시 기쁜 모습
    if (wateringComplete || recentlySolved === 'humidity') {
      return { emoji: '🥰', mood: 'watered', scale: 1.15, rotation: 0, color: 'text-blue-600' };
    }

    // 질병이 있으면 아픈 모습
    if (diseaseStatus?.value === 'critical') {
      return { emoji: '🤢', mood: 'sick', scale: 0.85, rotation: -10, color: 'text-purple-600' };
    }

    // 벌레가 날아갔으면 기쁜 모습
    if ((bugStatus?.value === 'critical' || bugStatus?.value === 'warning') && bugsBlownAway) {
      return { emoji: '🤗', mood: 'relieved', scale: 1.1, rotation: 0, color: 'text-green-600' };
    }

    // 벌레가 있으면 괴로워하는 모습
    if (bugStatus?.value === 'critical' || bugStatus?.value === 'warning') {
      return { emoji: '😫', mood: 'suffering', scale: 0.9, rotation: -5, color: 'text-gray-600' };
    }

    // 바람 공격 시
    if (recentlySolved === 'bug') {
      return { emoji: '😤', mood: 'fighting', scale: 1.05, rotation: 0, color: 'text-orange-600' };
    }

    if (criticalItems.length > 0) {
      return { emoji: '😰', mood: 'sad', scale: 0.9, rotation: -5, color: 'text-rose-600' };
    }
    if (warningItems.length > 0) {
      return { emoji: '😟', mood: 'worried', scale: 0.95, rotation: 0, color: 'text-amber-600' };
    }
    return { emoji: '😊', mood: 'happy', scale: 1.05, rotation: 5, color: 'text-green-600' };
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
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* 인터랙티브 배경 (상태에 따라 변화) */}
      <motion.div
        className="fixed inset-0 -z-10"
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

        {/* 배경별 특수 효과 */}
        {backgroundStyle.description === 'desert' && (
          <>
            {/* 사막 모래 언덕 */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-yellow-700/40 to-transparent">
              <div className="absolute bottom-0 left-0 right-0 h-20">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute bottom-0 bg-yellow-600/30 rounded-t-full"
                    style={{
                      left: `${i * 10}%`,
                      width: `${8 + Math.random() * 4}%`,
                      height: `${40 + Math.random() * 30}px`,
                    }}
                  />
                ))}
              </div>
            </div>
            {/* 갈라진 땅 효과 */}
            <div className="absolute bottom-20 left-1/4 w-32 h-1 bg-amber-900/50" />
            <div className="absolute bottom-24 right-1/3 w-24 h-1 bg-amber-900/50 rotate-45" />
          </>
        )}

        {backgroundStyle.description === 'flood' && (
          <>
            {/* 빗방울 효과 */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-8 bg-blue-400/60"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -50
                }}
                animate={{
                  y: window.innerHeight + 50,
                }}
                transition={{
                  duration: 1 + Math.random() * 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'linear',
                }}
              />
            ))}
            {/* 물 웅덩이 */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-600/40 to-transparent">
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-4 bg-blue-500/50"
                animate={{
                  height: ['16px', '20px', '16px'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </div>
          </>
        )}

        {backgroundStyle.description === 'dark' && (
          <>
            {/* 어두운 구름 */}
            <div className="absolute top-0 left-0 right-0">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute bg-gray-800/40 rounded-full blur-2xl"
                  style={{
                    left: `${i * 20}%`,
                    top: `${Math.random() * 30}%`,
                    width: `${100 + Math.random() * 100}px`,
                    height: `${60 + Math.random() * 40}px`,
                  }}
                  animate={{
                    x: [0, 20, 0],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 5 + i,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>
          </>
        )}

        {backgroundStyle.description === 'hot' && (
          <>
            {/* 뜨거운 태양 */}
            <motion.div
              className="absolute top-10 right-10 w-24 h-24 bg-yellow-300 rounded-full blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            {/* 아지랑이 효과 */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bottom-20 bg-orange-400/20 blur-md"
                style={{
                  left: `${i * 12}%`,
                  width: '60px',
                  height: '80px',
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
            {/* 갈라진 땅 */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-red-900/30 to-transparent">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute bottom-0 h-1 bg-red-950/60"
                  style={{
                    left: `${i * 16}%`,
                    width: `${10 + Math.random() * 5}%`,
                    transform: `rotate(${-10 + Math.random() * 20}deg)`,
                  }}
                />
              ))}
            </div>
          </>
        )}

        {backgroundStyle.description === 'cold' && (
          <>
            {/* 눈송이 효과 */}
            {[...Array(15)].map((_, i) => (
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
                  x: Math.random() * window.innerWidth - 50,
                }}
                transition={{
                  duration: 8 + Math.random() * 5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'linear',
                }}
              >
                ❄️
              </motion.div>
            ))}
          </>
        )}

        {backgroundStyle.description === 'disease' && (
          <>
            {/* 병든 잎사귀와 어두운 분위기 */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl opacity-60"
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
                  duration: 12 + Math.random() * 8,
                  repeat: Infinity,
                  delay: i * 1.5,
                  ease: 'linear',
                }}
              >
                🍂
              </motion.div>
            ))}
          </>
        )}

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



      {/* [추가] 애니메이션 전용 레이어: 캐릭터(z-30)보다 높은 z-50 설정 */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* 바람 효과 */}
        {isBlowing && (
          <>
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`wind-${i}`}
                className="absolute text-4xl z-20"
                initial={{
                  x: -50,
                  y: window.innerHeight * (0.2 + Math.random() * 0.4),
                  opacity: 0.8,
                }}
                animate={{
                  x: window.innerWidth + 50,
                  opacity: 0,
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  ease: 'easeOut',
                }}
              >
                💨
              </motion.div>
            ))}
          </>
        )}

        {/* 물주기 애니메이션 */}
        {isWatering && (
          <>
            {/* 물방울들 */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`water-${i}`}
                className="absolute text-3xl z-50"
                initial={{
                  x: window.innerWidth / 2 - 50 + Math.random() * 100,
                  y: -50,
                  rotate: 0,
                  scale: 0.5 + Math.random() * 0.5,
                }}
                animate={{
                  y: window.innerHeight * 0.5,
                  rotate: 360,
                  scale: 0,
                }}
                transition={{
                  duration: 1.5 + Math.random() * 0.5,
                  delay: i * 0.05,
                  ease: 'easeIn',
                }}
              >
                💧
              </motion.div>
            ))}

            {/* 물뿌리개 */}
            <motion.div
              className="absolute text-7xl z-30"
              initial={{
                x: window.innerWidth / 2 - 100,
                y: -100,
                rotate: -45,
              }}
              animate={{
                x: window.innerWidth / 2 - 50,
                y: 50,
                rotate: 0,
              }}
              transition={{
                duration: 0.8,
                ease: 'easeOut',
              }}
            >
              🚿
            </motion.div>

            {/* 물주는 중 메시지 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-4 rounded-full shadow-2xl z-50 flex items-center gap-3"
            >
              <motion.span
                className="text-3xl"
                animate={{
                  rotate: [0, -20, 20, -20, 20, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                💧
              </motion.span>
              <div>
                <p className="font-bold">물주는 중...</p>
                <p className="text-sm opacity-90">기기가 작동하고 있습니다</p>
              </div>
            </motion.div>
          </>
        )}

        {/* 물주기 완료 효과 */}
        {wateringComplete && (
          <>
            {/* 반짝이는 효과 */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute text-3xl z-30"
                initial={{
                  x: window.innerWidth / 2,
                  y: window.innerHeight * 0.35,
                  scale: 0,
                }}
                animate={{
                  x: window.innerWidth / 2 + Math.cos((i / 12) * Math.PI * 2) * 150,
                  y: window.innerHeight * 0.35 + Math.sin((i / 12) * Math.PI * 2) * 150,
                  scale: [0, 1.5, 0],
                  rotate: 360,
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeOut',
                }}
              >
                ✨
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-4 rounded-full shadow-2xl z-50 flex items-center gap-3"
            >
              <span className="text-3xl">🎉</span>
              <div>
                <p className="font-bold">물주기 완료!</p>
                <p className="text-sm opacity-90">식물이 기뻐해요!</p>
              </div>
            </motion.div>
          </>
        )}

      </div>
      <div className="relative z-10 w-full max-w-4xl mx-auto p-6 space-y-6">
        {/* 바람 불기 힌트 */}
        {showBlowHint && !bugsBlownAway && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-4 rounded-full shadow-2xl z-50 flex items-center gap-3"
          >
            <motion.span
              className="text-3xl"
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            >
              💨
            </motion.span>
            <div>
              <p className="font-bold">마이크에 바람을 불어보세요!</p>
              <p className="text-sm opacity-90">벌레들을 날려버릴 수 있어요</p>
            </div>
          </motion.div>
        )}

        {/* 바람 불고 있음 표시 */}
        {isBlowing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white px-6 py-3 rounded-full shadow-2xl z-50 font-bold"
          >
            🌬️ 바람 불고 있어요!
          </motion.div>
        )}

        {/* 캐릭터 영역 */}
        <motion.div
          className="h-[40vh] flex flex-col items-center justify-center relative"
          animate={{
            scale: characterMood.scale,
            rotate: characterMood.rotation,
          }}
          transition={{ duration: 0.5 }}
        >
          {/* 벌레 레이어: 부모의 정중앙에 고정 */}
          {(bugStatus?.value === 'critical' || bugStatus?.value === 'warning') && !bugsBlownAway && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full h-full flex items-center justify-center">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`bug-${i}`}
                  className="absolute text-3xl z-40" // 캐릭터(z-30)보다 위
                  initial={{
                    x: (Math.random() - 0.5) * 100, // 시작 시점부터 캐릭터 주변에 분산
                    y: (Math.random() - 0.5) * 100,
                  }}
                  animate={
                    isBlowing
                      ? {
                        x: window.innerWidth, // 바람 불면 화면 오른쪽으로 퇴장
                        opacity: 0,
                      }
                      : {
                        // 캐릭터 중심(0, 0)을 기준으로 무작위 비행
                        x: [
                          (Math.random() - 0.5) * 250,
                          (Math.random() - 0.5) * 250,
                          (Math.random() - 0.5) * 250
                        ],
                        y: [
                          (Math.random() - 0.5) * 250,
                          (Math.random() - 0.5) * 250,
                          (Math.random() - 0.5) * 250
                        ],
                      }
                  }
                  transition={{
                    duration: isBlowing ? 0.8 : 3 + Math.random() * 2,
                    repeat: isBlowing ? 0 : Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {i % 3 === 0 ? '🦟' : i % 3 === 1 ? '🪰' : '🐛'}
                </motion.div>
              ))}
            </div>
          )}

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
            {characterMood.emoji}
          </motion.div>

          <motion.button
            onClick={() => setShowCamera(true)}
            className="text-3xl font-bold text-green-800 hover:text-green-600 transition-colors flex items-center gap-3 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg z-30 relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {plantName}
            <Video className="size-6" />
          </motion.button>

          <p className={`text-lg font-medium mt-3 text-center ${characterMood.color} z-30 relative`}>
            {characterMood.mood === 'happy' ? '건강하게 자라고 있어요!' :
              characterMood.mood === 'worried' ? '조금 신경써주세요' :
                characterMood.mood === 'suffering' ? '벌레들이 괴롭혀요!' :
                  characterMood.mood === 'relieved' ? '고마워요! 이제 괜찮아요! 🎉' :
                    characterMood.mood === 'watered' ? '시원해요! 감사합니다! 💙' :
                      characterMood.mood === 'fighting' ? '벌레들아, 물러가라! 💪' :
                        characterMood.mood === 'sick' ? '아파요... 도와주세요' :
                          '도움이 필요해요!'}
          </p>
        </motion.div>

        {/* --- 생장 단계 인터페이스 --- */}
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
              <p className="text-sm text-emerald-700/70 mt-1">심은 지 {daysSincePlanted}일째, 무럭무럭 자라는 중!</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600">{growthProgress}%</span>
              <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Progress</p>
            </div>
          </div>

          {/* 타임라인 바 */}
          <div className="relative pt-8 pb-4 px-2">
            {/* 배경 라인 */}
            <div className="absolute top-[42px] left-0 right-0 h-1.5 bg-emerald-100 rounded-full" />

            {/* 진행 라인 */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${growthProgress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-[42px] left-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full z-10 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            />

            {/* 단계별 아이콘 점들 */}
            <div className="relative flex justify-between z-20">
              {growthStages.map((stage, idx) => {
                const isReached = growthProgress >= stage.minProgress;
                return (
                  <div key={idx} className="flex flex-col items-center group">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isReached ? [1, 1.2, 1] : 1,
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
                    {/* 수확 시기 팁 (결실 단계 클릭 시 노출 가능) */}
                    {stage.label === '결실' && isReached && (
                      <div className="absolute -bottom-10 whitespace-nowrap bg-emerald-600 text-white text-[10px] px-2 py-1 rounded-md animate-bounce">
                        지금이 채취 적기! ✂️
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
        {/* ------------------------- */}

        {/* 상세 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statusData.map((status, index) => {
            const StatusIcon = status.icon;
            const colors = getStatusColor(status.value);
            const StatusBadgeIcon = colors.icon;

            // 습도와 벌레는 '액션 아이템'으로 분류
            const isActionItem = status.label === '습도' || status.label === '벌레';
            const actionType = status.label === '습도' ? 'humidity' : status.label === '벌레' ? 'bug' : 'tip';
            const displayMessage = getIndicatorMessage(status.label, status.value);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className={`border-2 ${colors.border} ${colors.bg} shadow-lg overflow-hidden`}>
                  <CardContent className="pt-6">
                    {/* 카드 클릭 영역 - 이제 모든 카드가 cursor-pointer 임 */}
                    <button
                      onClick={() => setSelectedAction(selectedAction === status.label ? null : status.label)}
                      className="w-full text-left cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${colors.iconBg}`}>
                          <StatusIcon className={`size-6 ${colors.text}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-800">{status.label}</h3>
                            <StatusBadgeIcon className={`size-5 ${colors.text}`} />
                          </div>
                          <p className={`text-sm ${colors.text}`}>
                            {displayMessage}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* 클릭 시 열리는 상세 영역 */}
                    {selectedAction === status.label && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-black/5"
                      >
                        {isActionItem ? (
                          /* 1. 습도/벌레인 경우: 실행 버튼 표시 */
                          <Button
                            onClick={() => handleActionClick(actionType)}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg font-bold"
                          >
                            {status.label === '습도' ? (
                              <><Droplets className="size-4 mr-2" /> 물주기 실행</>
                            ) : (
                              <><Bug className="size-4 mr-2" /> 바람불기 실행</>
                            )}
                          </Button>
                        ) : (
                          /* 2. 그 외 항목인 경우: 맞춤형 가이드 팁 표시 */
                          <div className="bg-white/40 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2 text-emerald-700">
                              <Leaf className="size-4" />
                              <span className="text-xs font-black uppercase tracking-tighter">Care Tip</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
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
        <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="size-5 text-green-600" />
              실시간 카메라 - {plantName}
            </DialogTitle>
            <DialogDescription>
              기기의 카메라를 통해 실시간으로 식물 상태를 확인하세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {/* 실제로는 기기 카메라 스트리밍 영상이 들어갈 위치 */}
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=800"
                alt={`${plantName} 실시간 영상`}
                className="w-full h-full object-cover"
              />

              {/* 라이브 표시 */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                <span className="size-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>

              {/* 타임스탬프 */}
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                {new Date().toLocaleString('ko-KR')}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  console.log('스냅샷 저장');
                  alert('스냅샷이 저장되었습니다!');
                }}
              >
                📸 스냅샷 저장
              </Button>
              <Button
                variant="outline"
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