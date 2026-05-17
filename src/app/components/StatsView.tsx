import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Droplets, Sun, Sprout, Bug, Thermometer, AlertTriangle,
    Calendar as CalendarIcon, Library, TrendingUp, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

// 상단 SENSOR_TYPES 배열에 unit 추가
const SENSOR_TYPES = [
    { id: 'moisture', label: '습도', icon: Droplets, color: '#10b981', unit: '%' },
    { id: 'light', label: '조도', icon: Sun, color: '#f59e0b', unit: 'lux' },
    { id: 'soil', label: '흙의 상태', icon: Sprout, color: '#059669', unit: '%' },
    { id: 'bug', label: '벌레', icon: Bug, color: '#64748b', unit: '마리' },
    { id: 'temperature', label: '온도', icon: Thermometer, color: '#ef4444', unit: '°C' },
    { id: 'disease', label: '질병', icon: AlertTriangle, color: '#a855f7', unit: '' },
];

interface HistoryData {
    timestamp: string;
    value: number;
    type: string;
}

interface StatsViewProps {
    setError: (val: boolean) => void;
}

export function StatsView({ setError }: StatsViewProps) {
    const [searchParams] = useSearchParams();
    const plantId = searchParams.get('plantId');

    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [selectedType, setSelectedType] = useState('moisture');
    const [isLoading, setIsLoading] = useState(false);

    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const activeSensor = SENSOR_TYPES.find(t => t.id === selectedType) || SENSOR_TYPES[0];

    const fetchHistory = async () => {
        if (!plantId) return;

        setIsLoading(true);
        try {
            const res = await api.get(`/plants/${plantId}/sensors/history`, {
                params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    type: selectedType
                }
            });
            setHistoryData(res.data);
            console.log("📦 Axios 응답 전체 객체:", res);
            console.log("👀 실제 서버가 준 알맹이 (res.data):", res.data);
            setError(false);
        } catch (err) {
            console.error("기록 조회 실패:", err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [selectedType, dateRange, plantId]);

    // 평균값 계산
    const averageValue = historyData.length > 0
        ? (historyData.reduce((acc, c) => acc + c.value, 0) / historyData.length).toFixed(1)
        : '-';

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-6 pb-24 relative overflow-hidden">
            {/* 배경 데코레이션 */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl -z-10" />

            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                {/* 🎯 [개선] 중앙 정렬된 데이터 도서관 헤더 */}
                <header className="pt-6 pb-4 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                    >
                        {/* 상단 아이콘 박스: 더 둥글고 임팩트 있게 */}
                        <div className="p-4 bg-emerald-600 text-white rounded-[2rem] shadow-xl shadow-emerald-200/50 mb-6 group hover:scale-110 transition-transform duration-500">
                            <Library size={32} className="group-hover:rotate-12 transition-transform" />
                        </div>

                        {/* 타이틀 영역 */}
                        <div className="space-y-2">
                            <div className="flex flex-col items-center">
                                <h2 className="text-4xl font-black text-emerald-900 tracking-tighter leading-tight">
                                    데이터 수치 도서관
                                </h2>
                                {/* 장식용 밑선 (은은하게) */}
                                <div className="w-12 h-1.5 bg-emerald-500/20 rounded-full mt-1" />
                            </div>

                            {/* 서브 설명: 중앙 정렬 최적화 */}
                            <p className="text-emerald-700/60 font-bold flex items-center justify-center gap-1.5 text-sm mt-2">
                                <Activity size={14} className="text-emerald-500" />
                                식물의 성장 패턴을 분석하고 기록합니다
                            </p>
                        </div>
                    </motion.div>
                </header>

                {/* 센서 타입 필터 그리드 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {SENSOR_TYPES.map((type, idx) => (
                        <motion.button
                            key={type.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedType(type.id)}
                            className={`relative px-4 py-4 flex flex-col items-center gap-2 rounded-[2rem] border-2 transition-all group ${selectedType === type.id
                                ? 'bg-white border-emerald-500 shadow-xl shadow-emerald-100 scale-105 z-20'
                                : 'bg-white/40 border-white/60 text-emerald-800/60 hover:bg-white/60 hover:border-emerald-200'
                                }`}
                        >
                            <type.icon
                                className={`size-6 transition-colors ${selectedType === type.id ? 'text-emerald-600' : 'text-emerald-400'}`}
                            />
                            <span className={`text-xs font-black tracking-tight ${selectedType === type.id ? 'text-emerald-900' : 'text-emerald-800/60'}`}>
                                {type.label}
                            </span>
                            {selectedType === type.id && (
                                <motion.div layoutId="active-dot" className="absolute -bottom-1 w-1 h-1 bg-emerald-500 rounded-full" />
                            )}
                        </motion.button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* 통계 및 설정 패널 (좌측) */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Card className="border-none bg-emerald-900 text-white shadow-2xl rounded-[2.5rem] overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <TrendingUp size={80} />
                                </div>
                                <CardHeader className="pb-2 relative z-10">
                                    <CardDescription className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">Selected Average</CardDescription>
                                    <CardTitle className="text-5xl font-black tracking-tighter flex items-baseline gap-1">
                                        {averageValue}
                                        <span className="text-lg font-bold text-emerald-400/60">{activeSensor.unit}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <p className="text-xs text-emerald-200/80 leading-relaxed font-medium">
                                        선택한 기간 동안의 평균 <span className="text-white font-bold">{activeSensor.label}</span> 수치입니다.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="w-full" // 박스가 밀리지 않게 명시적 너비 설정
                        >
                            <Card className="border-none bg-white/60 backdrop-blur-md rounded-[2.5rem] p-5 md:p-6 shadow-xl border border-white/40 overflow-hidden">
                                <div className="space-y-6">
                                    {/* 시작일 설정 */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                                            <CalendarIcon className="size-3" /> 시작일
                                        </label>
                                        <div className="relative w-full"> {/* 감싸는 div 추가로 안정성 확보 */}
                                            <input
                                                type="date"
                                                value={dateRange.startDate}
                                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                                className="w-full max-w-full box-border text-sm font-bold p-3 rounded-2xl bg-white/80 border-2 border-emerald-100 text-emerald-900 focus:border-emerald-500 focus:ring-0 outline-none transition-colors appearance-none"
                                            // appearance-none은 브라우저 기본 스타일 간섭을 줄여줍니다.
                                            />
                                        </div>
                                    </div>

                                    {/* 종료일 설정 */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                                            <CalendarIcon className="size-3" /> 종료일
                                        </label>
                                        <div className="relative w-full">
                                            <input
                                                type="date"
                                                value={dateRange.endDate}
                                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                                className="w-full max-w-full box-border text-sm font-bold p-3 rounded-2xl bg-white/80 border-2 border-emerald-100 text-emerald-900 focus:border-emerald-500 focus:ring-0 outline-none transition-colors appearance-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* 메인 차트 패널 (우측) */}
                    <motion.div
                        className="lg:col-span-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="h-full border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-md border border-white">
                            <CardHeader className="border-b border-emerald-50 px-8 py-8 flex flex-row justify-between items-center bg-white/40">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">
                                            {activeSensor.label} 추이 분석
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-slate-500 font-medium">시간의 흐름에 따른 식물의 건강 변화를 확인하세요</CardDescription>
                                </div>
                                {isLoading && (
                                    <div className="size-6 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
                                )}
                            </CardHeader>
                            <CardContent className="p-8 h-[450px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={historyData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={activeSensor.color} stopOpacity={0.4} />
                                                <stop offset="95%" stopColor={activeSensor.color} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={(str) => new Date(str).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                            stroke="#64748b"
                                            fontSize={11}
                                            fontWeight={700}
                                            tickMargin={15}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            fontSize={11}
                                            fontWeight={700}
                                            tickMargin={15}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-2xl border-none backdrop-blur-lg">
                                                            <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">{new Date(label).toLocaleString()}</p>
                                                            <p className="text-lg font-black">{payload[0].value}<span className="text-xs ml-0.5 opacity-70">{activeSensor.unit}</span></p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={activeSensor.color}
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}