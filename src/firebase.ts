import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDtFTrz5EKv9qsd6b_jyUY2sfGypfVzy1Q",
    authDomain: "greenmate-7b029.firebaseapp.com",
    projectId: "greenmate-7b029",
    storageBucket: "greenmate-7b029.firebasestorage.app",
    messagingSenderId: "984562560408",
    appId: "1:984562560408:web:8d372bd1eb11fa18cd0fed",
    measurementId: "G-SM9XSE56LY"
};

const app = initializeApp(firebaseConfig);

const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// messaging을 직접 export하는 대신, 필요할 때 호출하는 함수로 변경
// isSupported()가 비동기라 타이밍 문제 없이 안전하게 인스턴스를 반환합니다
export const getMessagingInstance = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

    const supported = await isSupported();
    if (!supported) {
        console.warn("🔕 FCM 미지원 환경 (iOS 16.3 이하 또는 PWA 아님)");
        return null;
    }

    return getMessaging(app);
};

export { getToken, onMessage, isSupported };
