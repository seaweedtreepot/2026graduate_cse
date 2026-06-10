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
    { id: 'soil', label: '토양습도', icon: Sprout, color: '#059669', unit: '%' },
    { id: 'light', label: '조도', icon: Sun, color: '#f59e0b', unit: 'lux' },
    { id: 'temperature', label: '온도', icon: Thermometer, color: '#ef4444', unit: '°C' },
    { id: 'moisture', label: '습도', icon: Droplets, color: '#10b981', unit: '%' },
    { id: 'bug', label: '벌레', icon: Bug, color: '#64748b', unit: '회' },
    { id: 'disease', label: '질병', icon: AlertTriangle, color: '#a855f7', unit: '회' },
];

interface HistoryData {
    timestamp: string;
    value: string;
    type: string;
}

interface StatsViewProps {
    setError: (val: boolean) => void;
}

export function StatsView({ setError }: StatsViewProps) {
    const [searchParams] = useSearchParams();
    const plantId = searchParams.get('plantId');

    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [selectedType, setSelectedType] = useState('soil');
    const [isLoading, setIsLoading] = useState(false);

    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    // 바텀시트 상태 추가
    const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
    // 바텀시트 내에서 임시로 날짜를 들고 있을 로컬 상태
    const [tempStartDate, setTempStartDate] = useState(dateRange.startDate);
    const [tempEndDate, setTempEndDate] = useState(dateRange.endDate);

    // 날짜 범위가 외부에서 바뀔 때 로컬 임시값도 연동
    useEffect(() => {
        setTempStartDate(dateRange.startDate);
        setTempEndDate(dateRange.endDate);
    }, [dateRange]);

    const handleApplyDateRange = () => {
        setDateRange({
            startDate: tempStartDate,
            endDate: tempEndDate,
        });
        setIsDateSheetOpen(false);
    };

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

    const isCategorical = ['soil', 'bug', 'disease'].includes(selectedType);

    // 1. 차트용 데이터 가공 (텍스트 데이터를 수치형 0, 1로 매핑)
    const processedChartData = historyData.map(item => {
        let displayValue = item.value;
        let numericValue = parseFloat(item.value);

        if (isNaN(numericValue)) {
            if (selectedType === 'soil') {
                const isGood = ['적정', 'WET', 'MOIST', 'good', 'normal', '정상'].includes(item.value);
                numericValue = isGood ? 1 : 0;
                displayValue = isGood ? '적정' : '건조함';
            } else if (selectedType === 'bug') {
                const hasBug = (item.value === 'true' || item.value === '발견됨');
                numericValue = hasBug ? 1 : 0;
                displayValue = hasBug ? '발견됨' : '없음';
            } else if (selectedType === 'disease') {
                const isNormal = (item.value === '없음' || item.value === '정상' || item.value === 'none');
                numericValue = isNormal ? 0 : 1;
                displayValue = isNormal ? '정상' : item.value;
            } else {
                numericValue = 0;
            }
        } else {
            // numeric types could be bug=1.0 or bug=0.0
            if (selectedType === 'soil') {
                displayValue = numericValue === 1 ? '적정' : '건조함';
            } else if (selectedType === 'bug') {
                displayValue = numericValue === 1 ? '발견됨' : '없음';
            } else if (selectedType === 'disease') {
                displayValue = numericValue === 0 ? '정상' : '주의/진단됨';
            } else if (selectedType === 'temperature') {
                displayValue = numericValue.toFixed(1);
            } else {
                displayValue = Math.round(numericValue).toString();
            }
        }

        return {
            ...item,
            displayValue,
            value: numericValue
        };
    });

    // 2. 카드에 보여줄 라벨 및 수치 결정
    let displayStatLabel = 'Selected Average';
    let displayStatDesc = (
        <span>선택한 기간 동안의 평균 <span className="text-white font-bold">{activeSensor.label}</span> 수치입니다.</span>
    );
    let displayStatValue = '-';
    let displayUnit = activeSensor.unit;

    if (selectedType === 'bug' || selectedType === 'disease') {
        displayStatLabel = 'Detected Count';
        displayStatDesc = (
            <span>선택한 기간 동안 <span className="text-white font-bold">{activeSensor.label}</span>가 감지된 총 횟수입니다.</span>
        );
        displayStatValue = String(processedChartData.filter(item => item.value === 1).length);
        displayUnit = '회';
    } else if (selectedType === 'soil') {
        displayStatLabel = 'Latest Status';
        displayStatDesc = (
            <span>최근 감지된 <span className="text-white font-bold">{activeSensor.label}</span> 상태입니다.</span>
        );
        if (historyData.length > 0) {
            displayStatValue = historyData[historyData.length - 1].value;
        }
        displayUnit = '';
    } else {
        const numericValues = historyData
            .map(c => parseFloat(c.value))
            .filter(val => !isNaN(val));

        displayStatValue = numericValues.length > 0
            ? (numericValues.reduce((acc, val) => acc + val, 0) / numericValues.length).toFixed(1)
            : '-';
    }

    const yAxisTickFormatter = (val: number) => {
        if (selectedType === 'soil') {
            return val === 0 ? '건조함' : '적정';
        } else if (selectedType === 'bug') {
            return val === 0 ? '없음' : '발견됨';
        } else if (selectedType === 'disease') {
            return val === 0 ? '정상' : '주의';
        }
        return String(val);
    };

    const getYAxisDomain = (): [any, any] => {
        if (isCategorical) return [-0.15, 1.15];
        
        const values = historyData
            .map(item => parseFloat(item.value))
            .filter(val => !isNaN(val));

        if (values.length === 0) return ['auto', 'auto'];

        const min = Math.min(...values);
        const max = Math.max(...values);
        const diff = max - min;
        
        // 데이터 편차가 없거나 매우 작은 경우 최소 마진(데이터의 10% 혹은 2) 설정
        const padding = diff === 0 ? Math.max(2, max * 0.1) : diff * 0.2;

        // 조도(light), 습도(moisture) 등 음수가 불가능한 물리값은 최솟값을 0으로 고정
        const finalMin = ['light', 'moisture'].includes(selectedType)
            ? Math.max(0, Math.floor(min - padding))
            : Math.floor(min - padding);

        const finalMax = Math.ceil(max + padding);

        return [finalMin, finalMax];
    };

    return (
        <div className="h-[100dvh] w-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-4 md:p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] relative overflow-hidden select-none flex flex-col justify-between pt-[calc(env(safe-area-inset-top)+4.5rem)]">
            {/* 배경 데코레이션 */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl -z-10" />

            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-between gap-3 relative z-10 min-h-0">
                {/* 🎯 컴팩트 헤더 */}
                <header className="flex items-center justify-center gap-2 pt-1 pb-1 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2"
                    >
                        <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg">
                            <Library size={18} />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-emerald-900 tracking-tight">
                            데이터 수치 도서관
                        </h2>
                    </motion.div>
                </header>

                {/* 센서 타입 필터 (가로 스크롤 및 콤팩트 디자인) */}
                <div className="flex gap-2 overflow-x-auto py-1 px-1 scrollbar-none -mx-4 md:mx-0 md:grid md:grid-cols-6 md:gap-3">
                    {SENSOR_TYPES.map((type, idx) => (
                        <motion.button
                            key={type.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => setSelectedType(type.id)}
                            className={`flex-shrink-0 px-4 py-2.5 md:py-3.5 flex items-center md:flex-col justify-center gap-2 rounded-2xl border transition-all md:w-full ${
                                selectedType === type.id
                                    ? 'bg-white border-emerald-500 shadow-md scale-[1.02] z-20 text-emerald-950 font-black'
                                    : 'bg-white/40 border-white/60 text-emerald-800/60 hover:bg-white/60 hover:border-emerald-200 font-bold'
                            }`}
                        >
                            <type.icon
                                className={`size-4 md:size-5 transition-colors ${selectedType === type.id ? 'text-emerald-600' : 'text-emerald-400'}`}
                            />
                            <span className="text-[11px] md:text-xs tracking-tight">
                                {type.label}
                            </span>
                        </motion.button>
                    ))}
                </div>

                {/* KPI 요약 배너 & 기간 변경 버튼 일렬 정렬 */}
                <div className="flex gap-2 items-center justify-between px-1">
                    {/* KPI 요약 배너 */}
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-emerald-900 text-white px-3.5 py-2 md:py-2.5 rounded-2xl flex items-center gap-2.5 shadow-md border border-emerald-800"
                    >
                        <span className="text-[9px] font-black text-emerald-400 tracking-wider leading-none">
                            {displayStatLabel === 'Selected Average' ? '평균' : displayStatLabel === 'Detected Count' ? '총' : '최근'}
                        </span>
                        <span className="text-sm md:text-base font-black leading-none flex items-baseline gap-0.5">
                            {displayStatValue}
                            {displayUnit && <span className="text-[10px] text-emerald-300/80">{displayUnit}</span>}
                        </span>
                    </motion.div>

                    {/* 기간 변경 버튼 */}
                    <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setIsDateSheetOpen(true)}
                        className="flex-1 max-w-[280px] bg-white/60 backdrop-blur-md border border-white/40 px-3 py-2 md:py-2.5 rounded-2xl flex items-center justify-between text-[11px] md:text-xs font-bold text-emerald-950 shadow-md hover:bg-white/80 transition-colors"
                    >
                        <div className="flex items-center gap-1.5">
                            <CalendarIcon size={13} className="text-emerald-700" />
                            <span>{dateRange.startDate} ~ {dateRange.endDate}</span>
                        </div>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-black">변경</span>
                    </motion.button>
                </div>

                {/* 메인 차트 패널 */}
                <motion.div
                    className="flex-1 min-h-0 flex flex-col"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="flex-1 min-h-0 border-none shadow-xl rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-md border border-white flex flex-col">
                        <CardHeader className="border-b border-emerald-50/50 px-4 py-3 md:px-6 md:py-4 flex flex-row justify-between items-center bg-white/30">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <CardTitle className="text-sm md:text-base font-black text-slate-800 tracking-tight">
                                        {activeSensor.label} 추이 분석
                                    </CardTitle>
                                </div>
                            </div>
                            {isLoading && (
                                <div className="size-4 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
                            )}
                        </CardHeader>
                        <CardContent className="px-2 pb-2 pt-4 flex-1 min-h-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={processedChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={activeSensor.color} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={activeSensor.color} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(str) => new Date(str).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                                        stroke="#64748b"
                                        fontSize={9}
                                        fontWeight={800}
                                        tickMargin={8}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={9}
                                        fontWeight={800}
                                        tickMargin={8}
                                        axisLine={false}
                                        tickLine={false}
                                        ticks={isCategorical ? [0, 1] : undefined}
                                        tickFormatter={isCategorical ? yAxisTickFormatter : undefined}
                                        domain={getYAxisDomain()}
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const dataItem = payload[0].payload;
                                                const showUnit = !['soil', 'bug', 'disease'].includes(selectedType);
                                                return (
                                                    <div className="bg-emerald-950 text-white p-3 rounded-xl shadow-lg border-none backdrop-blur-lg text-xs">
                                                        <p className="text-[9px] font-black text-emerald-400 uppercase mb-0.5">{new Date(label).toLocaleString()}</p>
                                                        <p className="text-sm font-black">
                                                            {dataItem.displayValue}
                                                            {showUnit && activeSensor.unit && <span className="text-[10px] ml-0.5 opacity-70">{activeSensor.unit}</span>}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area
                                        type={isCategorical ? "step" : "monotone"}
                                        dataKey="value"
                                        stroke={activeSensor.color}
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* 📅 날짜 설정 바텀시트 */}
            <AnimatePresence>
                {isDateSheetOpen && (
                    <>
                        {/* 배경 오버레이 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDateSheetOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
                        />

                        {/* 바텀시트 컨테이너 */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md rounded-t-[2.5rem] p-6 shadow-2xl z-[90] border-t border-emerald-100 max-w-md mx-auto"
                        >
                            {/* 드래그 핸들 데코레이션 */}
                            <div className="w-12 h-1.5 bg-emerald-200 rounded-full mx-auto mb-5" />

                            <div className="space-y-5">
                                <div className="text-center">
                                    <h3 className="text-lg font-black text-emerald-950 flex items-center justify-center gap-1.5">
                                        <CalendarIcon className="size-5 text-emerald-700" /> 기간 범위 설정
                                    </h3>
                                    <p className="text-xs text-emerald-800/60 font-medium mt-1">분석할 시작일과 종료일을 지정해주세요</p>
                                </div>

                                <div className="space-y-4">
                                    {/* 시작일 설정 */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-800/80 flex items-center gap-1 uppercase tracking-wider">
                                            시작일
                                        </label>
                                        <input
                                            type="date"
                                            value={tempStartDate}
                                            onChange={(e) => setTempStartDate(e.target.value)}
                                            className="w-full text-sm font-bold p-3 rounded-2xl bg-emerald-50/50 border-2 border-emerald-100 text-emerald-950 focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
                                        />
                                    </div>

                                    {/* 종료일 설정 */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-800/80 flex items-center gap-1 uppercase tracking-wider">
                                            종료일
                                        </label>
                                        <input
                                            type="date"
                                            value={tempEndDate}
                                            onChange={(e) => setTempEndDate(e.target.value)}
                                            className="w-full text-sm font-bold p-3 rounded-2xl bg-emerald-50/50 border-2 border-emerald-100 text-emerald-950 focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsDateSheetOpen(false)}
                                        className="flex-1 py-5 rounded-2xl border-emerald-200 text-emerald-900 font-bold hover:bg-emerald-50"
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        onClick={handleApplyDateRange}
                                        className="flex-1 py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-200"
                                    >
                                        적용하기
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}