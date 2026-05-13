import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Leaf, Calendar, Sparkles, ArrowRight, ArrowLeft, Tag, Droplets, Sun, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

// 1. 바질만 남긴 심플 데이터
const plants = [
  { id: 'basil', name: 'Basil', nameKo: '바질', emoji: '🌿' },
];

export function PlantSelection() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [plantedDate, setPlantedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  // 식물 선택 시 (바질 클릭 시)
  const selectPlant = (id: string) => {
    setSelectedPlant(id);
    setNickname('바질이'); // 기본 이름 미리 셋팅
    setStep(2);
  };

  const handleFinalConfirm = async () => {
    setIsLoading(true);
    try {
      // 바질 정보 고정 사용
      const plantInfo = plants[0];
      const response = await api.post('/users/me/plants', {
        species: plantInfo.name,
        name: nickname,
        plantedAt: plantedDate,
        level: 1
      });
      const newPlantId = response.data.id || response.data.plantId;
      navigate(`/plant-status?id=${newPlantId}&plant=${nickname}&plantedAt=${plantedDate}&level=1`);
    } catch (err) {
      alert("식물 등록에 실패했습니다. (서버 연결 확인 필요)");
    } finally {
      setIsLoading(false);
    }
  };

  const variants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-6 overflow-hidden text-emerald-900 font-sans">

      {/* 상단 프로그레스 바 (6단계) */}
      <div className="w-full max-w-sm mb-12 flex gap-1.5 px-4">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-emerald-600' : 'bg-emerald-200'}`} />
        ))}
      </div>

      <div className="w-full max-w-md relative">
        <AnimatePresence mode="wait">

          {/* Step 1: 종류 선택 (바질 단일) */}
          {step === 1 && (
            <motion.div key="step1" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-8 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-black">무엇을 심을까요?</h2>
                <p className="text-emerald-700/70 font-medium">현재 바질 재배가 가능합니다</p>
              </div>
              <button
                onClick={() => selectPlant('basil')}
                className="w-full p-10 rounded-[3rem] bg-white shadow-2xl hover:scale-105 transition-transform border-4 border-transparent hover:border-emerald-500 group"
              >
                <span className="text-7xl block mb-4 group-hover:animate-bounce-slow">🌿</span>
                <span className="text-2xl font-black block">바질 (Basil)</span>
                <span className="text-sm text-emerald-600 font-bold mt-2 inline-block bg-emerald-50 px-3 py-1 rounded-full">난이도: 쉬움</span>
              </button>
            </motion.div>
          )}

          {/* Step 2: 이름 입력 */}
          {step === 2 && (
            <motion.div key="step2" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-8 text-center">
              <h2 className="text-3xl font-black">이름이 무엇인가요?</h2>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                <Input
                  autoFocus
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="h-16 pl-12 text-2xl font-bold rounded-2xl border-none shadow-xl focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>
              <Button onClick={() => setStep(3)} disabled={!nickname} className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-bold text-lg">다음으로 <ArrowRight className="ml-2" /></Button>
            </motion.div>
          )}

          {/* Step 3: 날짜 선택 */}
          {step === 3 && (
            <motion.div key="step3" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-8 text-center">
              <h2 className="text-3xl font-black">언제 심으셨나요?</h2>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                <Input type="date" value={plantedDate} onChange={(e) => setPlantedDate(e.target.value)} className="h-16 pl-12 text-xl font-bold rounded-2xl border-none shadow-xl" />
              </div>
              <Button onClick={() => setStep(4)} className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-bold text-lg">심기 가이드 보기 <ArrowRight className="ml-2" /></Button>
            </motion.div>
          )}

          {/* Step 4~6 가이드 (생략 없이 유지하여 시연 시나리오 강화) */}
          {step === 4 && (
            <motion.div key="step4" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-8 text-center px-4">
              <div className="size-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><Droplets size={48} /></div>
              <div className="space-y-4">
                <span className="text-blue-600 font-black tracking-widest text-sm uppercase">Step 01. 토양 준비</span>
                <h2 className="text-2xl font-bold leading-tight">배양토를 넣고<br />물이 스며들도록 흠뻑 주세요.</h2>
              </div>
              <Button onClick={() => setStep(5)} className="w-full h-14 rounded-2xl bg-blue-600 text-white font-bold text-lg">확인했어요</Button>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-8 text-center px-4">
              <div className="size-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><Sun size={48} /></div>
              <div className="space-y-4">
                <span className="text-orange-600 font-black tracking-widest text-sm uppercase">Step 02. 씨앗 심기</span>
                <h2 className="text-2xl font-bold leading-tight">씨앗은 1cm 깊이로 심고<br />햇빛이 잘 드는 곳에 두세요.</h2>
              </div>
              <Button onClick={() => setStep(6)} className="w-full h-14 rounded-2xl bg-orange-600 text-white font-bold text-lg">알겠어요</Button>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-8 text-center px-4">
              <div className="size-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><Timer size={48} /></div>
              <div className="space-y-4">
                <span className="text-emerald-600 font-black tracking-widest text-sm uppercase">Step 03. 기다림</span>
                <h2 className="text-2xl font-bold leading-tight">7~10일 정도 지나면<br />예쁜 새싹이 자라나요!</h2>
              </div>
              <Button onClick={handleFinalConfirm} disabled={isLoading} className="w-full h-16 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl shadow-xl">
                {isLoading ? '연결 중...' : '바질 키우기 시작 ✨'}
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 뒤로가기 버튼 */}
      {step > 1 && !isLoading && (
        <button onClick={() => setStep(step - 1)} className="mt-8 flex items-center gap-2 text-emerald-700 font-bold opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft size={18} /> 이전 단계로
        </button>
      )}
    </div>
  );
}