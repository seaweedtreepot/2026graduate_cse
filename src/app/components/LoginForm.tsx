import { useState } from 'react';
import { useNavigate } from 'react-router'; // 또는 'react-router'
import api from '../api/axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Eye, EyeOff, Lock, Mail, Sprout, Sparkles, Leaf } from 'lucide-react';

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { accessToken, refreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // 로그인 성공 후 식물 목록 화면으로 이동
      navigate('/plant-list');
    } catch (error) {
      console.error('로그인 에러:', error);
      // 여기에 에러 알림(Toast 등)을 추가하면 더 좋습니다.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ✅ p-4를 sm:p-4로 변경하여 모바일에서는 여백 제거
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 sm:p-4 transition-all">

      {/* 배경 장식 (모바일에서는 조금 더 흐릿하게 처리하여 콘텐츠 집중도 향상) */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-200/30 rounded-full blur-3xl animate-pulse sm:opacity-100 opacity-50" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl animate-pulse delay-700 sm:opacity-100 opacity-50" />

      {/* 
         ✅ 카드 스타일 수정:
         - 모바일: w-full, h-full(또는 min-h-screen), rounded-none, shadow-none
         - 데스크탑(sm 이상): max-w-md, h-auto, rounded-3xl, shadow-2xl
      */}
      <Card className="w-full sm:max-w-md min-h-screen sm:min-h-0 border-none sm:border-solid shadow-none sm:shadow-2xl bg-white/90 sm:bg-white/80 backdrop-blur-xl z-10 sm:rounded-[2.5rem] rounded-none flex flex-col justify-center">

        {/* 내부 패딩을 px-8로 늘려 콘텐츠를 더 큼직하게 배치 */}
        <CardHeader className="space-y-4 text-center pt-12 sm:pt-6 px-8">
          <div className="flex justify-center">
            <div className="p-4 bg-emerald-100 rounded-[2rem] text-emerald-600 shadow-inner group transition-transform hover:scale-110">
              <Sprout size={40} className="animate-bounce-slow" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-black tracking-tighter text-emerald-900">
              Green Mate <span className="text-emerald-500">AI</span>
            </CardTitle>
            <CardDescription className="text-emerald-700/60 font-bold text-base">
              반려식물을 위한 스마트 정원
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* 이메일 섹션 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-black text-emerald-800 uppercase tracking-wider ml-1">이메일 계정</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@green.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    // ✅ 높이를 h-14로 늘려 모바일 터치감과 가독성 향상
                    className="h-14 pl-12 rounded-2xl border-emerald-100 bg-white/50 focus:ring-2 focus:ring-emerald-500/20 transition-all text-base"
                    required
                  />
                </div>
              </div>

              {/* 비밀번호 섹션 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">비밀번호</Label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 pl-12 pr-12 rounded-2xl border-emerald-100 bg-white/50 text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-emerald-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-emerald-600/60 hover:text-emerald-500 mt-2 ml-1"
                  onClick={() => navigate('/forgot-password')}
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-16 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-[0.97]"
              disabled={isLoading}
            >
              {isLoading ? "데이터 로드 중..." : "정원 입장하기"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-8 px-8 pb-12 sm:pb-8">
          <div className="text-sm text-center font-medium text-emerald-800/70">
            아직 정원사가 아니신가요?{' '}
            <button
              type="button"
              className="font-black text-emerald-600 underline underline-offset-4"
              onClick={() => navigate('/register')}
            >
              회원가입 하기
            </button>
          </div>

          {/* 데브 모드 디자인 간소화 (모바일에서 공간 확보) */}
          <button
            type="button"
            className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-emerald-300 hover:text-emerald-500 mx-auto transition-colors uppercase"
            onClick={() => navigate('/plant-list')}
          >
            <Leaf size={12} /> Device Preview
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}