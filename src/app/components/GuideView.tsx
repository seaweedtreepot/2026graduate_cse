import { Card } from './ui/card';
import { Leaf, AlertTriangle } from 'lucide-react';

export function GuideView() {
    return (
        <div className="p-10 space-y-6">
            <Card className="p-8 bg-white/80 backdrop-blur-md rounded-3xl border-none shadow-xl">
                <h2 className="text-3xl font-black text-emerald-900 mb-6">바질(Basil) 도감 📖</h2>
                <div className="space-y-6 text-gray-700">
                    <section>
                        <h3 className="font-bold text-emerald-700 flex items-center gap-2 mb-2"><Leaf className="size-5" /> 특징</h3>
                        <p className="bg-emerald-50/50 p-4 rounded-2xl">햇빛과 통풍을 좋아하는 허브의 왕입니다.</p>
                    </section>
                    <section className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                        <h3 className="font-bold text-rose-700 flex items-center gap-2 mb-2"><AlertTriangle className="size-5" /> 주의사항</h3>
                        <p className="text-sm">• 추위에 약해요 (15도 이상 유지)<br />• 겉흙이 말랐을 때 물을 듬뿍 주세요.</p>
                    </section>
                </div>
            </Card>
        </div>
    );
}