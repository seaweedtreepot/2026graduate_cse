import axios from 'axios';
import { getAccessToken, getRefreshToken, updateTokens, clearTokens } from '../utils/auth';

const BASE_URL = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname.includes('gimdonghyeon.xyz'))
    ? '/api/v1'
    : 'http://54.211.120.247:8080/api/v1';

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
        const accessToken = getAccessToken();
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

// 공통 리다이렉트 및 토큰 만료 처리 헬퍼 함수
const handleSessionExpiration = (message: string) => {
    const isNotLoginPage = window.location.pathname !== '/';
    if (isNotLoginPage) {
        clearTokens();
        alert(message);
        window.location.href = '/';
    }
};

// 응답 인터셉터: 401 만료 시 토큰 재발급 및 서버 연결/인증 에러 처리
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error';

        // 1. 일시적인 네트워크 오류 또는 게이트웨이 오류(502/503/504) 시 안전한 GET 요청에 대해 최대 3회 재시도(Retry)
        if (originalRequest && originalRequest.method?.toLowerCase() === 'get' && 
            (isNetworkError || status === 502 || status === 503 || status === 504)) {
            
            const req = originalRequest as any;
            req._retryCount = req._retryCount || 0;
            
            if (req._retryCount < 3) {
                req._retryCount += 1;
                const delay = req._retryCount * 1000; // 1초, 2초, 3초 지연
                console.warn(`[Axios Retry] GET 요청 실패 (에러 코드: ${status || 'Network Error'}), ${delay}ms 후 재시도 중... (${req._retryCount}/3)`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return api(originalRequest);
            }
        }

        // 2. 401 Unauthorized인 경우 토큰 재발급 시도
        if (error.response?.status === 401) {
            // 만약 이미 토큰 재발급 후 재시도한 요청인데도 또 401이 발생한 경우 즉시 로그아웃 처리
            if (originalRequest._retry) {
                console.error('토큰 재시도 후에도 401 응답 수신 - 세션 만료');
                handleSessionExpiration('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
                return Promise.reject(error);
            }

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
                const refreshToken = getRefreshToken();
                if (!refreshToken) {
                    throw new Error('REFRESH_TOKEN_MISSING');
                }

                // 토큰 재발급은 publicApi를 사용하여 인터셉터 혼선을 방지합니다.
                const response = await publicApi.post('/auth/refresh', {
                    refreshToken: refreshToken,
                });

                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

                updateTokens(newAccessToken, newRefreshToken);

                processQueue(null, newAccessToken);
                isRefreshing = false;

                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return api(originalRequest); // 원본 요청 재시도
            } catch (refreshError: any) {
                processQueue(refreshError, null);
                isRefreshing = false;

                const refreshStatus = refreshError.response?.status;
                const isRefreshNetworkError = refreshError.message !== 'REFRESH_TOKEN_MISSING' && 
                    (!refreshError.response || refreshError.code === 'ERR_NETWORK' || refreshError.message === 'Network Error');

                // 토큰 재발급 도중 발생한 일시적인 네트워크/게이트웨이 에러는 강제 로그아웃시키지 않습니다.
                if (isRefreshNetworkError || refreshStatus === 502 || refreshStatus === 503 || refreshStatus === 504) {
                    console.error('토큰 재발급 중 서버 통신 에러 발생:', refreshError);
                } else {
                    console.error('세션 만료. 다시 로그인해야 합니다.', refreshError);
                    handleSessionExpiration('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
                }

                return Promise.reject(refreshError);
            }
        }

        // 2. 서버 연결 에러(Network Error) 및 게이트웨이 에러(502/503/504) 발생 시 리다이렉트하지 않고 로그만 남김
        // 화면에서 에러를 잡아 상단 에러 바(isGlobalError) 등을 띄울 수 있도록 처리합니다.
        if (isNetworkError || status === 502 || status === 503 || status === 504) {
            console.error('서버 연결 및 통신 에러 발생 (리다이렉트 안 함):', error);
        }

        return Promise.reject(error);
    }
);

export default api;
