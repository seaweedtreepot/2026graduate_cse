import { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';

export function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // 서버의 비밀번호 재설정 이메일 발송 엔드포인트 (예: /auth/forgot-password)
            await api.post('/auth/password-reset', { email });
            setIsSubmitted(true);
        } catch (err: any) {
            console.error('비밀번호 찾기 에러:', err);
            setError(err.response?.data?.message || '이메일을 전송하는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-4">
            {/* 배경 블러 효과 */}
            <div className="absolute top-20 right-20 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 left-20 w-64 h-64 bg-green-200/30 rounded-full blur-3xl animate-pulse delay-700" />

            <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-md z-10">
                <CardHeader className="space-y-2 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner">
                            <KeyRound size={32} className="animate-pulse" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight text-emerald-900">
                        비밀번호 찾기
                    </CardTitle>
                    <CardDescription className="text-emerald-700/80 font-medium px-4">
                        {isSubmitted ? (
                            "정원으로 돌아가는 길을 메일로 보냈어요!"
                        ) : (
                            <>
                                가입하신 이메일을 입력하시면 <br />
                                비밀번호 재설정 링크를 보내드립니다.
                            </>
                        )}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-emerald-800 ml-1">이메일 주소</Label>
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

                            {error && (
                                <p className="text-sm text-red-500 text-center font-medium bg-red-50 py-2 rounded-lg border border-red-100">
                                    {error}
                                </p>
                            )}

                            <Button
                                type="submit"
                                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        메일 전송 중...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 text-lg">
                                        <Sparkles size={20} /> 재설정 메일 받기
                                    </span>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center py-6 space-y-4">
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-emerald-800 text-sm">
                                입력하신 <strong>{email}</strong> 주소로 안내 메일을 보냈습니다. 메일함(또는 스팸함)을 확인해 주세요.
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => setIsSubmitted(false)}
                            >
                                이메일 다시 입력하기
                            </Button>
                        </div>
                    )}
                </CardContent>

                <CardFooter>
                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 text-sm text-center w-full text-emerald-600 hover:text-emerald-500 font-medium transition-colors"
                        onClick={() => navigate('/')}
                    >
                        <ArrowLeft size={16} /> 로그인 화면으로 돌아가기
                    </button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default ForgotPassword;