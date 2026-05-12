import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const UserContext = createContext<any>({ userInfo: null });

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [userInfo, setUserInfo] = useState<{ name: string } | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                // 실제 서버에 유저 정보를 요청하는 API
                const res = await api.get('/users/me');
                setUserInfo(res.data); // 서버에서 { name: "김동현" } 등을 내려준다고 가정
            } catch (err) {
                console.error("유저 정보를 가져오는데 실패했습니다.", err);
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