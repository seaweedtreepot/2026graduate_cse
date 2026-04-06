import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { StatusView } from './PlantStatus'; // 아까 이름 바꾼 500줄짜리 코드
import { StatsView } from './StatsView';
import { GuideView } from './GuideView';
import { Menu } from 'lucide-react';

export function PlantMain() {
    const [activeTab, setActiveTab] = useState<'status' | 'stats' | 'guide'>('status');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen w-full relative">
            <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} setActiveTab={setActiveTab} activeTab={activeTab} />

            {/* 메뉴 버튼 */}
            <button onClick={() => setIsMenuOpen(true)} className="fixed top-6 left-6 z-50 p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
                <Menu className="size-6 text-emerald-800" />
            </button>

            {/* 화면 전환 본체 */}
            <main className="relative w-full h-full">
                {activeTab === 'status' && <StatusView />}
                {activeTab === 'stats' && <StatsView />}
                {activeTab === 'guide' && <GuideView />}
            </main>
        </div>
    );
}