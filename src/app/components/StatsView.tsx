import { Card } from './ui/card';

export function StatsView() {
    return (
        <div className="p-10">
            <Card className="p-20 text-center bg-white/60 backdrop-blur-md rounded-3xl border-none">
                <h2 className="text-2xl font-bold text-emerald-900 mb-4">성장 데이터 분석</h2>
                <p className="text-gray-600">센서 측정치를 정리하는 화면입니다. 곧 그래프가 추가될 예정이에요! 📊</p>
            </Card>
        </div>
    );
}