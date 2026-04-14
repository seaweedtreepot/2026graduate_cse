import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { StatusView } from './PlantStatus';
import { StatsView } from './StatsView';
import { GuideView } from './GuideView';
import { Menu, AlertCircle } from 'lucide-react'; // AlertCircle 추가
import { motion } from 'motion/react';
import { Button } from './ui/button';

export function PlantMain() {
    const [activeTab, setActiveTab] = useState<'status' | 'stats' | 'guide'>('status');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // ✅ 공통 에러 상태 추가
    const [isGlobalError, setIsGlobalError] = useState(false);

    return (
        <div className="min-h-screen w-full relative">
            {/* ✅ 어느 페이지에 있든 상단에 고정되는 공통 에러 바 */}
            {isGlobalError && (
                <motion.div
                    initial={{ y: -50 }}
                    animate={{ y: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-rose-500 text-white py-2 px-4 flex items-center justify-center gap-4 shadow-lg"
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle className="size-4 animate-pulse" />
                        <span className="text-sm font-bold">서버와 연결이 끊겼습니다.</span>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.location.reload()} // 가장 확실한 재시도: 페이지 새로고침
                        className="h-7 bg-white/20 hover:bg-white/30 border-none text-white text-xs px-3"
                    >
                        페이지 새로고침
                    </Button>
                </motion.div>
            )}

            <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} setActiveTab={setActiveTab} activeTab={activeTab} />

            <button onClick={() => setIsMenuOpen(true)} className="fixed top-6 left-6 z-50 p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
                <Menu className="size-6 text-emerald-800" />
            </button>

            <main className="relative w-full h-full">
                {/* ✅ 자식 컴포넌트들에게 에러 상태를 조절할 수 있는 함수를 전달합니다 */}
                {activeTab === 'status' && <StatusView setError={setIsGlobalError} />}
                {activeTab === 'stats' && <StatsView setError={setIsGlobalError} />}
                {activeTab === 'guide' && <GuideView />}
            </main>
        </div>
    );
}