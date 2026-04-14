import { createBrowserRouter } from 'react-router';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DeviceRegistrationPage } from './pages/DeviceRegistrationPage';
import { PlantSelectionPage } from './pages/PlantSelectionPage';
import { PlantStatusPage } from './pages/PlantStatusPage';
import { PlantList } from './components/PlantList';

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
    path: '/plantList',
    element: <PlantList />,
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
]);