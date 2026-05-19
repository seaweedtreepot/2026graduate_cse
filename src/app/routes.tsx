import { createBrowserRouter } from 'react-router';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DeviceRegistrationPage } from './pages/DeviceRegistrationPage';
import { PlantSelectionPage } from './pages/PlantSelectionPage';
import { PlantStatusPage } from './pages/PlantStatusPage';
import { PlantList } from './components/PlantList';
import { ForgotPassword } from './pages/ForgotPassword';
import { NotificationHistoryPage } from './pages/NotificationHistoryPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />, // 회원가입 페이지 컴포넌트로 변경 필요
  }
  ,
  {
    path: '/plant-list',
    element: <PlantList />,
  }
  ,
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  }
  ,
  {
    path: '/device-registration',
    element: <DeviceRegistrationPage />,
  },
  {
    path: '/plant-selection',
    element: <PlantSelectionPage />,
  },
  {
    path: '/plant-status',
    element: <PlantStatusPage />,
  },
  {
    path: '/notifications',
    element: <NotificationHistoryPage />,
  },
  {
    path: '*',
    element: <div className="p-10">404: 경로를 찾을 수 없습니다. 주소창을 확인하세요!</div>,
  },
]);