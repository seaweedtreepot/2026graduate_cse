import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import {
    Leaf, Sun, Droplets,
    Sparkles, Scissors,
    Bug, Utensils, Heart, ChevronRight,
    Flower2, Sprout, Tractor, Sunrise, Archive, TreeDeciduous, CircleAlert,
    UtensilsCrossed, Slice, Box, Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BASIL_GUIDE = {
    nameKo: "바질",
    nameEn: "Basil",
    difficulty: 20, // 0~100
    sunIntensity: 80,
    waterIntensity: 60,
    sections: [
        { id: "care", label: "돌보기", icon: Heart },
        { id: "harvest", label: "수확하기", icon: Scissors },
        { id: "culinary", label: "요리/궁합", icon: Utensils },
        { id: "trouble", label: "문제해결", icon: Bug },
    ],
    growthStages: [
        { stage: "발아", day: "7-10일", desc: "솜발아 혹은 직파 후 습도 유지" },
        { stage: "초기", day: "2주-3주", desc: "떡잎 사이로 진짜 바질 잎이 나옴" },
        { stage: "성장", day: "4주-6주", desc: "본격적인 줄기 확장 및 분지" },
        { stage: "연속수확", day: "6주 이후", desc: "순지르기를 통한 무한 수확 시작" },
    ]
};

export function GuideView() {
    const [activeTab, setActiveTab] = useState("care");

    return (
        <div className="min-h-screen w-full bg-[#f8fafc] p-4 md:p-8 pb-32">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* 1. 히어로 섹션: 감성적인 비주얼과 능력치 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative h-80 rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    <img
                        src="/src/public/assets/dashboard/dashBoard.png"
                        className="absolute inset-0 w-full h-full object-cover"
                        alt="Basil"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/20 to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8 text-white">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-5xl font-black mb-1">{BASIL_GUIDE.nameKo}</h1>
                                <p className="text-emerald-200 font-bold italic">{BASIL_GUIDE.nameEn}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 text-center">
                                <p className="text-[10px] font-bold uppercase opacity-70">재배 난이도</p>
                                <p className="text-xl font-black text-emerald-300">Easy</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. 핵심 케어 지표: 프로그레스 바 스타일 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="rounded-3xl border-none shadow-sm bg-white p-5">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                                <span className="flex items-center gap-2"><Sun size={16} /> 필요 일조량</span>
                                <span className="text-emerald-600">최소 4시간 ~ 6시간</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: "80%" }} className="h-full bg-amber-400" />
                            </div>
                        </div>
                    </Card>
                    <Card className="rounded-3xl border-none shadow-sm bg-white p-5">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                                <span className="flex items-center gap-2"><Droplets size={16} /> 선호 습도</span>
                                <span className="text-blue-600">40% ~ 70%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: "60%" }} className="h-full bg-blue-400" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 3. 성장 타임라인: 시각적 흐름 */}
                <div className="bg-emerald-900 rounded-[2.5rem] p-8 text-white">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                        <Sparkles size={20} className="text-emerald-400" /> 바질의 성장 일기
                    </h3>
                    <div className="flex justify-between relative">
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-emerald-800" />
                        {BASIL_GUIDE.growthStages.map((s, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                                <div className="size-10 bg-emerald-700 rounded-full flex items-center justify-center border-4 border-emerald-900 font-black text-xs text-emerald-300">
                                    {i + 1}
                                </div>
                                <span className="text-xs font-bold">{s.stage}</span>
                                <span className="text-[10px] opacity-50">{s.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. 인터랙티브 탭 메뉴 */}
                <div className="flex bg-white p-2 rounded-2xl shadow-sm gap-1 overflow-x-auto no-scrollbar">
                    {BASIL_GUIDE.sections.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveTab(s.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === s.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:bg-slate-50'
                                }`}
                        >
                            <s.icon size={16} /> {s.label}
                        </button>
                    ))}
                </div>

                {/* 5. 탭별 상세 내용 (애니메이션 적용) */}
                <AnPresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                    >
                        {activeTab === 'care' && (
                            <div className="grid gap-4">
                                <TipCard
                                    title="햇빛은 필수, 하루 4–6시간"
                                    desc="창가나 베란다에서 하루 최소 4시간, 이상적으로 6시간의 직사광(또는 강한 간접광)을 확보하세요. 빛이 부족하면 줄기가 길쭉해지고 잎이 연약해집니다."
                                    icon={Sun}
                                    color="bg-yellow-50 text-yellow-700"
                                />

                                <TipCard
                                    title="물은 겉흙부터 확인"
                                    desc="흙 표면이 마르면 충분히 주되 배수구가 잘 되도록 하고, 물빠짐이 나쁘면 과습으로 뿌리썩음이 발생합니다."
                                    icon={Droplets}
                                    color="bg-blue-50 text-blue-600"
                                />

                                <TipCard
                                    title="순지르기는 선택이 아닌 필수"
                                    desc="줄기가 약 15cm 자라면 맨 위 새순을 잘라주세요. 옆으로 가지가 뻗어 더 풍성해집니다."
                                    icon={Scissors}
                                    color="bg-indigo-50 text-indigo-600"
                                />

                                <TipCard
                                    title="첫 수확은 6–8주 후"
                                    desc="본잎이 4–6장 정도 자라면 잎을 따기 시작하세요. 한 번에 너무 많이 따지 말고 전체의 1/3 이하로 수확합니다."
                                    icon={Scissors}
                                    color="bg-green-50 text-green-700"
                                />

                                <TipCard
                                    title="개화는 잎 향 급감 신호"
                                    desc="꽃대가 보이면 즉시 제거하세요. 개화하면 잎으로 가는 에너지가 줄어 향과 잎량이 떨어집니다."
                                    icon={Flower2}
                                    color="bg-pink-50 text-pink-600"
                                />

                                <TipCard
                                    title="비료는 소량·정기적으로"
                                    desc="성장기(봄~초가을)에 2–3주 간격으로 희석한 액체비료나 완효성 비료를 소량 사용하면 생장이 좋아집니다."
                                    icon={Sparkles}
                                    color="bg-emerald-50 text-emerald-700"
                                />

                                <TipCard
                                    title="분갈이는 뿌리 상태 확인 후"
                                    desc="뿌리가 화분 바닥의 배수구를 막거나 겉흙이 빨리 마르면 한 단계 큰 화분으로 분갈이하세요."
                                    icon={Sprout}
                                    color="bg-amber-50 text-amber-700"
                                />
                            </div>
                        )}
                        {activeTab === 'harvest' && (
                            <div className="grid gap-4">
                                <TipCard
                                    title="첫 수확은 잎 4–6장일 때"
                                    desc="본잎이 4–6장 자랐을 때 첫 수확을 시작하세요. 한 번에 전체의 1/3 이하만 따서 식물에 스트레스를 주지 않습니다."
                                    icon={Tractor}
                                    color="bg-green-50 text-green-700"
                                />
                                <TipCard
                                    title="수확은 아침에, 향이 가장 좋아요"
                                    desc="물이 마른 아침에 수확하면 잎의 향과 수분 함량이 좋아집니다. 늦은 오후나 비가 온 직후는 피하세요."
                                    icon={Sunrise}
                                    color="bg-amber-50 text-amber-700"
                                />

                                <TipCard
                                    title="가위 대신 깨끗한 손가락으로 핀칭"
                                    desc="작은 가지나 새순은 손가락으로 살짝 집어 따면 상처가 적고 회복이 빠릅니다; 가위 사용 시에는 소독하세요."
                                    icon={Scissors}
                                    color="bg-indigo-50 text-indigo-600"
                                />

                                <TipCard
                                    title="아랫잎부터, 골고루 따기"
                                    desc="항상 아래쪽 큰 잎부터 따고, 한 줄기에서 최대 2/3 이상은 따지 마세요. 균형 있게 수확하면 재성장이 빨라집니다."
                                    icon={Leaf}
                                    color="bg-emerald-50 text-emerald-700"
                                />

                                <TipCard
                                    title="가지치기와 수확을 함께 하세요"
                                    desc="수확할 때 줄기 윗부분을 1–2마디 위에서 잘라주면 옆가지가 나와 다음 수확이 풍성해집니다."
                                    icon={TreeDeciduous}
                                    color="bg-indigo-50 text-indigo-600"
                                />

                                <TipCard
                                    title="한 번에 너무 많이 따지 않기"
                                    desc="초보자는 특히 한 번에 많은 잎을 따지 않도록 주의하세요. 전체 잎의 약 1/3 이하를 권장합니다."
                                    icon={CircleAlert}
                                    color="bg-red-50 text-red-600"
                                />

                                <TipCard
                                    title="수확 후 관리: 물·빛·통풍"
                                    desc="수확한 뒤에는 과도한 물주기나 갑작스런 그늘을 피하고, 적절한 햇빛과 통풍을 유지하면 회복이 빠릅니다."
                                    icon={Sparkles}
                                    color="bg-blue-50 text-blue-700"
                                />

                                <TipCard
                                    title="잎 보관은 신속히"
                                    desc="수확한 잎은 바로 사용하거나, 랩에 싸서 냉장 보관하거나 올리브유에 담가 보관하면 향을 오래 유지합니다."
                                    icon={Archive}
                                    color="bg-gray-50 text-gray-700"
                                />
                            </div>
                        )}
                        {activeTab === 'culinary' && (
                            <div className="grid gap-4">
                                <TipCard
                                    title="바질 페스토 간단 레시피"
                                    desc="바질 잎, 올리브유, 잣(또는 호두), 파르메산, 마늘을 블렌더에 넣고 곱게 갈아 빵이나 파스타에 곁들여 보세요."
                                    icon={UtensilsCrossed}
                                    color="bg-green-50 text-green-700"
                                />

                                <TipCard
                                    title="토마토 & 모짜렐라 카프레제"
                                    desc="얇게 썬 토마토와 모짜렐라 사이에 바질 잎을 올리고 올리브유·발사믹·소금·후추로 간단히 드레싱하세요."
                                    icon={Heart}
                                    color="bg-red-50 text-red-700"
                                />

                                <TipCard
                                    title="바질 오일로 풍미 업"
                                    desc="잎을 으깬 뒤 올리브유에 잠깐 우려 향을 낸 다음 샐러드나 구운 야채에 뿌려 사용하세요."
                                    icon={Droplets}
                                    color="bg-amber-50 text-amber-700"
                                />

                                <TipCard
                                    title="피자·브루스케타 토핑"
                                    desc="수확한 바질을 마지막에 찢어 올리면 향이 살아납니다; 고온에서 오래 굽지 마세요."
                                    icon={Slice}
                                    color="bg-indigo-50 text-indigo-600"
                                />

                                <TipCard
                                    title="바질 아이스 큐브"
                                    desc="잘게 썬 바질을 물이나 올리브유와 함께 얼려 즉석 요리에 사용하면 향 보존에 좋아요."
                                    icon={UtensilsCrossed}
                                    color="bg-blue-50 text-blue-700"
                                />

                                <TipCard
                                    title="허브 샌드위치 포인트"
                                    desc="마요네즈나 크림치즈에 다진 바질을 섞어 샌드위치에 바르면 상큼한 풍미가 납니다."
                                    icon={Box}
                                    color="bg-emerald-50 text-emerald-700"
                                />

                                <TipCard
                                    title="허브차·칵테일 가니시"
                                    desc="잎을 찢어 차에 넣거나 칵테일 위에 띄우면 향이 은은하게 퍼집니다."
                                    icon={Coffee}
                                    color="bg-pink-50 text-pink-600"
                                />
                            </div>
                        )}
                        {activeTab === 'trouble' && (
                            <div className="space-y-3">
                                <FAQItem q="잎끝이 검게 변해요" a="갑작스러운 저온(냉해), 물빠짐 불량으로 인한 뿌리 스트레스, 혹은 염류(비료) 축적으로 생길 수 있습니다. 즉시 온도를 확인하고(10°C 이하 회피), 과습이면 배수를 개선한 뒤 과한 비료는 씻어내듯 물을 충분히 주어 염류를 빼내세요." />
                                <FAQItem q="잎에 흰 가루가 보여요" a="흰가루병(균류)일 가능성이 큽니다. 통풍과 햇빛을 늘리고, 감염 초기에 감염 잎을 제거한 뒤 유기농용 무기계 살균제(또는 베이킹소다 용액)를 사용해 처리하세요." />
                                <FAQItem q="잎이 노랗게 지고 떨어져요" a="영양 불균형(질소 부족)이나 과습, 배수 불량 때문일 수 있습니다. 물주기 패턴을 점검하고 흙이 눅눅하면 물주기를 줄이며, 가벼운 질소 비료를 소량 주어 회복시키세요." />
                                <FAQItem q="줄기에 검은 반점이나 썩음이 보여요" a="곰팡이성 병해(흑색썩음 등) 또는 세균성 감염일 수 있습니다. 감염 부위를 잘라내고 도구를 소독한 뒤 통풍과 배수를 개선하고 필요하면 적절한 살균·살균제 처방을 받으세요." />
                                <FAQItem q="잎에 작은 구멍이나 깨진 자국이 있어요" a="해충(진딧물·응애·애벌레 등) 피해일 가능성이 높습니다. 잎 뒷면을 확인해 진딧물이나 알을 찾아 손으로 제거하거나 물로 씻어낸 뒤, 심하면 유기농 살충제나 비누물로 처리하세요." />
                                <FAQItem q="잎이 붙어있다가 말라붙어요(시들음)" a="뿌리썩음이나 급격한 수분 스트레스(건조→과습 반복) 때문입니다. 화분에서 뽑아 뿌리 상태를 확인하고 썩은 뿌리는 제거, 흙을 교체하거나 배수 개선 후 관리하세요." />
                                <FAQItem q="잎 가장자리가 갈색으로 마릅니다" a="직사광의 열스트레스, 물 부족 또는 염류 축적 때문입니다. 직사광이 너무 강하면 약한 그늘로 옮기고, 물주기 규칙을 맞추며 과도한 비료는 중단하세요." />
                                <FAQItem q="새순이 잘 자라지 않아요" a="빛 부족이나 영양 부족, 혹은 과도한 가지치기 탓일 수 있습니다. 창가로 옮겨 빛을 늘리고, 균형 잡힌 비료를 소량 보충한 뒤 가지치기는 식물 회복 속도를 고려해 간격을 두고 하세요." />
                                <FAQItem q="잎에 윤기 없는 흑점·황화가 있어요" a="진딧물 같은 흡즙성 해충의 배설물(그을음병 유발)일 수 있습니다. 잎 뒷면을 살펴 진딧물·깍지벌레가 있으면 제거하고, 물세척·천연 살충제로 관리하세요." />
                                <FAQItem q="처음 심고 금방 시들어요" a="흙에 맞지 않는 이식 스트레스, 뿌리 손상 또는 급격한 환경 변화 때문입니다. 이식 후에는 직사광과 과다한 물을 피하고, 통풍과 온도를 안정시켜 회복을 기다리세요." />
                                <FAQItem q="자주 실수하는 초보자 체크리스트" a="1) 흙 표면만 보고 물을 자주 줌(과습 유발), 2) 비료 과다 사용, 3) 통풍 무시(곰팡이 발생), 4) 개화 방치(잎 향 감소), 5) 병든 잎을 그대로 둠 — 이 다섯 가지를 먼저 점검하세요." />
                                <FAQItem q="어떻게 예방하나요?" a="좋은 배수의 흙, 규칙적이지만 과하지 않은 물주기, 충분한 빛과 통풍을 유지하세요. 새로운 식물은 격리 관찰하고, 의심 증상은 초기에 제거·처리하면 확산을 막을 수 있습니다." />
                            </div>
                        )}
                    </motion.div>
                </AnPresence>
            </div>
        </div>
    );
}

// 헬퍼 컴포넌트: 팁 카드
function TipCard({ title, desc, icon: Icon, color }: any) {
    return (
        <Card className="border-none shadow-sm p-6 flex gap-5 items-start bg-white rounded-[2rem] group hover:shadow-md transition-all">
            <div className={`p-4 rounded-2xl ${color} shrink-0 transition-transform group-hover:scale-110`}>
                <Icon size={24} />
            </div>
            <div className="space-y-1">
                <h4 className="font-black text-slate-800 text-lg">{title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
            </div>
        </Card>
    );
}

// 헬퍼 컴포넌트: FAQ 아이템
function FAQItem({ q, a }: { q: string, a: string }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-black">
                <div className="size-2 bg-emerald-500 rounded-full" />
                <span>Q. {q}</span>
            </div>
            <p className="text-sm text-slate-500 font-medium pl-4">{a}</p>
        </div>
    );
}

// Framer Motion 오타 수정 (AnimatePresence)
const AnPresence = AnimatePresence;