import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import api from './axios'; // 기존 axios 인스턴스 활용

// Firebase 콘솔 -> 프로젝트 설정에서 확인 가능한 설정값
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestAndSaveToken = async () => {
    try {
        console.log('알림 권한 요청 중...');
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            // VAPID Key는 Firebase 콘솔 -> 클라우드 메시징 탭 하단에서 발급 가능합니다.
            const token = await getToken(messaging, {
                vapidKey: 'YOUR_VAPID_PUBLIC_KEY'
            });

            if (token) {
                console.log('발급된 FCM 토큰:', token);
                // 백엔드 API 명세에 맞춰 경로를 수정하세요 (예: /users/fcm-token)
                await api.post('/auth/fcm-token', { fcmToken: token });
            }
        } else {
            console.warn('사용자가 알림 권한을 거부했습니다.');
        }
    } catch (error) {
        console.error('FCM 설정 에러:', error);
    }
};

// 앱이 실행 중일 때 메시지 수신 리스너
export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log('포그라운드 메시지 수신:', payload);
            resolve(payload);
        });
    });