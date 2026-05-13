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
    // ✅ 1. p-4를 제거하고 'sm:p-4'를 주어 모바일에서 좌우 여백 삭제
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-0 sm:p-4">

      {/* 배경 장식은 유지 */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-200/30 rounded-full blur-3xl animate-pulse opacity-50 sm:opacity-100" />

      {/* 
         ✅ 2. 카드 스타일 핵심 수정
         - w-full: 무조건 가로 꽉 차게
         - rounded-none: 모바일에서 모서리 각지게 (화면 밀착)
         - sm:rounded-[2.5rem]: 테블릿/PC에서만 다시 둥근 박스로
         - min-h-screen: 모바일에서 세로로도 꽉 차게
      */}
      <Card className="w-full sm:max-w-md min-h-screen sm:min-h-0 border-none shadow-none sm:shadow-2xl bg-white/90 backdrop-blur-xl z-10 rounded-none sm:rounded-[2.5rem] flex flex-col justify-center">

        {/* 헤더 부분 패딩 조절 */}
        <CardHeader className="space-y-4 text-center pt-12 pb-6 px-8">
          <div className="flex justify-center">
            <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner">
              <Sprout size={44} className="animate-bounce-slow" />
            </div>
          </div>
          <div>
            <CardTitle className="text-4xl font-black tracking-tighter text-emerald-900">
              Green Mate <span className="text-emerald-500 font-light">AI</span>
            </CardTitle>
            <p className="text-emerald-700/60 font-bold mt-2">스마트 정원에 접속하세요</p>
          </div>
        </CardHeader>

        {/* 폼 내부 좌우 패딩을 px-8~10으로 주어 텍스트가 화면 끝에 너무 붙지 않게 조절 */}
        <CardContent className="px-10 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-emerald-800 ml-1 uppercase tracking-widest">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-emerald-400" />
                  <Input
                    type="email"
                    placeholder="이메일을 입력하세요"
                    className="h-15 pl-12 rounded-2xl border-emerald-50 bg-white/50 text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-black text-emerald-800 ml-1 uppercase tracking-widest">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-emerald-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    className="h-15 pl-12 pr-12 rounded-2xl border-emerald-50 bg-white/50 text-base"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-emerald-100 mt-4"
            >
              정원 입장하기
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-10 px-10 pb-12">
          <div className="text-sm text-center text-emerald-800/70 font-medium">
            아직 정원사가 아니신가요?{' '}
            <button className="font-black text-emerald-600 underline underline-offset-4">회원가입</button>
          </div>

          <button className="text-[10px] font-black tracking-[0.3em] text-emerald-200 uppercase mx-auto">
            Green Mate Dev Mode
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}