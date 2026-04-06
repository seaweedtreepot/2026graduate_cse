import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, BarChart3, BookOpen, X } from 'lucide-react';

export function Sidebar({ isOpen, onClose, setActiveTab, activeTab }) {
    const menuItems = [
        { id: 'status', label: '현재 상태', icon: Sprout },
        { id: 'stats', label: '성장 기록', icon: BarChart3 },
        { id: 'guide', label: '식물 도감', icon: BookOpen },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
                    <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                        className="fixed top-0 left-0 bottom-0 w-64 bg-white/90 backdrop-blur-xl z-[70] p-6 shadow-2xl" >
                        <div className="flex justify-between items-center mb-10 text-emerald-900">
                            <h2 className="text-xl font-bold">메뉴</h2>
                            <button onClick={onClose}><X /></button>
                        </div>
                        <nav className="space-y-2">
                            {menuItems.map((item) => (
                                <button key={item.id} onClick={() => { setActiveTab(item.id); onClose(); }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeTab === item.id ? 'bg-emerald-500 text-white shadow-md' : 'hover:bg-emerald-50 text-emerald-800'
                                        }`} >
                                    <item.icon className="size-5" />
                                    <span className="font-bold">{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}