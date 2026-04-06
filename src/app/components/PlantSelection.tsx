import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Check, Leaf } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);

  const plants: Plant[] = [
    {
      id: 'basil',
      name: 'Basil',
      nameKo: '바질',
      description: '향긋한 허브로 요리에 자주 사용됩니다',
      growthTime: '6-8주',
      difficulty: '쉬움',
    },
    {
      id: 'mint',
      name: 'Mint',
      nameKo: '민트',
      description: '상쾌한 향이 나는 허브입니다',
      growthTime: '4-6주',
      difficulty: '쉬움',
    },
    {
      id: 'lettuce',
      name: 'Lettuce',
      nameKo: '상추',
      description: '샐러드의 기본 재료입니다',
      growthTime: '4-5주',
      difficulty: '쉬움',
    },
    {
      id: 'cherry-tomato',
      name: 'Cherry Tomato',
      nameKo: '방울토마토',
      description: '달콤한 미니 토마토입니다',
      growthTime: '8-10주',
      difficulty: '보통',
    },
    {
      id: 'strawberry',
      name: 'Strawberry',
      nameKo: '딸기',
      description: '달콤한 과일입니다',
      growthTime: '10-12주',
      difficulty: '보통',
    },
    {
      id: 'kale',
      name: 'Kale',
      nameKo: '케일',
      description: '영양이 풍부한 슈퍼푸드입니다',
      growthTime: '6-8주',
      difficulty: '쉬움',
    },
  ];

  const handleConfirm = async () => {
    if (!selectedPlant) return;
    
    setIsLoading(true);
    setTimeout(() => {
      const plant = plants.find(p => p.id === selectedPlant);
      console.log('선택된 식물:', plant);
      setIsLoading(false);
      // 식물 상태 페이지로 이동
      navigate(`/plant-status?plant=${plant?.nameKo}`);
    }, 1000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '쉬움':
        return 'text-green-600 bg-green-50';
      case '보통':
        return 'text-yellow-600 bg-yellow-50';
      case '어려움':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Leaf className="size-6 text-green-600" />
          식물 선택
        </CardTitle>
        <CardDescription>
          재배하실 식물을 선택해주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {plants.map((plant) => (
            <button
              key={plant.id}
              onClick={() => setSelectedPlant(plant.id)}
              className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                selectedPlant === plant.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-border hover:border-green-300'
              }`}
            >
              {selectedPlant === plant.id && (
                <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1">
                  <Check className="size-4 text-white" />
                </div>
              )}
              <div className="space-y-2">
                <div>
                  <h3 className="font-semibold text-lg">{plant.nameKo}</h3>
                  <p className="text-sm text-muted-foreground">{plant.name}</p>
                </div>
                <p className="text-sm">{plant.description}</p>
                <div className="flex items-center gap-2 pt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(plant.difficulty)}`}>
                    {plant.difficulty}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {plant.growthTime}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleConfirm}
          className="w-full"
          disabled={!selectedPlant || isLoading}
        >
          {isLoading ? '선택 중...' : '선택 완료'}
        </Button>
      </CardContent>
    </Card>
  );
}