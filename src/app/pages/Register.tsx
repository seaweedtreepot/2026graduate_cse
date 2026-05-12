import { useState } from 'react';
import { useNavigate } from 'react-router'; // 프로젝트 환경에 따라 'react-router' 또는 'react-router-dom'
import api from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Eye, EyeOff, Lock, Mail, User, Sprout, Sparkles, Leaf } from 'lucide-react';

export function Register() {
    const navigate = useNavigate();

    // 상태 관리
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            setIsLoading(false);
            return;
        }

        try {
            await api.post('/auth/register', {
                name,
                email,
                password,
            });

            alert('정원사 등록이 완료되었습니다! 첫 씨앗을 심으러 가볼까요?');
            navigate('/');
        } catch (err: any) {
            console.error('회원가입 에러:', err);
            setError(err.response?.data?.message || '정원사 등록 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-4">
            {/* 배경 블러 효과 요소 */}
            <div className="absolute top-10 left-10 w-72 h-72 bg-green-200/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-pulse delay-1000" />

            <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-md z-10">
                <CardHeader className="space-y-2 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner">
                            <Leaf size={32} className="animate-bounce-slow" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight text-emerald-900">
                        새로운 씨앗 심기
                    </CardTitle>
                    <CardDescription className="text-emerald-700/80 font-medium">
                        Green Mate AI와 함께할 정원사 정보를 입력해 주세요
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* 이름 입력 */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-emerald-800 ml-1">이름 (닉네임)</Label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                                <Input
                                    id="name"
                                    placeholder="멋진 정원사 이름"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 border-emerald-100 focus:border-emerald-400 focus:ring-emerald-400 bg-white/50"
                                    required
                                />
                            </div>
                        </div>

                        {/* 이메일 입력 */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-emerald-800 ml-1">이메일 계정</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seed@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 border-emerald-100 focus:border-emerald-400 focus:ring-emerald-400 bg-white/50"
                                    required
                                />
                            </div>
                        </div>

                        {/* 비밀번호 입력 */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-emerald-800 ml-1">비밀번호</Label>
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

                        {/* 비밀번호 확인 입력 */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-emerald-800 ml-1">비밀번호 확인</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10 pr-10 border-emerald-100 focus:border-emerald-400 focus:ring-emerald-400 bg-white/50"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-emerald-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 text-center font-medium bg-red-50 py-2 rounded-lg border border-red-100">
                                {error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    정원사 등록 중...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-lg">
                                    <Sprout size={20} /> 정원 가꾸기 시작
                                </span>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter>
                    <div className="text-sm text-center w-full text-emerald-800">
                        이미 계정이 있으신가요?{' '}
                        <button
                            type="button"
                            className="font-bold text-emerald-600 hover:text-emerald-500 hover:underline underline-offset-4"
                            onClick={() => navigate('/')}
                        >
                            로그인하러 가기
                        </button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Register;