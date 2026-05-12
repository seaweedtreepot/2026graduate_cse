import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Sprout, Plus, ChevronRight, Activity, Leaf, Sparkles, AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { UserContext } from '../context/UserContext';

interface Plant {
    id: number;
    name: string;
    species: string;
    status: string;
    level: number;
}

export function PlantList() {
    const navigate = useNavigate();
    const { userInfo } = useContext(UserContext) || {};
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false); // 서버 연결 오류 상태 추가

    // 서버에서 식물 목록 받아오기 로직을 함수로 분리 (재시도 버튼을 위해)
    const fetchPlants = async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const res = await api.get('/users/me/plants');
            setPlants(res.data);
        } catch (err) {
            console.error("목록 호출 실패:", err);
            setIsError(true); // 에러 상태 활성화
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlants();
    }, []);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'good': return { color: 'bg-emerald-500', text: '건강함', icon: <Sparkles className="size-3" /> };
            case 'warning': return { color: 'bg-amber-500', text: '관심 필요', icon: <Activity className="size-3" /> };
            case 'critical': return { color: 'bg-rose-500', text: '조치 필요', icon: <AlertCircle className="size-3" /> };
            default: return { color: 'bg-slate-300', text: '상태 불명', icon: null };
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-6 relative overflow-hidden">
            {/* 배경 장식 */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-green-200/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />

            <div className="max-w-4xl mx-auto space-y-8 relative z-10">

                {/* 상단 알림 바: 서버 연결이 끊겼을 때만 표시 */}
                <AnimatePresence>
                    {isError && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between shadow-sm"
                        >
                            <div className="flex items-center gap-3 text-rose-600">
                                <WifiOff className="size-5" />
                                <span className="text-sm font-bold">정원 서버와 연결이 원활하지 않아요.</span>
                            </div>
                            <button
                                onClick={fetchPlants}
                                className="flex items-center gap-1 text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl hover:bg-rose-200 transition-colors"
                            >
                                <RefreshCw className="size-3" /> 다시 시도
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 헤더 섹션 */}
                <header className="flex justify-between items-end pb-2">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-2 mb-1">
                            <Leaf className="size-5 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-700 uppercase tracking-widest">My Digital Garden</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-900 tracking-tight">나의 비밀 정원</h1>
                        <p className="text-emerald-800/60 font-medium mt-1">
                            <span className="text-emerald-600 font-bold">{userInfo?.name || "정원사님"}</span>, 오늘 식물들의 기분은 어떠신가요?
                        </p>
                    </motion.div>

                    <Button
                        onClick={() => navigate('/plant-selection')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2 shadow-lg py-6 px-6"
                        disabled={isError} // 에러 시 버튼 비활성화 (선택 사항)
                    >
                        <Plus className="size-5" /> 새 식물 등록
                    </Button>
                </header>

                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center text-emerald-500 gap-4">
                        <div className="size-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                        <p className="font-medium animate-pulse">정원 데이터를 불러오는 중...</p>
                    </div>
                ) : isError ? (
                    /* 서버 에러 시 보여줄 화면 */
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card className="border-none shadow-xl bg-white/60 backdrop-blur-md p-16 text-center rounded-3xl">
                            <div className="flex flex-col items-center gap-6">
                                <div className="p-6 bg-rose-100/50 rounded-full">
                                    <WifiOff className="size-16 text-rose-300" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-rose-900">연결에 실패했습니다</h2>
                                    <p className="text-rose-700/60 font-medium max-w-xs mx-auto">
                                        서버와의 통신이 끊겼습니다. <br /> 인터넷 연결을 확인하거나 잠시 후 다시 시도해 주세요.
                                    </p>
                                </div>
                                <Button
                                    onClick={fetchPlants}
                                    className="mt-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-6 px-8 font-bold"
                                >
                                    정원 다시 불러오기
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ) : plants.length === 0 ? (
                    /* 식물이 없을 때 */
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="border-none shadow-xl bg-white/60 backdrop-blur-md p-16 text-center rounded-3xl">
                            <div className="flex flex-col items-center gap-6">
                                <div className="p-6 bg-emerald-100/50 rounded-full">
                                    <Sprout className="size-20 text-emerald-300 animate-bounce-slow" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-emerald-900">아직 정원이 비어있네요</h2>
                                    <p className="text-emerald-700/60 font-medium">첫 번째 식물 친구를 등록해 보세요!</p>
                                </div>
                                <Button onClick={() => navigate('/plant-selection')} className="mt-4 bg-emerald-600 rounded-xl py-6 px-8 font-bold">
                                    첫 씨앗 심으러 가기
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ) : (
                    /* 식물 목록 그리드 (기존과 동일) */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {plants.map((plant, index) => {
                            const status = getStatusConfig(plant.status);
                            return (
                                <motion.div
                                    key={plant.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -8 }}
                                    onClick={() => navigate(`/plant-status?id=${plant.id}&plant=${plant.name}&level=${plant.level}`)}
                                    className="group"
                                >
                                    <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden cursor-pointer">
                                        <CardContent className="p-0 flex h-full">
                                            <div className={`w-2.5 ${status.color}`} />
                                            <div className="flex-1 p-6 flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="size-16 bg-gradient-to-tr from-emerald-100 to-green-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
                                                        {plant.level === 5 ? '🍅' : plant.level >= 3 ? '🌳' : '🌱'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-black text-xl text-emerald-950 group-hover:text-emerald-700 transition-colors">{plant.name}</h3>
                                                            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md uppercase font-black">{plant.species}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`flex items-center gap-1 text-xs font-bold ${status.color.replace('bg-', 'text-')} px-2 py-0.5 bg-white rounded-full shadow-sm`}>
                                                                {status.icon} {status.text}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="size-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}