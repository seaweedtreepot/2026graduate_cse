import axios from 'axios';

const BASE_URL = typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? '/api/v1'
    : `http://${window.location.hostname}:8080/api/v1`;

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

// 3️⃣ 토큰 재발급 대기 큐 및 상태 변수
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

// 응답 인터셉터: 401 만료 시 토큰 재발급 로직
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // 이미 토큰 재발급이 진행 중인 경우, 큐에 작업을 추가하고 대기
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

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

                processQueue(null, newAccessToken);
                isRefreshing = false;

                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return api(originalRequest); // 원본 요청 재시도
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;

                console.error('세션 만료. 다시 로그인해야 합니다.', refreshError);

                // 로그인 화면이 아니고, 스토리지에 토큰이 하나라도 남아있는 경우에만(최초 1회) 로그아웃 처리 실행
                const hasAccessToken = !!localStorage.getItem('accessToken');
                const hasRefreshToken = !!localStorage.getItem('refreshToken');
                const isNotLoginPage = window.location.pathname !== '/';

                if (isNotLoginPage && (hasAccessToken || hasRefreshToken)) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    alert('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
                    window.location.href = '/';
                } else if (isNotLoginPage) {
                    // 스토리지 토큰은 이미 지워졌지만 리다이렉트가 완료되지 않은 상황 방지
                    window.location.href = '/';
                }

                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
