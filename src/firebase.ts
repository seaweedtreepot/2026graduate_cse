import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDtFTrz5EKv9qsd6b_jyUY2sfGypfVzy1Q",
    authDomain: "greenmate-7b029.firebaseapp.com",
    projectId: "greenmate-7b029",
    storageBucket: "greenmate-7b029.firebasestorage.app",
    messagingSenderId: "984562560408",
    appId: "1:984562560408:web:8d372bd1eb11fa18cd0fed",
    measurementId: "G-SM9XSE56LY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics 안전장치 (웹 환경에서만 작동하도록 보장)
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// 🚨 [핵심 수정 구역] iOS 앱 크래시 방지용 변수 선언
let messaging: any = null;

// 브라우저 환경이면서 'Service Worker'를 지원하는 환경(즉, 일반 웹)에서만 실행합니다.
// 아이폰 앱(Capacitor) 환경에서는 serviceWorker가 없으므로 이 if문을 건너뛰어 안전합니다!
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
}

export { messaging, getToken, onMessage, isSupported };