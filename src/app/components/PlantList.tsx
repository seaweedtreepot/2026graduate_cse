import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Sprout, Plus, Activity, Leaf, Sparkles, AlertCircle, WifiOff, RefreshCw, Skull, Archive, X, Info, Bell, Trash2 } from 'lucide-react';
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
    { plantId: 103, name: "실험체 바질 3", species: "BASIL", status: "dead", level: 1 },
    { plantId: 104, name: "실험체 바질4", species: "BASIL", status: "good", level: 1 },
];

interface DeathReport {
    plantId: number;
    deathDate: string;
    reason: string;
    description: string;
    tips: string;
}

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
        if (typeof Notification !== 'undefined') {
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
        try {
            const permission = await Notification.requestPermission();
            setNotifPermission(permission);

            if (permission === 'granted') {
                await registerFcmToken();
            }
        } catch (error) {
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
            setTimeout(() => {
                setSelectedReport({
                    plantId,
                    deathDate: "2026.05.10",
                    reason: "과습 (Overwatering)",
                    description: "뿌리가 충분히 숨을 쉴 시간이 부족했어요. 토양 센서가 90% 이상의 습도를 3일간 유지한 것이 원인으로 분석됩니다.",
                    tips: "다음 바질을 키울 때는 겉흙이 충분히 말랐을 때 물을 주는 것이 좋아요. 배수층을 더 높게 쌓아보는 건 어떨까요?"
                });
                setIsReportLoading(false);
            }, 500);
        } catch (err) {
            console.error("리포트 호출 실패", err);
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
                                                    src={isDead ? `/assets/character/lv${plant.level}_sad.png` : `/assets/character/lv${plant.level}_happy.png`}
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
                                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                        <div className="flex items-center gap-2 mb-2"><Info className="size-4 text-slate-500" /><span className="text-xs font-black text-slate-500">사망 원인</span></div>
                                        <p className="text-lg font-bold text-slate-800">{selectedReport.reason}</p>
                                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{selectedReport.description}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100">
                                        <div className="flex items-center gap-2 mb-2"><Sparkles className="size-4 text-emerald-500" /><span className="text-xs font-black text-emerald-500">정원사의 팁</span></div>
                                        <p className="text-sm text-emerald-800 font-medium leading-relaxed">{selectedReport.tips}</p>
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
