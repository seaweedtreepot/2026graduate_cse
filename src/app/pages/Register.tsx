import { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/axios'; // 아까 만든 공통 axios 인스턴스
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';

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
            // API 명세에는 없었지만 보통 /auth/register 또는 /auth/signup을 사용합니다.
            // 서버 환경에 맞춰 엔드포인트를 수정하세요.
            await api.post('/auth/register', {
                name,
                email,
                password,
            });

            alert('회원가입이 완료되었습니다!');
            navigate('/'); // 성공 시 로그인 페이지로 이동
        } catch (err: any) {
            console.error('회원가입 에러:', err);
            setError(err.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl">회원가입</CardTitle>
                    <CardDescription>
                        정보를 입력하여 새로운 계정을 생성하세요
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {/* 이름 */}
                            <div className="space-y-2">
                                <Label htmlFor="name">이름</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="홍길동"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            {/* 이메일 */}
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

                            {/* 비밀번호 */}
                            <div className="space-y-2">
                                <Label htmlFor="password">비밀번호</Label>
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
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* 비밀번호 확인 */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && <p className="text-sm text-destructive text-center">{error}</p>}
                        </div>

                        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                            {isLoading ? '처리 중...' : '회원가입'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <div className="text-sm text-center w-full text-muted-foreground">
                        이미 계정이 있으신가요?{' '}
                        <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => navigate('/')}
                        >
                            로그인
                        </button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Register;