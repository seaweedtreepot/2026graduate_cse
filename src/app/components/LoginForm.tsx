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
    // ✅ 부모: 모바일에서는 위아래 여백 없이 꽉 채움
    <div className="min-h-screen w-full flex flex-col sm:items-center sm:justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-0 sm:p-4">

      {/* 배경 장식 (모바일에서는 불필요하면 hidden 처리 가능) */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-200/40 rounded-full blur-3xl animate-pulse sm:block hidden" />

      {/* ✅ Card: 모바일에서 min-h-screen과 rounded-none으로 '앱'처럼 보이게 함 */}
      <Card className="w-full sm:max-w-md min-h-screen sm:min-h-fit border-none shadow-none sm:shadow-2xl bg-white/90 sm:bg-white/80 backdrop-blur-md z-10 rounded-none sm:rounded-[2.5rem] flex flex-col">

        {/* ✅ 헤더: 노치(Safe Area) 고려한 패딩 */}
        <CardHeader className="space-y-2 text-center pt-[calc(3rem+env(safe-area-inset-top))] pb-6 px-8">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner">
              <Sprout size={40} className="animate-bounce-slow" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-emerald-900">
            Green Mate <span className="text-emerald-500 font-light">AI</span>
          </CardTitle>
          <CardDescription className="text-emerald-700/80 font-medium">
            반려식물의 정원에 오신 걸 환영해요!
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* 이메일 입력 섹션 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-emerald-800 ml-1">이메일 계정</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@green.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-emerald-100 focus:border-emerald-400 focus:ring-emerald-400 bg-white/50"
                    required
                  />
                </div>
              </div>

              {/* 비밀번호 입력 섹션 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-emerald-800">비밀번호</Label>
                  <button
                    type="button"
                    className="text-xs text-emerald-600 hover:text-emerald-500 hover:underline transition-all"
                    onClick={() => navigate('/forgot-password')}
                  >
                    분실하셨나요?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-emerald-100 focus:border-emerald-400 focus:ring-emerald-400 bg-white/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* 게이미피케이션 요소가 가미된 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  정원 데이터 불러오는 중...
                </span>
              ) : (
                <span className="flex items-center gap-2 text-lg">
                  <Sparkles size={20} /> 정원 입장하기
                </span>
              )}
            </Button>
          </form>
        </CardContent>

        {/* ✅ 푸터: 하단 홈 바(Safe Area) 고려한 패딩 */}
        <CardFooter className="flex flex-col space-y-8 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] px-10">
          <div className="text-sm text-center text-emerald-800">
            아직 정원사가 아니신가요?{' '}
            <button type="button" className="font-black text-emerald-600 underline underline-offset-4" onClick={() => navigate('/register')}>회원가입</button>
          </div>

          <div className="w-full flex items-center gap-2">
            <div className="h-[1px] flex-1 bg-emerald-100" />
            <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold">Dev Mode</span>
            <div className="h-[1px] flex-1 bg-emerald-100" />
          </div>

          {/* ✅ 기능 추가: Dev Mode 클릭 시 이동 */}
          <button
            type="button"
            className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-600 mx-auto transition-colors font-bold"
            onClick={() => navigate('/plant-list')}
          >
            <Leaf size={14} /> 기기 등록 프리뷰 (Dev)
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}