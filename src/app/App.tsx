import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useEffect } from 'react';
import { getMessagingInstance, onMessage } from '../firebase';
import { Toaster, toast } from 'sonner';

export default function App() {
  useEffect(() => {
    let unsubscribe = () => {};

    const setupMessaging = async () => {
      try {
        const messaging = await getMessagingInstance();
        if (messaging) {
          unsubscribe = onMessage(messaging, (payload) => {
            console.log('포그라운드 메시지 수신: ', payload);
            if (payload.notification) {
              // 1. 앱 내 상단 UI 알림 (Sonner)
              toast.success(payload.notification.title || '알림', {
                description: payload.notification.body,
                position: 'top-center',
                duration: 5000,
              });

              // 2. 브라우저/시스템 알림 (원하시면 삭제하셔도 됩니다)
              if (Notification.permission === 'granted') {
                new Notification(payload.notification.title || '알림', {
                  body: payload.notification.body,
                  icon: '/icon-192.png'
                });
              }
            }
          });
        }
      } catch (e) {
        console.error("포그라운드 알림 설정 실패:", e);
      }
    };
    setupMessaging();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      <Toaster richColors closeButton />
      <RouterProvider router={router} />
    </>
  );
}