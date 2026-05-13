import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, BarChart3, BookOpen, X, PlusCircle, LayoutGrid } from 'lucide-react'; // 아이콘 추가
import { useNavigate } from 'react-router'; // useNavigate 추가

type TabType = 'status' | 'stats' | 'guide';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    setActiveTab: (id: TabType) => void;
    activeTab: TabType;
}

export function Sidebar({ isOpen, onClose, setActiveTab, activeTab }: SidebarProps) {
    const navigate = useNavigate();

    const menuItems = [
        { id: 'status' as const, label: '현재 상태', icon: Sprout },
        { id: 'stats' as const, label: '성장 기록', icon: BarChart3 },
        { id: 'guide' as const, label: '식물 도감', icon: BookOpen },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 뒷배경 어둡게 처리 (Overlay) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* 사이드바 본체 */}
                    <motion.div
                        // 핵심 수정: x 좌표를 -105%로 설정하여 여유 공간 확보
                        initial={{ x: '-105%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-105%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 250 }}
                        // 핵심 수정: shadow-[-20px...]를 추가하여 왼쪽 틈새 메움
                        className="fixed top-0 left-0 bottom-0 w-64 bg-white/95 backdrop-blur-xl z-[70] p-6 shadow-2xl shadow-[-20px_0_0_0_#ffffff] flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-10 text-emerald-900">
                            <h2 className="text-xl font-bold">메뉴</h2>
                            <button onClick={onClose} className="p-1 hover:bg-emerald-50 rounded-lg">
                                <X className="size-6" />
                            </button>
                        </div>

                        {/* 메뉴 아이템 */}
                        <nav className="space-y-2 flex-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            onClose();
                                        }}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeTab === item.id
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'hover:bg-emerald-50 text-emerald-800'
                                            }`}
                                    >
                                        <Icon className="size-5" />
                                        <span className="font-bold">{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* 하단 버튼 */}
                        <div className="pt-6 border-t border-emerald-100 space-y-2">
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/plant-list');
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <LayoutGrid className="size-5" />
                                <span className="font-bold text-sm">내 식물 목록</span>
                            </button>

                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/plant-selection');
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-200"
                            >
                                <PlusCircle className="size-5" />
                                <span className="font-bold text-sm">새 식물 등록하기</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}