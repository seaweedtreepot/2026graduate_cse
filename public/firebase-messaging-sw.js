// Scripts import 시 버전 확인 (v9 compat 버전 사용)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDtFTrz5EKv9qsd6b_jyUY2sfGypfVzy1Q",
    authDomain: "greenmate-7b029.firebaseapp.com",
    projectId: "greenmate-7b029",
    storageBucket: "greenmate-7b029.firebasestorage.app",
    messagingSenderId: "984562560408",
    appId: "1:984562560408:web:8d372bd1eb11fa18cd0fed",
    measurementId: "G-SM9XSE56LY"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 백그라운드 상태에서 푸시 수신 시 동작
messaging.onBackgroundMessage((payload) => {
    console.log('[sw] 백그라운드 메시지 수신:', payload);

    const notificationTitle = payload.notification.title || "반려식물 알림";
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.ico', // 적절한 아이콘 경로로 수정
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});