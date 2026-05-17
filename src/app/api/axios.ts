import axios from 'axios';

const BASE_URL = 'http://44.222.207.103:8080/api/v1';

// 1️⃣ 토큰이 필요 없는 공개 API 전용 인스턴스 (로그인, 회원가입, 비번찾기)
export const publicApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2️⃣ 토큰 인증이 필요한 전용 인스턴스 (식물 조회, 제어, 홈캠 등)
export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 인증용 인스턴스에만 토큰을 주입합니다.
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken && config.headers) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 만료 시 토큰 재발급 로직
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('Refresh token이 없습니다.');

                // 토큰 재발급은 publicApi를 사용하여 인터셉터 혼선을 방지합니다.
                const response = await publicApi.post('/auth/refresh', {
                    refreshToken: refreshToken,
                });

                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

                localStorage.setItem('accessToken', newAccessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return api(originalRequest); // 원본 요청 재시도
            } catch (refreshError) {
                console.error('세션 만료. 다시 로그인해야 합니다.', refreshError);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                alert('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;