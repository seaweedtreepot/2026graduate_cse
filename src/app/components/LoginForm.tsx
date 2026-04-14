import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 로그인 로직 시뮬레이션
    // setTimeout(() => {
    //   console.log('로그인 시도:', { email, password });
    //   setIsLoading(false);
    //   // 로그인 성공 후 기기 등록 화면으로 이동
    //   navigate('/device-registration');
    // }, 1500);


    try {
      // 이제 'api' 인스턴스를 사용합니다.
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { accessToken, refreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      navigate('/plantList'); // 로그인 성공 후 식물 목록 화면으로 이동
    } catch (error) {
      console.error('로그인 에러:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription>
          이메일과 비밀번호를 입력하여 로그인하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => console.log('비밀번호 찾기')}
                >
                  비밀번호 찾기
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              또는
            </span>
          </div>
        </div>
        <div className="text-sm text-center text-muted-foreground">
          계정이 없으신가요?{' '}
          <button
            type="button"
            className="text-primary hover:underline"
            //onClick={() => console.log('회원가입')}
            onClick={() => navigate('/register')} // 회원가입 경로로 이동
          >
            회원가입
          </button>
        </div>
        <div className="text-xs text-center text-muted-foreground border-t pt-4">
          개발 모드:{' '}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => navigate('/plantList')}
          >
            기기 등록 화면 보기
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}