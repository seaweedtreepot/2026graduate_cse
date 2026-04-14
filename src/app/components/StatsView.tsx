import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Droplets, Sun, Sprout, Bug, Thermometer, AlertTriangle,
    Calendar as CalendarIcon, ChevronLeft
} from 'lucide-react';
import api from '../api/axios';

// 6개 항목 정의
const SENSOR_TYPES = [
    { id: 'moisture', label: '습도', icon: Droplets, color: '#3b82f6' },
    { id: 'light', label: '조도', icon: Sun, color: '#f59e0b' },
    { id: 'soil', label: '흙의 상태', icon: Sprout, color: '#10b981' },
    { id: 'bug', label: '벌레', icon: Bug, color: '#64748b' },
    { id: 'temperature', label: '온도', icon: Thermometer, color: '#ef4444' },
    { id: 'disease', label: '질병', icon: AlertTriangle, color: '#a855f7' },
];
interface StatsViewProps {
    setError: (val: boolean) => void;
}
export function StatsView({ setError }: StatsViewProps) {
    interface HistoryData {
        timestamp: string;
        value: number;
        type: string;
    }
    const [searchParams] = useSearchParams();
    const plantId = searchParams.get('id');

    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [selectedType, setSelectedType] = useState('moisture');
    const [isLoading, setIsLoading] = useState(false);

    // 날짜 범위 설정 (기본 최근 7일)
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const activeSensor = SENSOR_TYPES.find(t => t.id === selectedType) || SENSOR_TYPES[0];

    const fetchHistory = async () => {
        if (!plantId) return;
        setIsLoading(true);
        try {
            // 명세서: GET /api/v1/plants/{plantId}/sensors/history?startDate=...&endDate=...&type=...
            const res = await api.get(`/plants/${plantId}/sensors/history`, {
                params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    type: selectedType // 6항목 중 선택된 타입 전송
                }
            });
            setHistoryData(res.data);
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

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 pb-20">
            {/* 헤더 섹션 */}
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black text-emerald-900 flex items-center gap-2">
                    <activeSensor.icon className="size-8" style={{ color: activeSensor.color }} />
                    데이터 수치 도서관
                </h2>
                <p className="text-emerald-700/60 font-medium">과거 기록을 통해 식물의 성장 패턴을 분석합니다.</p>
            </div>

            {/* 6항목 선택 필터 그리드 */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {SENSOR_TYPES.map((type) => (
                    <Button
                        key={type.id}
                        variant={selectedType === type.id ? 'default' : 'outline'}
                        onClick={() => setSelectedType(type.id)}
                        className={`h-auto py-3 flex flex-col gap-1 rounded-2xl transition-all ${selectedType === type.id
                            ? 'bg-emerald-600 shadow-lg scale-105'
                            : 'hover:bg-emerald-50 border-emerald-100 text-emerald-800'
                            }`}
                    >
                        <type.icon className="size-5" />
                        <span className="text-xs font-bold">{type.label}</span>
                    </Button>
                ))}
            </div>

            {/* 날짜 선택 및 통계 카드 */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 통계 요약 (좌측 1칸) */}
                <div className="space-y-4">
                    <Card className="border-none bg-emerald-900 text-white shadow-xl rounded-3xl">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-emerald-300 font-bold uppercase text-[10px]">Average</CardDescription>
                            <CardTitle className="text-4xl font-black">
                                {historyData.length > 0
                                    ? (historyData.reduce((acc, c) => acc + c.value, 0) / historyData.length).toFixed(1)
                                    : '-'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-emerald-200">선택한 기간의 평균 {activeSensor.label} 수치입니다.</p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-emerald-100 rounded-3xl p-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                                <CalendarIcon className="size-3" /> 시작일
                            </label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="w-full text-sm p-2 rounded-xl bg-emerald-50 border-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                                <CalendarIcon className="size-3" /> 종료일
                            </label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="w-full text-sm p-2 rounded-xl bg-emerald-50 border-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </Card>
                </div>

                {/* 차트 영역 (우측 3칸) */}
                <Card className="lg:col-span-3 border-2 border-emerald-50 shadow-2xl rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-emerald-50 px-8 py-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-800">{activeSensor.label} 추이 분석</CardTitle>
                                <CardDescription>시각화된 센서 데이터를 확인하세요</CardDescription>
                            </div>
                            {isLoading && <div className="size-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historyData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={activeSensor.color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={activeSensor.color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickMargin={10}
                                />
                                <YAxis stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                                    labelFormatter={(label) => new Date(label).toLocaleString('ko-KR')}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={activeSensor.color}
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}