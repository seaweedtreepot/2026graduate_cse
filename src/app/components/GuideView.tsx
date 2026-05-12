import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import {
    Leaf, AlertTriangle, Sun, Droplets, Thermometer,
    Wind, BookOpen, CheckCircle2, Sparkles, Scissors,
    ArrowRight, Info, HelpCircle, Bug
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// [확장성 포인트 1] 데이터를 별도 객체로 분리하여 관리
const BASIL_GUIDE = {
    nameKo: "바질",
    nameEn: "Basil",
    tagline: "허브의 왕, 초보 정원사의 최고의 친구",
    summary: [
        { icon: Sun, label: "햇빛", val: "하루 6시간 이상", color: "text-amber-500", bg: "bg-amber-50" },
        { icon: Droplets, label: "물주기", val: "겉흙이 마를 때", color: "text-blue-500", bg: "bg-blue-50" },
        { icon: Thermometer, label: "온도", val: "18-25℃ 적정", color: "text-rose-500", bg: "bg-rose-50" },
        { icon: Wind, label: "통풍", val: "바람이 잘 통하게", color: "text-teal-500", bg: "bg-teal-50" },
    ],
    sections: [
        {
            id: "basics",
            title: "기본 재배 환경",
            icon: Info,
            content: [
                "바질은 열대 아시아 원산으로 따뜻한 곳을 좋아합니다.",
                "배수가 잘 되는 비옥한 토양에서 가장 잘 자라요.",
                "실내에서 키울 때는 가장 볕이 잘 드는 창가에 두세요."
            ]
        },
        {
            id: "beginner-tips",
            title: "초보자를 위한 핵심 팁",
            icon: Sparkles,
            isSpecial: true, // 특별 강조 디자인 적용
            details: [
                {
                    tip: "순지르기(Pinching)의 마법",
                    desc: "줄기 맨 윗부분을 잘라주면 옆으로 가지가 뻗어 나와 훨씬 풍성해집니다. 아까워하지 말고 과감하게 잘라주세요!",
                    icon: Scissors
                },
                {
                    tip: "꽃대는 바로 제거하기",
                    desc: "꽃이 피기 시작하면 잎의 향이 약해지고 질겨집니다. 씨앗을 받을 게 아니라면 꽃대는 보이는 즉시 잘라주세요.",
                    icon: Leaf
                },
                {
                    tip: "물은 아침에 주세요",
                    desc: "밤에 물을 주면 과습으로 인한 곰팡이 질병에 취약해집니다. 햇볕이 나기 시작하는 아침이 가장 좋아요.",
                    icon: Droplets
                }
            ]
        },
        {
            id: "troubleshooting",
            title: "이럴 땐 어떻게 하나요?",
            icon: HelpCircle,
            faqs: [
                { q: "잎이 노랗게 변해요", a: "대부분 '과습'이 원인입니다. 물 주는 횟수를 줄이고 통풍에 신경 써주세요." },
                { q: "잎이 검게 타요", a: "갑작스러운 강한 직사광선이나 추위(냉해) 때문일 수 있습니다." },
                { q: "벌레가 생겼어요", a: "주로 진딧물이나 응애가 생깁니다. 친환경 난황유나 식물용 살충제를 뿌려주세요." }
            ]
        }
    ]
};

export function GuideView() {
    const [activeSection, setActiveSection] = useState("all");

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-6 pb-24 relative overflow-hidden">
            {/* 배경 데코레이션 */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-3xl -z-10" />

            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                {/* 헤더 섹션 */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 mb-10">
                    <div className="inline-flex p-4 bg-white rounded-full shadow-xl text-emerald-600 mb-2">
                        <BookOpen size={32} />
                    </div>
                    <h2 className="text-4xl font-black text-emerald-900 tracking-tight">{BASIL_GUIDE.nameKo} 대백과</h2>
                    <p className="text-emerald-700/60 font-bold tracking-wide uppercase text-sm">{BASIL_GUIDE.tagline}</p>
                </motion.div>

                {/* 메인 콘텐츠 카드 */}
                <Card className="border-none bg-white/70 backdrop-blur-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/50">
                    {/* 상단 비주얼 영역 */}
                    <div className="relative h-60 bg-emerald-800 overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618375511575-d2890789bb2a?q=80&w=2000')] bg-cover bg-center opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                        <div className="absolute bottom-8 left-10 space-y-1">
                            <h3 className="text-6xl font-black text-emerald-950">{BASIL_GUIDE.nameKo}</h3>
                            <p className="text-xl font-bold text-emerald-800/80 italic">{BASIL_GUIDE.nameEn}</p>
                        </div>
                    </div>

                    <CardContent className="p-8 md:p-12 space-y-12">
                        {/* 1. 핵심 요약 (Quick Stats) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {BASIL_GUIDE.summary.map((item, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -5 }}
                                    className={`${item.bg} p-6 rounded-[2.5rem] flex flex-col items-center text-center gap-3 border border-white shadow-sm`}
                                >
                                    <item.icon className={`size-7 ${item.color}`} />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                        <p className="text-sm font-black text-gray-800">{item.val}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* 2. 섹션별 상세 정보 (확장성 레이아웃) */}
                        <div className="space-y-16">
                            {BASIL_GUIDE.sections.map((section) => (
                                <motion.section key={section.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="space-y-6">
                                    <div className="flex items-center gap-3 border-b-4 border-emerald-100 pb-3">
                                        <div className="p-2 bg-emerald-600 text-white rounded-xl">
                                            <section.icon size={20} />
                                        </div>
                                        <h4 className="text-2xl font-black text-emerald-900">{section.title}</h4>
                                    </div>

                                    {/* 섹션 타입에 따른 렌더링 분기 */}
                                    {section.content && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {section.content.map((text, i) => (
                                                <div key={i} className="bg-white/50 p-6 rounded-3xl border border-emerald-50 flex gap-3 shadow-sm">
                                                    <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                                                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {section.details && (
                                        <div className="grid grid-cols-1 gap-4">
                                            {section.details.map((detail, i) => (
                                                <div key={i} className="group bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                                                    <detail.icon className="absolute -right-4 -bottom-4 size-40 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                                                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-3xl self-start">
                                                            <detail.icon size={32} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h5 className="text-xl font-black">{detail.tip}</h5>
                                                            <p className="text-emerald-50/80 leading-relaxed font-medium">{detail.desc}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {section.faqs && (
                                        <div className="space-y-3">
                                            {section.faqs.map((faq, i) => (
                                                <div key={i} className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100 flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 text-rose-700 font-black">
                                                        <Bug className="size-4" />
                                                        <span>Q. {faq.q}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 font-medium pl-6 border-l-2 border-rose-200 ml-2">
                                                        {faq.a}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.section>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 하단 푸터 팁 */}
                <div className="text-center py-10 opacity-40">
                    <p className="text-xs font-bold text-emerald-900">식물의 종류에 따라 정보는 매주 업데이트됩니다 🌱</p>
                </div>
            </div>
        </div>
    );
}