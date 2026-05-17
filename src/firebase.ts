// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);

const messaging = getMessaging(app);

export { messaging, getToken, onMessage };