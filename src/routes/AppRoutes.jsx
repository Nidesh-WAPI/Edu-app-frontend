import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import BottomNav from '@/components/layout/BottomNav';
import SideNav from '@/components/layout/SideNav';

import PhonePage      from '@/pages/auth/PhonePage';
import OtpPage        from '@/pages/auth/OtpPage';
import HomePage       from '@/pages/home/HomePage';
import AITextbookPage from '@/pages/ai-textbook/AITextbookPage';
import ProfilePage    from '@/pages/profile/ProfilePage';
import QuizPage       from '@/pages/quiz/QuizPage';
import UnitTestPage   from '@/pages/unit-test/UnitTestPage';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
}

/* Auth layout — full screen on mobile, centered card on desktop */
function AuthLayout({ children }) {
  return (
    <div className="flex h-screen flex-col bg-white md:bg-gradient-to-br md:from-indigo-600 md:via-indigo-500 md:to-purple-700 md:items-center md:justify-center">
      <div className="flex flex-1 flex-col w-full md:flex-none md:max-w-md md:rounded-3xl md:overflow-hidden md:shadow-2xl">
        {children}
      </div>
    </div>
  );
}

/* Authenticated layout — responsive across all screen sizes */
function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar — tablet and above */}
      <SideNav />

      {/* Main area — offset by sidebar width on md+ */}
      <div className="flex flex-1 flex-col overflow-hidden md:pl-16 xl:pl-56 2xl:pl-64">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {/* Constrain max-width on large screens so content doesn't stretch too wide */}
          <div className="flex flex-1 flex-col w-full mx-auto
            md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-6xl
            md:px-0 xl:px-0
          ">
            {children}
          </div>
        </main>

        {/* Bottom nav — mobile only (hidden md+) */}
        <BottomNav />
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public — centered card on desktop */}
      <Route path="/login" element={<PublicRoute><AuthLayout><PhonePage /></AuthLayout></PublicRoute>} />
      <Route path="/otp"   element={<PublicRoute><AuthLayout><OtpPage /></AuthLayout></PublicRoute>} />

      {/* Authenticated — with bottom nav */}
      <Route path="/home" element={
        <PrivateRoute><AppLayout><HomePage /></AppLayout></PrivateRoute>
      } />
      <Route path="/ai-textbook" element={
        <PrivateRoute><AppLayout><AITextbookPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/quiz" element={
        <PrivateRoute><AppLayout><QuizPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/unit-test" element={
        <PrivateRoute><AppLayout><UnitTestPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute><AppLayout><ProfilePage /></AppLayout></PrivateRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
