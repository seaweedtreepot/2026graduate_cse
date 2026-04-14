import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Sprout, Plus, ChevronRight, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../api/axios';

interface Plant {
    plantId: number;
    name: string;      // 식물 별명
    species: string;   // 식물 종류
    status: 'good' | 'warning' | 'critical';
    level: number;     // 생장 단계
}

export function PlantList() {
    const navigate = useNavigate();
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. 서버에서 식물 목록 받아오기
    useEffect(() => {
        const fetchPlants = async () => {
            try {
                const res = await api.get('/users/me/plants');
                setPlants(res.data);
            } catch (err) {
                console.error("목록 호출 실패:", err);
                // 테스트용 데이터 (서버 안 켜져있을 때 확인용)
                // setPlants([{ plantId: 1, name: '바질이', species: 'Basil', status: 'good', level: 3 }]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlants();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return 'bg-green-500';
            case 'warning': return 'bg-amber-500';
            case 'critical': return 'bg-rose-500';
            default: return 'bg-slate-300';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* 헤더 섹션 */}
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-emerald-900">나의 정원</h1>
                        <p className="text-emerald-700/60 font-medium">동현님, 오늘은 식물들이 얼마나 자랐을까요?</p>
                    </div>
                    <Button
                        onClick={() => navigate('/plant-selection')}
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl gap-2 shadow-lg"
                    >
                        <Plus className="size-4" /> 새 식물 등록
                    </Button>
                </header>

                {isLoading ? (
                    <div className="h-64 flex items-center justify-center text-emerald-500 animate-pulse">정보를 불러오는 중...</div>
                ) : plants.length === 0 ? (
                    /* 식물이 없을 때 */
                    <Card className="border-dashed border-2 border-emerald-200 bg-emerald-50/30 p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <Sprout className="size-16 text-emerald-200" />
                            <div className="space-y-1">
                                <p className="text-xl font-bold text-emerald-900">아직 등록된 식물이 없어요</p>
                                <p className="text-sm text-emerald-600/70">첫 번째 식물을 등록하고 함께 성장을 지켜보세요!</p>
                            </div>
                            <Button onClick={() => navigate('/plant-selection')} variant="outline" className="mt-4 border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                                식물 등록하러 가기
                            </Button>
                        </div>
                    </Card>
                ) : (
                    /* 식물 목록 그리드 */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plants.map((plant) => (
                            <motion.div
                                key={plant.plantId}
                                whileHover={{ y: -5 }}
                                onClick={() => navigate(`/plant-status?id=${plant.plantId}&plant=${plant.name}&level=${plant.level}`)}
                                className="cursor-pointer"
                            >
                                <Card className="border-none shadow-md hover:shadow-xl transition-all overflow-hidden group">
                                    <CardContent className="p-0">
                                        <div className="flex">
                                            {/* 상태 표시 컬러 바 */}
                                            <div className={`w-3 ${getStatusColor(plant.status)}`} />

                                            <div className="flex-1 p-6 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl">
                                                        {plant.level === 5 ? '🍅' : plant.level >= 3 ? '🌳' : '🌱'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-xl text-slate-800">{plant.name}</h3>
                                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase font-bold">{plant.species}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                                                <Activity className="size-3" />
                                                                Level {plant.level}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-medium tracking-tight">
                                                                {plant.status === 'good' ? '건강함' : plant.status === 'warning' ? '관심 필요' : '조치 필요'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="size-6 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}