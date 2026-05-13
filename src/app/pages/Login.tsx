import { LoginForm } from '../components/LoginForm';

export function Login() {
  return (
    // ✅ p-4를 p-0으로 바꾸고, 큰 화면에서만 여백을 주도록 sm:p-4 추가
    // size-full 보다는 min-h-screen w-full이 배경을 꽉 채우기에 더 안전합니다.
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-0 sm:p-4">
      <LoginForm />
    </div>
  );
}