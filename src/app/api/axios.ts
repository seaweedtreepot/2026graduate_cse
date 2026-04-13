import axios from 'axios';

// 1. Axios 인스턴스 생성
const api = axios.create({
    baseURL: 'http://localhost:8080', // 여기에 실제 서버 주소 입력
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. 요청 인터셉터: 모든 요청 직전에 실행됨
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            // 명세서에 있는 Authorization: Bearer {token} 형태를 자동 완성
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;