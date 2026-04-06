import { createBrowserRouter } from 'react-router';
import { Login } from './pages/Login';
import { DeviceRegistrationPage } from './pages/DeviceRegistrationPage';
import { PlantSelectionPage } from './pages/PlantSelectionPage';
import { PlantStatusPage } from './pages/PlantStatusPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
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