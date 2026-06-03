import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  Leaf,
  SendHorizonal,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  XCircle,
  Droplets,
} from 'lucide-react';
import api from '../api/axios';

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

interface TestResult {
  status: TestStatus;
  message: string;
}

export function PushTestPage() {
  const navigate = useNavigate();
  const [fcmResult, setFcmResult] = useState<TestResult>({ status: 'idle', message: '' });
  const [sensorResult, setSensorResult] = useState<TestResult>({ status: 'idle', message: '' });

  const runFcmTest = async () => {
    setFcmResult({ status: 'loading', message: '푸시 알림 전송 중...' });
    try {
      const res = await api.get('/users/me/fcm-test');
      setFcmResult({
        status: 'success',
        message: res.data?.status || '테스트 푸시 알림이 전송되었습니다!',
      });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        '푸시 전송에 실패했습니다. FCM 토큰이 등록되어 있는지 확인해주세요.';
      setFcmResult({ status: 'error', message: msg });
    }
  };

  const runSensorTest = async () => {
    setSensorResult({ status: 'loading', message: '센서 경고 알림 전송 중...' });
    try {
      const res = await api.get('/users/me/sensor-test');
      setSensorResult({
        status: 'success',
        message: res.data?.status || '센서 경고 테스트 알림이 전송되었습니다!',
      });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        '센서 경고 전송에 실패했습니다. FCM 토큰이 등록되어 있는지 확인해주세요.';
      setSensorResult({ status: 'error', message: msg });
    }
  };

  const statusIcon = (status: TestStatus) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="size-5 animate-spin text-emerald-600" />;
      case 'success':
        return <CheckCircle2 className="size-5 text-emerald-500" />;
      case 'error':
        return <XCircle className="size-5 text-rose-500" />;
      default:
        return null;
    }
  };

  const statusColor = (status: TestStatus) => {
    switch (status) {
      case 'loading':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'error':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-green-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-64 h-64 bg-teal-200/15 rounded-full blur-3xl pointer-events-none" />

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
                Developer Tools
              </span>
            </div>
            <h1 className="text-2xl font-black text-emerald-950 tracking-tight">
              푸시 알림 테스트
            </h1>
          </div>
        </motion.header>

        {/* 안내 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100/60 rounded-2xl shrink-0">
              <AlertTriangle className="size-6 text-amber-500" />
            </div>
            <div>
              <h2 className="font-black text-emerald-950 mb-1">테스트 전 확인사항</h2>
              <ul className="text-sm text-slate-600 font-medium space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-black mt-0.5">1.</span>
                  브라우저에서 <strong className="text-emerald-800">알림 권한을 허용</strong>해야 합니다.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-black mt-0.5">2.</span>
                  프론트엔드에서 <strong className="text-emerald-800">FCM 토큰이 서버에 등록</strong>되어 있어야 합니다.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-black mt-0.5">3.</span>
                  서버의 <strong className="text-emerald-800">Firebase 서비스 계정 JSON</strong>이 올바르게 설정되어야 합니다.
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* 테스트 버튼 카드들 */}
        <div className="space-y-4">
          {/* FCM 기본 테스트 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-xl p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-100/60 rounded-2xl">
                <Bell className="size-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-emerald-950">일반 푸시 테스트</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  "알림 테스트 🔔" 제목의 테스트 푸시가 발송됩니다
                </p>
              </div>
            </div>

            <button
              onClick={runFcmTest}
              disabled={fcmResult.status === 'loading'}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-200/60 hover:shadow-emerald-300/80 hover:from-emerald-600 hover:to-teal-600 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              {fcmResult.status === 'loading' ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <SendHorizonal className="size-5" />
              )}
              {fcmResult.status === 'loading' ? '전송 중...' : '테스트 푸시 보내기'}
            </button>

            <AnimatePresence>
              {fcmResult.status !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className={`mt-4 p-3.5 rounded-xl border flex items-center gap-3 ${statusColor(fcmResult.status)}`}
                  >
                    {statusIcon(fcmResult.status)}
                    <span className="text-sm font-bold flex-1">{fcmResult.message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 센서 경고 테스트 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-xl p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-rose-100/60 rounded-2xl">
                <Droplets className="size-6 text-rose-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-emerald-950">센서 경고 테스트</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  "흙이 말랐습니다" 센서 경고 푸시가 발송됩니다
                </p>
              </div>
            </div>

            <button
              onClick={runSensorTest}
              disabled={sensorResult.status === 'loading'}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black rounded-2xl shadow-lg shadow-rose-200/60 hover:shadow-rose-300/80 hover:from-rose-600 hover:to-pink-600 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              {sensorResult.status === 'loading' ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <AlertTriangle className="size-5" />
              )}
              {sensorResult.status === 'loading' ? '전송 중...' : '센서 경고 테스트 보내기'}
            </button>

            <AnimatePresence>
              {sensorResult.status !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className={`mt-4 p-3.5 rounded-xl border flex items-center gap-3 ${statusColor(sensorResult.status)}`}
                  >
                    {statusIcon(sensorResult.status)}
                    <span className="text-sm font-bold flex-1">{sensorResult.message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* API 정보 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-slate-900/80 backdrop-blur-md rounded-[2rem] border border-slate-700/50 shadow-xl p-6 text-slate-300"
        >
          <h3 className="font-black text-white mb-3 text-sm">📡 API 엔드포인트</h3>
          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-black">
                GET
              </span>
              <span className="text-slate-400">/api/v1/users/me/fcm-test</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-black">
                GET
              </span>
              <span className="text-slate-400">/api/v1/users/me/sensor-test</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-black">
                POST
              </span>
              <span className="text-slate-400">/api/v1/users/me/fcm-token</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
