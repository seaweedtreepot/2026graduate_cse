import axios from 'axios';

// 1. Axios 인스턴스 생성
const api = axios.create({
    baseURL: 'http://3.39.21.82:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    // 방법 A: 인스턴스 자체에 Basic 인증 정보를 고정 (가장 간단)
    auth: {
        username: 'user',
        password: '1234'
    }
});

// 2. 요청 인터셉터 (만약 나중에 토큰 방식으로 바뀔 것을 대비해 유지한다면)
api.interceptors.request.use(
    (config) => {
        // 현재 백엔드는 Basic Auth를 사용하므로, 
        // 위에서 설정한 auth 객체가 자동으로 Authorization 헤더를 생성합니다.
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;