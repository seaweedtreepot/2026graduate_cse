import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input'; // Input 컴포넌트 추가
import { Label } from './ui/label'; // Label 컴포넌트 추가
import { Check, Leaf, Calendar } from 'lucide-react'; // Calendar 아이콘 추가
import { motion } from 'framer-motion';
import api from '../api/axios'; // API 인스턴스 추가

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
  // 1. [추가] 심은 날짜 상태 (기본값: 오늘)
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
    // 실제로는 여기서 api.post('/users/me/plants', { species: selectedPlant, plantedAt: plantedDate }) 등을 호출하겠죠?
    try {
      // 1. 서버에 식물 등록 요청 (명세서의 POST /api/v1/users/me/plants 가정)
      const plantInfo = plants.find(p => p.id === selectedPlant);

      const response = await api.post('/users/me/plants', {
        species: plantInfo?.name,      // 식물 종 (예: Basil)
        name: plantInfo?.nameKo,       // 식물 별명 (예: 바질)
        plantedAt: plantedDate,        // 사용자가 선택한 날짜
        level: 1                       // 초기 레벨
      });

      // 2. 서버가 성공적으로 저장하고 생성된 ID를 돌려줌
      // 서버 응답 구조가 { plantId: 123, ... } 형태라고 가정합니다.
      const newPlantId = response.data.plantId;

      setIsLoading(false);

      // 3. 받은 진짜 ID를 주소창에 실어서 이동!
      navigate(`/plant-status?id=${newPlantId}&plant=${plantInfo?.nameKo}&plantedAt=${plantedDate}&level=1`);

    } catch (err) {
      console.error("식물 등록 실패:", err);
      alert("식물 등록에 실패했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '쉬움': return 'text-green-600 bg-green-50';
      case '보통': return 'text-yellow-600 bg-yellow-50';
      case '어려움': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="space-y-1 border-b mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2 text-emerald-700">
                <Leaf className="size-6" />
                식물 등록하기
              </CardTitle>
              <CardDescription>재배하실 식물과 심은 날짜를 선택해주세요</CardDescription>
            </div>

            {/* 3. [추가] 날짜 선택 영역 */}
            <div className="flex flex-col gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <Label htmlFor="planted-date" className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <Calendar className="size-3" /> 심은 날짜 선택
              </Label>
              <Input
                id="planted-date"
                type="date"
                value={plantedDate}
                onChange={(e) => setPlantedDate(e.target.value)}
                className="h-8 text-sm bg-white border-emerald-200 focus:ring-emerald-500"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {plants.map((plant) => (
              <button
                key={plant.id}
                onClick={() => setSelectedPlant(plant.id)}
                className={`relative p-5 rounded-2xl border-2 transition-all text-left group ${selectedPlant === plant.id
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-inner'
                  : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                  }`}
              >
                {selectedPlant === plant.id && (
                  <motion.div
                    layoutId="check"
                    className="absolute top-3 right-3 bg-emerald-500 rounded-full p-1 shadow-lg"
                  >
                    <Check className="size-4 text-white" />
                  </motion.div>
                )}
                <div className="space-y-2">
                  <div>
                    <h3 className={`font-bold text-lg ${selectedPlant === plant.id ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {plant.nameKo}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">{plant.name}</p>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{plant.description}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getDifficultyColor(plant.difficulty)}`}>
                      {plant.difficulty}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {plant.growthTime}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Button
            onClick={handleConfirm}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg font-bold shadow-lg shadow-emerald-200/50 transition-all active:scale-[0.98]"
            disabled={!selectedPlant || !plantedDate || isLoading}
          >
            {isLoading ? '등록 중...' : '식물 키우기 시작'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}