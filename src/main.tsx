// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/index.css';
import { UserProvider } from './app/context/UserContext'; // 1. UserProvider 임포트

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        {/* 2. App 전체를 UserProvider로 감싸줍니다. */}
        <UserProvider>
            <App />
        </UserProvider>
    </React.StrictMode>
);