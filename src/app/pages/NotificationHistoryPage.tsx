import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, AlertTriangle, AlertCircle, CheckCircle2, Leaf, RefreshCw, WifiOff, BellOff } from 'lucide-react';
import api from '../api/axios';

interface Notification {
  notificationId: number;
  plantName: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  createdAt: string;
  isRead?: boolean;
}

// 알림 타입별 스타일 설정
const getNotifStyle = (type: Notification['type']) => {
  switch (type) {
    case 'critical':
      return {
        bg: 'bg-rose-50 border-rose-200',
        icon: AlertTriangle,
        iconColor: 'text-rose-500',
        iconBg: 'bg-rose-100',
        badge: 'bg-rose-500',
        badgeText: '긴급',
        dot: 'bg-rose-500',
      };
    case 'warning':
      return {
        bg: 'bg-amber-50 border-amber-200',
        icon: AlertCircle,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-100',
        badge: 'bg-amber-500',
        badgeText: '주의',
        dot: 'bg-amber-400',
      };
    default:
      return {
        bg: 'bg-emerald-50 border-emerald-200',
        icon: CheckCircle2,
        iconColor: 'text-emerald-500',
        iconBg: 'bg-emerald-100',
        badge: 'bg-emerald-500',
        badgeText: '정보',
        dot: 'bg-emerald-400',
      };
  }
};

// 시간 포맷터
const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
};

// 더미 알림 데이터 (API 미연결 시 폴백)
const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    notificationId: 1,
    plantName: '바질이',
    message: '토양 습도가 임계값(20%) 이하로 내려갔어요. 물을 주세요!',
    type: 'critical',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    isRead: false,
  },
  {
    notificationId: 2,
    plantName: '바질이',
    message: '조도가 낮아지고 있어요. 창가 쪽으로 옮겨보는 건 어떨까요?',
    type: 'warning',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isRead: false,
  },
  {
    notificationId: 3,
    plantName: '바질이',
    message: '오늘도 식물이 건강하게 자라고 있어요 🌿',
    type: 'info',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isRead: true,
  },
  {
    notificationId: 4,
    plantName: '바질이',
    message: '벌레가 감지되었습니다! 즉시 확인이 필요해요.',
    type: 'critical',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isRead: true,
  },
  {
    notificationId: 5,
    plantName: '바질이',
    message: '온도가 조금 낮아지고 있어요. 외풍이 있는지 확인해주세요.',
    type: 'warning',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    isRead: true,
  },
  {
    notificationId: 6,
    plantName: '바질이',
    message: '바질이가 씨앗 단계에서 새싹 단계로 성장했어요! 🎉',
    type: 'info',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    isRead: true,
  },
];

export function NotificationHistoryPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await api.get('/users/me/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.warn('알림 이력 API 미연결 → 더미 데이터 사용:', err);
      setIsError(true);
      setNotifications(DUMMY_NOTIFICATIONS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 날짜별 그룹핑
  const groupedNotifications = notifications.reduce<Record<string, Notification[]>>((acc, notif) => {
    const dateKey = new Date(notif.createdAt).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(notif);
    return acc;
  }, {});

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-green-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
        {/* 헤더 */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 pt-10 pb-6"
        >
          <button
            onClick={() => navigate('/plant-list')}
            className="p-3 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 hover:bg-white/90 transition-all active:scale-95"
          >
            <ArrowLeft className="size-5 text-emerald-800" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Leaf className="size-3.5 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] opacity-70">
                My Garden
              </span>
            </div>
            <h1 className="text-2xl font-black text-emerald-950 tracking-tight">알림 이력</h1>
          </div>
          <button
            onClick={fetchNotifications}
            className="p-3 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 hover:bg-white/90 transition-all active:scale-95"
          >
            <RefreshCw className={`size-5 text-emerald-700 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </motion.header>

        {/* 에러 배너 */}
        <AnimatePresence>
          {isError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 shadow-sm"
            >
              <WifiOff className="size-5 shrink-0" />
              <span className="text-sm font-bold flex-1">서버와 연결할 수 없어요.</span>
              <button
                onClick={fetchNotifications}
                className="text-xs font-black bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl hover:bg-rose-200 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="size-3" /> 재시도
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 로딩 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="size-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm font-bold text-emerald-700/60">알림을 불러오는 중...</p>
          </div>
        )}

        {/* 비어있음 */}
        {!isLoading && notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-64 gap-5 bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-xl p-10"
          >
            <div className="p-5 bg-emerald-100/60 rounded-full">
              <BellOff className="size-12 text-emerald-300" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-emerald-900 mb-1">알림이 없어요</h2>
              <p className="text-sm text-emerald-700/50 font-medium">식물들이 모두 건강하게 지내고 있어요 🌿</p>
            </div>
          </motion.div>
        )}

        {/* 알림 목록 (날짜별 그룹) */}
        {!isLoading && notifications.length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([date, notifs], groupIdx) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.08 }}
              >
                {/* 날짜 라벨 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-emerald-200/60" />
                  <span className="text-[11px] font-black text-emerald-700/50 uppercase tracking-widest px-2">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-emerald-200/60" />
                </div>

                {/* 해당 날짜 알림들 */}
                <div className="space-y-3">
                  {notifs.map((notif, idx) => {
                    const style = getNotifStyle(notif.type);
                    const Icon = style.icon;
                    return (
                      <motion.div
                        key={notif.notificationId}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: groupIdx * 0.08 + idx * 0.05 }}
                        className={`relative flex items-start gap-4 p-4 rounded-2xl border ${style.bg} shadow-sm`}
                      >
                        {/* 미읽음 점 */}
                        {!notif.isRead && (
                          <span className={`absolute top-4 right-4 size-2 rounded-full ${style.dot}`} />
                        )}

                        {/* 아이콘 */}
                        <div className={`p-2.5 rounded-xl shrink-0 ${style.iconBg}`}>
                          <Icon className={`size-5 ${style.iconColor}`} />
                        </div>

                        {/* 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-black text-emerald-950">{notif.plantName}</span>
                            <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded-full ${style.badge}`}>
                              {style.badgeText}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 font-medium leading-snug">{notif.message}</p>
                          <p className="text-[11px] text-slate-400 font-bold mt-1.5">
                            {formatTime(notif.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
