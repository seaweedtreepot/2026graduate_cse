import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Sprout, Plus, Activity, Leaf, Sparkles, AlertCircle, WifiOff, RefreshCw, Skull, Archive, X, Info, Bell, Trash2, Droplets, Sun, Thermometer, Bug, AlertTriangle, HelpCircle, CloudRain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { UserContext } from '../context/UserContext';
import { getMessagingInstance, getToken } from '../../firebase';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const VAPID_KEY = 'BN-4-rDMQp_55ccwsKQNpzRLk-WD5H5zlQLTE6CHVbhuZdAkmCMtLF2p6SdIxJJOW0f4wUWHFxPII0vHmVHJ0DU';

interface Plant {
    plantId: number;
    name: string;
    species: string;
    status: 'good' | 'warning' | 'critical' | 'dead' | string;
    level: number;
}

const DUMMY_PLANTS: Plant[] = [
    { plantId: 101, name: "실험체 바질1", species: "BASIL", status: "good", level: 1 },
    { plantId: 102, name: "실험체 바질2", species: "BASIL", status: "warning", level: 1 },
    { plantId: 103, name: "수분 부족 바질", species: "BASIL", status: "dead", level: 1 },
    { plantId: 104, name: "실험체 바질4", species: "BASIL", status: "good", level: 1 },
    { plantId: 105, name: "광량 부족 몬스테라", species: "MONSTERA", status: "dead", level: 2 },
    { plantId: 106, name: "냉해 피해 로즈마리", species: "ROSEMARY", status: "dead", level: 3 },
    { plantId: 107, name: "건조 탈수 민트", species: "MINT", status: "dead", level: 4 },
    { plantId: 108, name: "응애 습격 상추", species: "LETTUCE", status: "dead", level: 5 },
    { plantId: 109, name: "무름병 감염 라벤더", species: "LAVENDER", status: "dead", level: 5 },
    { plantId: 110, name: "원인 불명 선인장", species: "CACTUS", status: "dead", level: 5 },
    { plantId: 111, name: "복합 피해 바질 (수분+광량)", species: "BASIL", status: "dead", level: 5 },
];

interface DeathReport {
    plantId: number;
    deathDate: string;
    factors?: string[];
}

const FACTOR_CARDS: Record<string, {
    title: string;
    description: string;
    tips: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
}> = {
    moisture: {
        title: "토양 수분 불균형",
        description: "식물의 뿌리가 과도한 물 공급으로 숨을 쉬지 못해 썩었거나, 혹은 물이 오랫동안 공급되지 않아 말라 죽었을 가능성이 매우 높습니다.",
        tips: "손가락 한 마디 깊이의 겉흙이 바짝 마른 것을 확인한 후 한 번에 흠뻑 물을 주는 저면관수나 주기를 일정하게 맞춘 물주기를 실행해 보세요. 배수가 잘 되는 흙(펄라이트 혼합)을 사용하는 것이 필수적입니다.",
        color: "text-sky-700",
        bg: "bg-sky-50/80",
        border: "border-sky-100",
        icon: <Droplets className="size-5 text-sky-500" />
    },
    light: {
        title: "광량 공급 부적절",
        description: "빛이 너무 부족해 광합성량이 극도로 저조하여 식물이 시들었거나, 혹은 강한 직사광선 아래 방치되어 잎이 타들어 가며 고사했을 수 있습니다.",
        tips: "식물의 종류(양지, 반양지, 음지 식물)에 적합한 장소를 찾아 배치해 주세요. 실내 광량이 부족하다면 자동 타이머 기능이 포함된 식물 생장용 스마트 LED 식물등을 가동하는 것을 추천합니다.",
        color: "text-amber-700",
        bg: "bg-amber-50/80",
        border: "border-amber-100",
        icon: <Sun className="size-5 text-amber-500" />
    },
    temperature: {
        title: "온도 관리 실패",
        description: "겨울철 영하에 가까운 냉해를 입었거나, 여름철 베란다의 지나친 고온 장해(30°C 이상 방치)로 인해 세포벽이 파괴되어 죽었을 가능성이 큽니다.",
        tips: "식물의 적정 생육 온도(보통 15°C~25°C)를 유지해 주세요. 한여름 낮이나 한겨울 밤에는 베란다에서 거실 안쪽으로 식물을 들여놓고 관리해야 안전합니다.",
        color: "text-rose-700",
        bg: "bg-rose-50/80",
        border: "border-rose-100",
        icon: <Thermometer className="size-5 text-rose-500" />
    },
    humidity: {
        title: "공기 습도 부적절",
        description: "건조한 실내 환경으로 인해 수분 증산 작용이 비정상적으로 빨라져 말랐거나, 통풍이 없는 지나치게 습한 환경으로 인해 병해균이 번식했을 수 있습니다.",
        tips: "공기가 너무 건조할 때는 잎 주변에 자주 분무해 주거나 가습기를 가동하고, 습도가 너무 높을 때는 서큘레이터나 환기를 통해 공기 흐름을 만들어 주어야 합니다.",
        color: "text-blue-700",
        bg: "bg-blue-50/80",
        border: "border-blue-100",
        icon: <CloudRain className="size-5 text-blue-500" />
    },
    bug: {
        title: "해충 피해 방치",
        description: "응애, 진딧물, 개각충 또는 뿌리파리 등 눈에 잘 보이지 않는 해충들이 급격히 번식하여 줄기와 뿌리의 즙액을 흡즙해 영양 결핍으로 사멸했을 수 있습니다.",
        tips: "평소 잎의 앞면뿐만 아니라 뒷면과 흙 표면을 자주 관찰하고 통풍이 잘되도록 해야 합니다. 해충이 보인다면 즉시 친환경 살충제를 3일 간격으로 살포하여 박멸해야 합니다.",
        color: "text-lime-700",
        bg: "bg-lime-50/80",
        border: "border-lime-100",
        icon: <Bug className="size-5 text-lime-500" />
    },
    disease: {
        title: "식물 질병 발생",
        description: "잎마름병, 흰가루병 등의 질병으로 인해 잎이 마르고 세포가 괴사했을 가능성이 있습니다. 병든 부위를 빠르게 잘라내고 전용 살균제를 처방해야 대처할 수 있습니다.",
        tips: "병든 잎이나 줄기가 보이면 즉시 소독된 가위로 잘라내 격리하고, 통풍이 잘 통하는 공간으로 옮긴 후 전용 살균제를 가동해 주는 것이 치료법입니다.",
        color: "text-orange-700",
        bg: "bg-orange-50/80",
        border: "border-orange-100",
        icon: <AlertTriangle className="size-5 text-orange-500" />
    },
    unknown: {
        title: "복합적 환경 요인",
        description: "특정 단일 센서 임계치로는 검출되지 않았으나, 급격한 분갈이 몸살, 영양제 과다 공급(비료 과다), 혹은 환기 부족 등 여러 요인이 누적되어 고사한 것으로 분석됩니다.",
        tips: "새로운 화분으로 분갈이한 후에는 1~2주간 그늘에서 적응 기간을 가지며 안정을 주어야 합니다. 비료는 성장이 활발한 봄/가을에만 적정량 희석하여 공급하고 항상 환기를 확보해 주세요.",
        color: "text-slate-700",
        bg: "bg-slate-50/80",
        border: "border-slate-100",
        icon: <HelpCircle className="size-5 text-slate-500" />
    }
};

export function PlantList() {
    const navigate = useNavigate();
    const { userInfo } = useContext(UserContext) || {};
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [viewMode, setViewMode] = useState<'live' | 'dead'>('live');
    const [selectedReport, setSelectedReport] = useState<DeathReport | null>(null);
    const [isReportLoading, setIsReportLoading] = useState(false);
    const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unknown'>('unknown');
    const [deleteTarget, setDeleteTarget] = useState<Plant | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 마운트 시 현재 권한 상태 확인
    useEffect(() => {
        const isNotifSupported = typeof Notification !== 'undefined';
        const currentPermission = isNotifSupported ? Notification.permission : 'N/A';
        
        // 디버깅용 초기 로그
        console.log(`[디버그] 알림 지원 여부: ${isNotifSupported ? '지원함' : '미지원(Notification이 undefined)'}\n현재 권한 상태: ${currentPermission}\n브라우저 환경: ${navigator.userAgent}`);

        if (isNotifSupported) {
            setNotifPermission(Notification.permission);
        }
    }, []);

    // 토큰 발급 + 백엔드 전송 공통 함수
    const registerFcmToken = async () => {
        try {
            const messagingInstance = await getMessagingInstance();
            if (!messagingInstance) return;

            const token = await getToken(messagingInstance, { vapidKey: VAPID_KEY });
            if (token) {
                console.log("🟢 FCM 토큰 발급 성공:", token);
                await api.post('/users/me/fcm-token', { fcmToken: token });
            }
        } catch (error) {
            console.error("❌ FCM 토큰 등록 실패:", error);
        }
    };

    // 아이폰 Safari PWA — 반드시 사용자 제스처(버튼 클릭)로 호출
    const handleRequestNotificationPermission = async () => {
        console.log("1. 버튼 클릭 확인");
        try {
            if (typeof window === 'undefined' || !('Notification' in window)) {
                console.warn("이 브라우저는 Notification API를 지원하지 않습니다. (HTTP 접속 또는 미지원 브라우저/OS일 수 있습니다)");
                return;
            }
            console.log("2. 권한 요청 직전 (Notification.requestPermission)");
            const permission = await Notification.requestPermission();
            console.log("3. 권한 결과: " + permission);
            setNotifPermission(permission);

            if (permission === 'granted') {
                await registerFcmToken();
            }
        } catch (error: any) {
            console.error("에러 발생: ", error?.message || error);
            console.error("알림 권한 요청 실패:", error);
        }
    };

    const fetchPlants = async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const res = await api.get('/users/me/plants');
            setPlants(res.data);
        } catch (err) {
            console.error("목록 호출 실패 -> 테스트 모드 전환:", err);
            setIsError(true);
            setPlants(DUMMY_PLANTS);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDeathReport = async (plantId: number) => {
        setIsReportLoading(true);
        try {
            const res = await api.get(`/plants/${plantId}/reports/death`);
            const reportData = res.data;
            if (reportData.deathDate) {
                reportData.deathDate = reportData.deathDate.split('T')[0].replace(/-/g, '.');
            }
            setSelectedReport(reportData);
        } catch (err) {
            console.error("리포트 호출 실패, 데모용 폴백 실행:", err);
            
            let factors: string[] = ["unknown"];
            if (plantId === 103) factors = ["moisture"];
            else if (plantId === 105) factors = ["light"];
            else if (plantId === 106) factors = ["temperature"];
            else if (plantId === 107) factors = ["humidity"];
            else if (plantId === 108) factors = ["bug"];
            else if (plantId === 109) factors = ["disease"];
            else if (plantId === 110) factors = ["unknown"];
            else if (plantId === 111) factors = ["moisture", "light"];

            setSelectedReport({
                plantId,
                deathDate: "2026.05.10",
                factors
            });
        } finally {
            setIsReportLoading(false);
        }
    };

    useEffect(() => {
        fetchPlants();
    }, []);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/plants/${deleteTarget.plantId}`);
            setPlants(prev => prev.filter(p => p.plantId !== deleteTarget.plantId));
            setDeleteTarget(null);
        } catch (err) {
            console.error('식물 삭제 실패:', err);
            alert('식물 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsDeleting(false);
        }
    };

    // 자동 등록 — 이미 granted인 경우에만 토큰 재발급
    useEffect(() => {
        const initPushNotification = async () => {
            try {
                if (Capacitor.isNativePlatform()) {
                    let permStatus = await PushNotifications.checkPermissions();
                    if (permStatus.receive === 'prompt') {
                        permStatus = await PushNotifications.requestPermissions();
                    }
                    if (permStatus.receive !== 'granted') return;

                    await PushNotifications.register();
                    await PushNotifications.addListener('registration', async (token) => {
                        console.log('🟢 앱 FCM 토큰 발급 성공:', token.value);
                        try {
                            await api.post('/users/me/fcm-token', { fcmToken: token.value });
                        } catch (e) { }
                    });
                } else {
                    // 웹(Safari PWA): 이미 granted인 경우에만 자동 재발급
                    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                        await registerFcmToken();
                    }
                }
            } catch (error) {
                console.error("❌ FCM 통합 등록 중 오류 발생:", error);
            }
        };

        initPushNotification();
    }, []);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'good': return { color: 'bg-emerald-500', text: '건강함', icon: <Sparkles className="size-3" /> };
            case 'warning': return { color: 'bg-amber-500', text: '관심 필요', icon: <Activity className="size-3" /> };
            case 'critical': return { color: 'bg-rose-500', text: '조치 필요', icon: <AlertCircle className="size-3" /> };
            case 'dead': return { color: 'bg-slate-500', text: '떠나보냄', icon: <Skull className="size-3" /> };
            default: return { color: 'bg-slate-300', text: '상태 불명', icon: null };
        }
    };

    const livePlants = plants.filter(p => p.status !== 'dead');
    const deadPlants = plants.filter(p => p.status === 'dead');
    const healthyPlantsCount = plants.filter(p => p.status === 'good').length;
    const displayPlants = viewMode === 'live' ? livePlants : deadPlants;

    const showNotifBanner =
        !Capacitor.isNativePlatform() &&
        typeof Notification !== 'undefined' &&
        notifPermission === 'default';

    return (
        <div className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-6 pb-32 relative">

            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-green-200/20 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -z-10" />

            <div className="max-w-5xl mx-auto space-y-8 relative z-10">

                {/* 서버 에러 배너 */}
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

                {/* 알림 권한 요청 배너 */}
                <AnimatePresence>
                    {showNotifBanner && (
                        <motion.div
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between shadow-sm"
                        >
                            <div className="flex items-center gap-3 text-emerald-700">
                                <Bell className="size-5 shrink-0" />
                                <span className="text-sm font-bold leading-snug">
                                    식물 알림을 받으려면<br className="sm:hidden" /> 허용해 주세요
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setNotifPermission('denied')}
                                    className="text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                                >
                                    나중에
                                </button>
                                <button
                                    onClick={handleRequestNotificationPermission}
                                    className="flex items-center gap-1 text-xs font-black bg-emerald-500 text-white px-4 py-1.5 rounded-xl hover:bg-emerald-600 active:scale-95 transition-all shadow-md shadow-emerald-200"
                                >
                                    <Bell className="size-3" /> 허용
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 헤더 */}
                <header className="pt-4 flex flex-col items-center text-center relative">
                    {/* FCM 테스트 버튼 */}
                    <button
                        onClick={async () => {
                            try {
                                const res = await api.get('/users/me/fcm-test');
                                console.log("백엔드 전송 완료: " + res.data.status);
                            } catch (e: any) {
                                console.error("테스트 전송 실패: " + (e.response?.data?.message || e.message));
                            }
                        }}
                        className="absolute left-0 top-4 p-3 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 hover:bg-white/90 transition-all active:scale-95 text-xs font-black text-emerald-700"
                        title="FCM 테스트 알림 보내기"
                    >
                        테스트 알림
                    </button>

                    {/* 알림 이력 버튼 */}
                    <button
                        onClick={() => navigate('/notifications')}
                        className="absolute right-0 top-4 p-3 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 hover:bg-white/90 transition-all active:scale-95"
                        title="알림 이력 보기"
                    >
                        <Bell className="size-5 text-emerald-700" />
                    </button>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-3 bg-white/40 px-4 py-1 rounded-full border border-white/60 shadow-sm">
                            <Leaf className="size-3.5 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] opacity-80">
                                My Digital Garden
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 tracking-tighter mb-2">
                            {viewMode === 'live' ? "나의 비밀 정원" : "추억의 숲"}
                        </h1>
                        <p className="text-sm text-emerald-800/60 font-medium leading-relaxed max-w-[260px]">
                            {viewMode === 'live'
                                ? <><span className="text-emerald-600 font-bold">{userInfo?.name || "정원사님"}</span>, 오늘 식물들의 기분은 어떠신가요?</>
                                : <><span className="text-slate-600 font-bold">{userInfo?.name || "정원사님"}</span>, 우리가 함께했던 소중한 기록들이에요.</>
                            }
                        </p>
                    </motion.div>
                </header>

                {/* 대시보드 탭 */}
                <div className="w-full flex justify-center pt-2 px-2">
                    <motion.div className="w-full max-w-md bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-4 shadow-xl border border-white/80">
                        <div className="grid grid-cols-3 items-center w-full">
                            <button
                                onClick={() => setViewMode('live')}
                                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${viewMode === 'live' ? 'bg-white/60 shadow-inner' : 'opacity-50'}`}
                            >
                                <Leaf className={`size-5 ${viewMode === 'live' ? 'text-emerald-500' : 'text-slate-400'}`} />
                                <span className="text-[10px] font-black text-emerald-950">정원 {livePlants.length}</span>
                            </button>
                            <div className="flex flex-col items-center gap-1 border-x border-emerald-100/50">
                                <Sparkles className="size-5 text-amber-400" />
                                <span className="text-[10px] font-black text-emerald-950">건강 {healthyPlantsCount}</span>
                            </div>
                            <button
                                onClick={() => setViewMode('dead')}
                                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${viewMode === 'dead' ? 'bg-slate-200 shadow-inner' : 'opacity-50'}`}
                            >
                                <Skull className={`size-5 ${viewMode === 'dead' ? 'text-slate-600' : 'text-slate-400'}`} />
                                <span className="text-[10px] font-black text-emerald-950">추억 {deadPlants.length}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* 리스트 */}
                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center text-emerald-500 gap-4">
                        <div className="size-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                    </div>
                ) : displayPlants.length === 0 ? (
                    <Card className="border-none shadow-xl bg-white/60 backdrop-blur-md p-16 text-center rounded-[3rem]">
                        <div className="flex flex-col items-center gap-6">
                            {viewMode === 'live' ? <Sprout className="size-20 text-emerald-300" /> : <Archive className="size-20 text-slate-300" />}
                            <h2 className="text-2xl font-bold text-emerald-900">
                                {viewMode === 'live' ? "정원이 비어있네요" : "아직 추억이 없어요"}
                            </h2>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayPlants.map((plant, index) => {
                            const status = getStatusConfig(plant.status);
                            const isDead = plant.status === 'dead';

                            return (
                                <motion.div
                                    key={plant.plantId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => {
                                        if (isDead) {
                                            fetchDeathReport(plant.plantId);
                                        } else {
                                            navigate(`/plant-status?plantId=${plant.plantId}&plant=${plant.name}&level=${plant.level}`);
                                        }
                                    }}
                                    className={isDead ? "cursor-help" : "cursor-pointer"}
                                >
                                    <Card className={`border-none shadow-xl rounded-[2.5rem] overflow-hidden group ${isDead ? 'bg-slate-100/80 grayscale' : 'bg-white/80 cursor-pointer'}`}>
                                        <CardContent className="p-8 flex flex-col items-center relative">
                                            <div className="absolute top-6 left-8 text-[10px] font-black text-emerald-800/20 uppercase tracking-widest">
                                                Level {plant.level}
                                            </div>
                                            {/* 삭제 버튼 (호버 시 노출) */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget(plant);
                                                }}
                                                className="absolute top-4 right-4 p-2 rounded-xl opacity-0 group-hover:opacity-100 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all duration-200 z-10"
                                                title="식물 삭제"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                            <div className="relative w-36 h-36 mb-6">
                                                <div className={`absolute inset-0 rounded-full blur-2xl scale-75 opacity-0 group-hover:opacity-100 transition-all ${isDead ? 'bg-slate-300' : 'bg-emerald-100/40'}`} />
                                                <img
                                                    src={isDead ? `/assets/character/lv1_sad.png` : `/assets/character/lv1_happy.png`}
                                                    className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-110"
                                                    alt={plant.name}
                                                    onError={(e) => {
                                                        const target = e.currentTarget;
                                                        if (!target.dataset.fallback) {
                                                            target.dataset.fallback = 'true';
                                                            target.src = '/assets/character/default.png';
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="text-center space-y-3">
                                                <div>
                                                    <h3 className={`text-2xl font-black ${isDead ? 'text-slate-600' : 'text-emerald-950 group-hover:text-emerald-600'}`}>{plant.name}</h3>
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

            {/* 사망 리포트 모달 */}
            <AnimatePresence>
                {selectedReport && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-emerald-950/40 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
                            <div className="h-2 w-full bg-slate-400" />
                            <button onClick={() => setSelectedReport(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400"><X className="size-5" /></button>
                            <div className="p-8 space-y-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-4 bg-slate-100 rounded-full mb-4"><Skull className="size-8 text-slate-400" /></div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter">추억 리포트</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedReport.deathDate} 떠나감</p>
                                </div>
                                <div className="space-y-4">
                                    {/* 복합 사망 요인 피드백 카드 목록 */}
                                    <div className="space-y-3">
                                        <div className="px-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                            사망 주요인 분석 & 피드백
                                        </div>
                                        {(selectedReport.factors && selectedReport.factors.length > 0
                                            ? selectedReport.factors
                                            : ["unknown"]
                                        ).map((factor) => {
                                            const card = FACTOR_CARDS[factor] || FACTOR_CARDS.unknown;
                                            return (
                                                <motion.div
                                                    key={factor}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`p-5 rounded-3xl border ${card.bg} ${card.border} space-y-3.5 shadow-sm`}
                                                >
                                                    <div className="flex items-center gap-2 border-b border-black/5 pb-2">
                                                        {card.icon}
                                                        <span className={`text-xs font-black ${card.color}`}>
                                                            {card.title}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className="text-[10px] font-black text-slate-400 block mb-0.5">사망 원인 분석</span>
                                                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                                                                {card.description}
                                                            </p>
                                                        </div>
                                                        <div className="pt-2 border-t border-black/5">
                                                            <span className="text-[10px] font-black text-emerald-600/70 block mb-0.5">정원사의 피드백 팁</span>
                                                            <p className="text-xs text-emerald-800 leading-relaxed font-semibold">
                                                                {card.tips}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <Button onClick={() => setSelectedReport(null)} className="w-full py-6 rounded-2xl bg-slate-800 text-white font-black text-lg">기억할게요</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 식물 삭제 확인 모달 */}
            <AnimatePresence>
                {deleteTarget && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-emerald-950/40 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="h-2 w-full bg-rose-400" />
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="p-8 space-y-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="p-4 bg-rose-100 rounded-full mb-4">
                                        <Trash2 className="size-8 text-rose-400" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter">정말 삭제할까요?</h2>
                                    <p className="text-sm font-medium text-slate-500 mt-2">
                                        <span className="font-black text-emerald-700">{deleteTarget.name}</span>을(를) 정원에서 제거합니다.<br />
                                        이 작업은 되돌릴 수 없어요.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteTarget(null)}
                                        className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-colors"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleDeleteConfirm}
                                        disabled={isDeleting}
                                        className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-black hover:bg-rose-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isDeleting ? (
                                            <><div className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> 삭제 중...</>
                                        ) : (
                                            <><Trash2 className="size-4" /> 삭제하기</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 리포트 로딩 */}
            {isReportLoading && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="size-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                        <p className="text-sm font-black text-slate-800">리포트 분석 중...</p>
                    </div>
                </div>
            )}

            {/* 하단 고정 버튼 */}
            <div className="fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none">
                <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/plant-selection')}
                    className={`pointer-events-auto flex items-center gap-3 px-8 py-4 rounded-full font-black text-lg transition-all shadow-2xl ${isError
                        ? 'bg-amber-500 text-white shadow-[0_15px_30px_-5px_rgba(245,158,11,0.5)]'
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
