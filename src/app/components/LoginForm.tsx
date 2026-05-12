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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-4">
      {/* 배경에 떠다니는 듯한 느낌의 블러 효과 원형 (AI/디지털 느낌 강조) */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-200/40 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl animate-pulse delay-700" />

      <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-md z-10">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner">
              <Sprout size={36} className="animate-bounce-slow" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-emerald-900">
            Green Mate <span className="text-emerald-500 font-light">AI</span>
          </CardTitle>
          <CardDescription className="text-emerald-700/80 font-medium">
            반려식물의 성장을 돕는 스마트 정원에 오신 걸 환영해요!
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

        <CardFooter className="flex flex-col space-y-6 pt-2">
          {/* 가입 유도 섹션 */}
          <div className="text-sm text-center text-emerald-800">
            아직 정원사가 아니신가요?{' '}
            <button
              type="button"
              className="font-bold text-emerald-600 hover:text-emerald-500 hover:underline underline-offset-4"
              onClick={() => navigate('/register')}
            >
              지금 씨앗 심기 (회원가입)
            </button>
          </div>

          {/* 개발자용 빠른 메뉴 (디자인 개선) */}
          <div className="w-full flex items-center gap-2">
            <div className="h-[1px] flex-1 bg-emerald-100" />
            <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold">Dev Mode</span>
            <div className="h-[1px] flex-1 bg-emerald-100" />
          </div>

          <button
            type="button"
            className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-600 mx-auto transition-colors"
            onClick={() => navigate('/plant-list')}
          >
            <Leaf size={12} /> 기기 등록 프리뷰
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}