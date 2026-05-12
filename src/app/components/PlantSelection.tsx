import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Check, Leaf, Calendar, Sparkles, Sprout, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

interface Plant {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  growthTime: string;
  difficulty: string;
}

export function PlantSelection() {
  const navigate = useNavigate();
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [plantedDate, setPlantedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  const plants: Plant[] = [
    { id: 'basil', name: 'Basil', nameKo: '바질', description: '향긋한 허브로 요리에 자주 사용됩니다', growthTime: '6-8주', difficulty: '쉬움' },
    { id: 'mint', name: 'Mint', nameKo: '민트', description: '상쾌한 향이 나는 허브입니다', growthTime: '4-6주', difficulty: '쉬움' },
    { id: 'lettuce', name: 'Lettuce', nameKo: '상추', description: '샐러드의 기본 재료입니다', growthTime: '4-5주', difficulty: '쉬움' },
    { id: 'cherry-tomato', name: 'Cherry Tomato', nameKo: '방울토마토', description: '달콤한 미니 토마토입니다', growthTime: '8-10주', difficulty: '보통' },
    { id: 'strawberry', name: 'Strawberry', nameKo: '딸기', description: '달콤한 과일입니다', growthTime: '10-12주', difficulty: '보통' },
    { id: 'kale', name: 'Kale', nameKo: '케일', description: '영양이 풍부한 슈퍼푸드입니다', growthTime: '6-8주', difficulty: '쉬움' },
  ];

  const handleConfirm = async () => {
    if (!selectedPlant || !plantedDate) return;
    setIsLoading(true);

    try {
      const plantInfo = plants.find(p => p.id === selectedPlant);
      const response = await api.post('/users/me/plants', {
        species: plantInfo?.name,
        name: plantInfo?.nameKo,
        plantedAt: plantedDate,
        level: 1
      });

      // 서버 응답에서 받은 진짜 ID 활용 (응답 필드명은 서버 확인 필요)
      const newPlantId = response.data.id || response.data.plantId;

      setIsLoading(false);
      navigate(`/plant-status?id=${newPlantId}&plant=${plantInfo?.nameKo}&plantedAt=${plantedDate}&level=1`);
    } catch (err) {
      console.error("식물 등록 실패:", err);
      alert("식물 등록에 실패했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '쉬움': return 'text-emerald-600 bg-emerald-50';
      case '보통': return 'text-amber-600 bg-amber-50';
      case '어려움': return 'text-rose-600 bg-rose-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-4 relative overflow-hidden">
      {/* 배경 블러 장식 */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl animate-pulse delay-700" />

      <Card className="w-full max-w-4xl border-none shadow-2xl bg-white/80 backdrop-blur-md z-10 rounded-3xl overflow-hidden">
        <CardHeader className="space-y-4 border-b border-emerald-100/50 pb-6 bg-white/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200">
                <Sprout size={28} className="animate-bounce-slow" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl font-black text-emerald-900 tracking-tight">
                  새로운 씨앗 심기
                </CardTitle>
                <CardDescription className="text-emerald-700 font-medium">
                  당신의 정원에서 자라날 첫 번째 친구를 골라주세요
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-white/60 p-3 rounded-2xl border border-emerald-100 shadow-sm">
              <Label htmlFor="planted-date" className="text-[11px] font-black text-emerald-800 flex items-center gap-1 uppercase tracking-wider">
                <Calendar className="size-3" /> 심은 날짜
              </Label>
              <Input
                id="planted-date"
                type="date"
                value={plantedDate}
                onChange={(e) => setPlantedDate(e.target.value)}
                className="h-9 text-sm bg-transparent border-none focus:ring-0 font-bold text-emerald-900"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {plants.map((plant, index) => (
              <motion.button
                key={plant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPlant(plant.id)}
                className={`relative p-6 rounded-[2.5rem] border-2 transition-all text-left group overflow-hidden ${selectedPlant === plant.id
                    ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-100'
                    : 'border-slate-100 bg-white/40 hover:border-emerald-200 hover:bg-white/60'
                  }`}
              >
                <AnimatePresence>
                  {selectedPlant === plant.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute top-4 right-4 bg-emerald-500 rounded-full p-1.5 shadow-lg z-20"
                    >
                      <Check className="size-4 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative z-10 space-y-3">
                  <div>
                    <h3 className={`font-black text-xl tracking-tight transition-colors ${selectedPlant === plant.id ? 'text-emerald-900' : 'text-slate-800'
                      }`}>
                      {plant.nameKo}
                    </h3>
                    <p className="text-[10px] text-emerald-600/50 font-black uppercase tracking-widest">{plant.name}</p>
                  </div>

                  <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-2">
                    {plant.description}
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full shadow-sm ${getDifficultyColor(plant.difficulty)}`}>
                      {plant.difficulty}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      {plant.growthTime}
                    </span>
                  </div>
                </div>

                <Leaf className={`absolute -bottom-4 -right-4 size-24 transition-opacity duration-500 ${selectedPlant === plant.id ? 'opacity-10 text-emerald-500' : 'opacity-5 text-slate-200'
                  }`} />
              </motion.button>
            ))}
          </div>

          <motion.div
            whileHover={selectedPlant ? { scale: 1.02 } : {}}
            whileTap={selectedPlant ? { scale: 0.98 } : {}}
          >
            <Button
              onClick={handleConfirm}
              className={`w-full h-16 text-xl font-black rounded-3xl shadow-2xl transition-all ${selectedPlant
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              disabled={!selectedPlant || !plantedDate || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  씨앗을 심는 중...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles size={24} /> 정원 가꾸기 시작
                </span>
              )}
            </Button>
          </motion.div>

          <p className="text-center mt-6 text-xs text-emerald-800/40 font-bold flex items-center justify-center gap-1">
            <Info size={12} /> 나중에 식물 정보를 변경할 수 있어요
          </p>
        </CardContent>
      </Card>
    </div>
  );
}