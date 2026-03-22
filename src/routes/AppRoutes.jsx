import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import BottomNav from '@/components/layout/BottomNav';

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

/* Authenticated layout: scrollable content + sticky bottom nav */
function AppLayout({ children }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto flex flex-col">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><PhonePage /></PublicRoute>} />
      <Route path="/otp"   element={<PublicRoute><OtpPage /></PublicRoute>} />

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
