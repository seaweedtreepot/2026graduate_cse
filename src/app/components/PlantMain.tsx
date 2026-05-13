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
        <div className="min-h-screen w-full relative bg-white">
            {/* ✅ 에러 바: top-0 대신 safe-area-inset-top 반영 */}
            {isGlobalError && (
                <motion.div
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-rose-500 text-white shadow-lg
                               /* 노치만큼 상단 패딩 추가 */
                               pt-[env(safe-area-inset-top)] pb-3 px-4 
                               flex items-center justify-center gap-4"
                >
                    <div className="flex items-center gap-2 mt-1"> {/* mt-1로 미세 조정 */}
                        <AlertCircle className="size-4 animate-pulse" />
                        <span className="text-sm font-bold">서버와 연결이 끊겼습니다.</span>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="h-7 bg-white/20 hover:bg-white/30 border-none text-white text-xs px-3 mt-1"
                    >
                        재시도
                    </Button>
                </motion.div>
            )}

            {/* ✅ 메뉴 버튼: 노치 높이를 고려하여 위치 조정 */}
            <button
                onClick={() => setIsMenuOpen(true)}
                className="fixed left-6 z-50 p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20
                           /* 기본 24px(top-6) + 노치 높이 */
                           top-[calc(1.5rem+env(safe-area-inset-top))]"
            >
                <Menu className="size-6 text-emerald-800" />
            </button>

            <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} setActiveTab={setActiveTab} activeTab={activeTab} />

            <main className="relative w-full h-full">
                {/* ✅ 내부 뷰들도 상단 노치에 가려지지 않게 패딩 추가 권장 */}
                <div className="pt-[env(safe-area-inset-top)]">
                    {activeTab === 'status' && <StatusView setError={setIsGlobalError} />}
                    {activeTab === 'stats' && <StatsView setError={setIsGlobalError} />}
                    {activeTab === 'guide' && <GuideView />}
                </div>
            </main>
        </div>
    );
}