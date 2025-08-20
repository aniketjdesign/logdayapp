import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { Navigation } from './components/Navigation';
import { ExerciseList } from './components/ExerciseList';
import { WorkoutSession } from './components/WorkoutSession';
import { WorkoutLogs } from './components/WorkoutLogs';
import { Settings } from './components/Settings';
import { Login } from './components/Auth/Login';
import { SignUp } from './components/Auth/SignUp';
import { AuthCallback } from './components/Auth/AuthCallback';
import { SplashScreen } from './components/others/SplashScreen';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ResetPasswordConfirmPage from './pages/ResetPasswordConfirmPage';
import { LogDayLogo } from './components/others/LogDayLogo';
import { ContactForm } from './components/ContactForm';
import { UpdateNotification } from './components/others/UpdateNotification';
import { WorkoutSkeleton } from './components/WorkoutSkeleton';
import RoutinesPage from './pages/routines';
import ProfilePage from './pages/ProfilePage';
import { Capacitor } from '@capacitor/core';
import { capacitorService } from './services/capacitor';
import { WhatsNewModal } from './components/others/WhatsNewModal';
import Lottie from 'lottie-react';
import loaderAnimation from './assets/animations/loader-app.json';

const AppContent = () => {
  const { user } = useAuth();
  const { currentWorkout } = useWorkout();
  const { defaultHomePage } = useSettings();
  const { showWhatsNew } = useOnboarding();
  const location = useLocation();
  const navigate = useNavigate();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isWorkoutRoute = location.pathname === '/workout';
  const isIOS = Capacitor.getPlatform() === 'ios';
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

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
      
      // Hide the splash screen when the app is fully loaded
      if (Capacitor.isNativePlatform()) {
        capacitorService.hideSplashScreen();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentWorkout, location.pathname, isInitialLoad]);

  // Show loading state while checking auth and workout status
  if (isLoading) {
    // Skip showing loading animation on iOS as we're using the native splash screen
    if (isIOS) {
      return null;
    }
    
    // Show skeleton loader for workout route when there's an active workout
    if (currentWorkout && isWorkoutRoute) {
      return <WorkoutSkeleton />;
    }
    // Show regular loading state for all other routes
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col space-y-16 items-center justify-center">
        <LogDayLogo />
        <Lottie
          animationData={loaderAnimation}
          loop
          style={{ width: 38, height: 38 }}
        />
      </div>
    );
  }

  // Handle public routes and special case for password reset
  // Check if we're on the reset-password-confirm route
  const isResetPasswordConfirmRoute = location.pathname === '/reset-password-confirm';
  
  // If user is not authenticated or we're on the reset-password-confirm route (even if authenticated)
  if (!user || isResetPasswordConfirmRoute) {
    if (
      location.pathname === '/splash' ||
      location.pathname === '/login' || 
      location.pathname === '/signup' || 
      location.pathname === '/reset-password' || 
      location.pathname === '/auth/callback' ||
      isResetPasswordConfirmRoute
    ) {
      return (
        <Routes>
          <Route path="/splash" element={isDesktop ? <Navigate to="/login" replace /> : <SplashScreen />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/reset-password-confirm" element={<ResetPasswordConfirmPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to={isDesktop ? "/login" : "/splash"} replace />} />
        </Routes>
      );
    }
    return <Navigate to={isDesktop ? "/login" : "/splash"} replace />;
  }

  // Hide navigation on mobile during workout
  const showNavigation = !isMobile || (isMobile && (!currentWorkout || !isWorkoutRoute));

  // Determine the default home path based on user settings
  const defaultHomePath = defaultHomePage === 'routines' ? '/routines' : '/';

  return (
    <div className="max-h-screen bg-gray-50">
      {showWhatsNew && <WhatsNewModal />}
      <div className={`${showNavigation ? "" : ""}`}>
        <Routes>
          <Route path="/" element={
            // Only redirect to default homepage when directly accessing root URL
            defaultHomePage === 'routines' ? 
            <Navigate to="/routines" replace /> : 
            <ExerciseList />
          } />
          <Route path="/quickstart" element={<ExerciseList />} />
          <Route path="/workout" element={<WorkoutSession />} />
          <Route path="/logs" element={<WorkoutLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/contact" element={<ContactForm />} />
          <Route path="/routines" element={<RoutinesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to={defaultHomePath} replace />} />
        </Routes>
      </div>
      {showNavigation && <Navigation />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <WorkoutProvider>
          <OnboardingProvider>
            <UpdateNotification />
            <AppContent />
          </OnboardingProvider>
        </WorkoutProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;