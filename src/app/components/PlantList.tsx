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
    const [isError, setIsError] = useState(false);

    const fetchPlants = async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const res = await api.get('/users/me/plants');
            setPlants(res.data);
        } catch (err) {
            console.error("목록 호출 실패:", err);
            setIsError(true);
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

    // 건강한 식물 수 계산
    const healthyPlantsCount = plants.filter(p => p.status === 'good').length;


    return (
        <div className="min-h-[100dvh] w-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-6 pb-32 relative overflow-x-hidden">
            {/* [기존 유지] 배경 장식 */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-green-200/20 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -z-10" />

            <div className="max-w-5xl mx-auto space-y-8 relative z-10">

                {/* [기존 유지] 상단 알림 바 */}
                <AnimatePresence>
                    {isError && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between shadow-sm mb-4"
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

                {/* 🎯 [개선] 중앙 정렬된 헤더 섹션 */}
                <header className="pt-4 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                    >
                        {/* 상단 칩 (Chip) 스타일 */}
                        <div className="flex items-center gap-2 mb-3 bg-white/40 px-4 py-1 rounded-full border border-white/60 shadow-sm">
                            <Leaf className="size-3.5 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] opacity-80">
                                My Digital Garden
                            </span>
                        </div>

                        {/* 메인 타이틀 */}
                        <h1 className="text-4xl font-black text-emerald-950 tracking-tighter mb-2">
                            나의 비밀 정원
                        </h1>

                        {/* 서브 설명 (줄바꿈 최적화) */}
                        <p className="text-sm text-emerald-800/60 font-medium leading-relaxed max-w-[260px]">
                            <span className="text-emerald-600 font-bold">{userInfo?.name || "정원사님"}</span>,
                            오늘 식물들의 <br /> 기분은 어떠신가요?
                        </p>
                    </motion.div>
                </header>

                {/* 🎯 [개선] 통합 가든 대시보드 패널: 중앙 배치 */}
                <div className="w-full flex justify-center pt-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        // 하나의 큰 통합 패널 (반투명 백드롭 플러 사용)
                        className="w-full max-w-sm bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-xl border border-white/80"
                    >
                        <div className="flex items-center justify-center gap-10">

                            {/* 1. 전체 식물 (아이콘 + 숫자) */}
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-2xl shadow-inner border border-emerald-50">
                                    <Leaf className="size-7 text-emerald-300" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest mb-0.5">전체 친구</p>
                                    <p className="text-3xl font-black text-emerald-950 tracking-tighter leading-none">{plants.length}<span className="text-sm font-bold opacity-30 ml-0.5">마리</span></p>
                                </div>
                            </div>

                            {/* 세로 구분선 (은은하게) */}
                            <div className="w-px h-12 bg-emerald-100/50" />

                            {/* 2. 건강한 식물 (아이콘 + 숫자) */}
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-2xl shadow-inner border border-amber-50">
                                    <Sparkles className="size-7 text-amber-300" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-amber-800/40 uppercase tracking-widest mb-0.5">건강한 친구</p>
                                    <p className="text-3xl font-black text-emerald-600 tracking-tighter leading-none">{healthyPlantsCount}<span className="text-sm font-bold opacity-30 ml-0.5">마리</span></p>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </div>
                {/* [개선] 메인 리스트 -> 그리드 레이아웃 */}
                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center text-emerald-500 gap-4">
                        <div className="size-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                        <p className="text-xs font-bold animate-pulse">정원 불러오는 중...</p>
                    </div>
                ) : plants.length === 0 && !isError ? (
                    <Card className="border-none shadow-xl bg-white/60 backdrop-blur-md p-16 text-center rounded-[3rem]">
                        <div className="flex flex-col items-center gap-6">
                            <Sprout className="size-20 text-emerald-300 animate-bounce-slow" />
                            <h2 className="text-2xl font-bold text-emerald-900">정원이 비어있네요</h2>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plants.map((plant, index) => {
                            const status = getStatusConfig(plant.status);
                            return (
                                <motion.div
                                    key={plant.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(`/plant-status?id=${plant.id}&plant=${plant.name}&level=${plant.level}`)}
                                >
                                    <Card className="border-none shadow-xl shadow-emerald-900/5 bg-white/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden cursor-pointer group">
                                        <CardContent className="p-8 flex flex-col items-center relative">
                                            {/* 레벨 표시 */}
                                            <div className="absolute top-6 left-8 text-[10px] font-black text-emerald-800/20 uppercase tracking-widest">
                                                Level {plant.level}
                                            </div>

                                            {/* 캐릭터 비주얼 */}
                                            <div className="relative w-36 h-36 mb-6">
                                                <div className="absolute inset-0 bg-emerald-100/40 rounded-full blur-2xl scale-75 group-hover:scale-110 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                                                <img
                                                    src={`/assets/character/lv${plant.level}_happy.png`}
                                                    className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-110"
                                                    alt={plant.name}
                                                    onError={(e) => (e.currentTarget.src = '🌱')}
                                                />
                                            </div>

                                            {/* 식물 정보 */}
                                            <div className="text-center space-y-3">
                                                <div>
                                                    <h3 className="text-2xl font-black text-emerald-950 group-hover:text-emerald-600 transition-colors">{plant.name}</h3>
                                                    <p className="text-[10px] font-black text-emerald-800/30 uppercase tracking-[0.2em]">{plant.species}</p>
                                                </div>

                                                <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full ${status.color} text-white text-[11px] font-bold shadow-md`}>
                                                    {status.icon} {status.text}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none">
                <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    // 클릭 시 무조건 이동하도록 navigate를 실행합니다.
                    onClick={() => navigate('/plant-selection')}
                    // disabled={isError} <- 이 부분을 제거하여 항상 클릭 가능하게 만듭니다.
                    className={`pointer-events-auto flex items-center gap-3 px-8 py-4 rounded-full font-black text-lg transition-all shadow-2xl ${isError
                            ? 'bg-amber-500 text-white shadow-[0_15px_30px_-5px_rgba(245,158,11,0.5)]' // 에러 시 주황색 (테스트 모드 가시화)
                            : 'bg-emerald-600 text-white shadow-[0_15px_30px_-5px_rgba(16,185,129,0.5)]'
                        }`}
                >
                    {isError ? (
                        <>
                            <Activity className="size-6 animate-pulse" />
                            테스트 모드로 심기
                        </>
                    ) : (
                        <>
                            <Plus className="size-6" />
                            새 식물 심기
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
}