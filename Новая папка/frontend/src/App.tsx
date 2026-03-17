import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import HomePage from './pages/HomePage';
import LegalPage from './pages/LegalPage';
import PurchasePage from './pages/PurchasePage';
import SupportPage from './pages/SupportPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import { LocaleProvider } from './lib/locale';
import { AuthProvider } from './lib/auth-context';
import DownloadPage from './pages/DownloadPage';
import UserAgreementPage from './pages/UserAgreementPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import AdminPage from './pages/AdminPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'legal', element: <LegalPage /> },
      { path: 'purchase', element: <PurchasePage /> },
      { path: 'support', element: <SupportPage /> },
      { path: 'auth', element: <AuthPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'download', element: <DownloadPage /> },
      { path: 'user-agreement', element: <UserAgreementPage /> },
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      { path: 'refund-policy', element: <RefundPolicyPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'home', element: <Navigate to="/" replace /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
]);

export default function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </LocaleProvider>
  );
}
