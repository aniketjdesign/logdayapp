import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { SettingsProvider } from './context/SettingsContext';
import { Navigation } from './components/Navigation';
import { ExerciseList } from './components/ExerciseList';
import { WorkoutSession } from './components/WorkoutSession';
import { WorkoutLogs } from './components/WorkoutLogs';
import { Settings } from './components/Settings';
import { Login } from './components/Auth/Login';
import { SignUp } from './components/Auth/SignUp';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ResetPasswordConfirmPage from './pages/ResetPasswordConfirmPage';

import { LogDayLogo } from './components/LogDayLogo';
import { ContactForm } from './components/ContactForm';
import { UpdateNotification } from './components/UpdateNotification';
import { WorkoutSkeleton } from './components/WorkoutSkeleton';
import RoutinesPage from './pages/routines';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuth();
  const { currentWorkout } = useWorkout();
  const location = useLocation();
  const navigate = useNavigate();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isWorkoutRoute = location.pathname === '/workout';

  // Handle initial route and loading
  useEffect(() => {
    if (isInitialLoad && currentWorkout) {
      // Check if we should redirect to workout
      if (location.pathname === '/') {
        navigate('/workout', { replace: true });
      }
      setIsInitialLoad(false);
    }

    // Handle loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentWorkout, location.pathname, isInitialLoad]);

  // Show loading state while checking auth and workout status
  if (isLoading) {
    // Show skeleton loader for workout route when there's an active workout
    if (currentWorkout && isWorkoutRoute) {
      return <WorkoutSkeleton />;
    }
    // Show regular loading state for all other routes
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col space-y-4 items-center justify-center">
        <LogDayLogo />
        <div className="animate-pulse text-gray-500 mr-1">Loading...</div>
      </div>
    );
  }

  // Handle public routes and special case for password reset
  // Check if we're on the reset-password-confirm route
  const isResetPasswordConfirmRoute = location.pathname === '/reset-password-confirm';
  
  // If user is not authenticated or we're on the reset-password-confirm route (even if authenticated)
  if (!user || isResetPasswordConfirmRoute) {
    if (
      location.pathname === '/login' || 
      location.pathname === '/signup' || 
      location.pathname === '/reset-password' || 
      isResetPasswordConfirmRoute
    ) {
      return (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/reset-password-confirm" element={<ResetPasswordConfirmPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      );
    }
    return <Navigate to="/login" replace />;
  }

  // Hide navigation on mobile during workout
  const showNavigation = !isMobile || (isMobile && (!currentWorkout || !isWorkoutRoute));

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavigation && <Navigation />}
      <div className={showNavigation ? "pt-16" : ""}>
        <Routes>
          <Route path="/" element={<ExerciseList />} />
          <Route path="/workout" element={<WorkoutSession />} />
          <Route path="/logs" element={<WorkoutLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/contact" element={<ContactForm />} />

          <Route path="/routines" element={<RoutinesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <WorkoutProvider>
          <UpdateNotification />
          <AppContent />
        </WorkoutProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;