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
    const navigate = useNavigate(); // 페이지 이동을 위한 함수

    const menuItems = [
        { id: 'status' as const, label: '현재 상태', icon: Sprout },
        { id: 'stats' as const, label: '성장 기록', icon: BarChart3 },
        { id: 'guide' as const, label: '식물 도감', icon: BookOpen },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        className="fixed top-0 left-0 bottom-0 w-64 bg-white/90 backdrop-blur-xl z-[70] p-6 shadow-2xl flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-10 text-emerald-900">
                            <h2 className="text-xl font-bold">메뉴</h2>
                            <button onClick={onClose} className="p-1 hover:bg-emerald-50 rounded-lg">
                                <X className="size-6" />
                            </button>
                        </div>

                        {/* 1. 기본 탭 메뉴 (내부 화면 전환) */}
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

                        {/* 2. 하단 내 식물 목록 / 추가 버튼 (페이지 이동) */}
                        <div className="pt-6 border-t border-emerald-100 space-y-2">
                            <button
                                onClick={() => {
                                    onClose(); // 사이드바 닫기
                                    navigate('/plant-list'); // 식물 목록으로 이동
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <LayoutGrid className="size-5" />
                                <span className="font-bold text-sm">내 식물 목록</span>
                            </button>

                            <button
                                onClick={() => {
                                    onClose(); // 사이드바 닫기
                                    navigate('/plant-selection'); // 식물 선택/등록 페이지로 이동
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