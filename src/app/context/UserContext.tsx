import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const UserContext = createContext<any>({ userInfo: null });

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [userInfo, setUserInfo] = useState<{ name: string } | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                // 1. 실제 서버에 유저 정보를 요청
                const res = await api.get('/users/me');
                setUserInfo(res.data);
            } catch (err) {
                console.error("유저 정보를 가져오는데 실패했습니다. 더미 데이터로 대체합니다.", err);

                // 💡 [수정 포인트] 백엔드 에러(500) 발생 시 프론트가 멈추지 않도록 임시 데이터 주입
                // 백엔드 개발자가 해당 API를 고치거나 명세서를 추가하기 전까지 가동할 방어 코드입니다.
                setUserInfo({ name: "김동현" });
            }
        };

        if (localStorage.getItem('accessToken')) {
            fetchUserProfile();
        }
    }, []);

    return (
        <UserContext.Provider value={{ userInfo }}>
            {children}
        </UserContext.Provider>
    );
}