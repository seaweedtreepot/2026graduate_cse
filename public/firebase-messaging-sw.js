// Scripts import 시 버전 확인 (v9 compat 버전 사용)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
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