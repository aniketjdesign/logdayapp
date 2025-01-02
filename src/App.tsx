import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { MigrationStatus } from './components/MigrationStatus';
import { LogDayLogo } from './components/LogDayLogo';
import { ContactForm } from './components/ContactForm';
import { UpdateNotification } from './components/UpdateNotification';
import RoutinesPage from './pages/routines';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const { currentWorkout } = useWorkout();
  const [showMigration, setShowMigration] = useState(false);

  useEffect(() => {
    const checkMigration = async () => {
      const migrationNeeded = await checkIfMigrationNeeded();
      setShowMigration(migrationNeeded);
    };

    if (user) {
      checkMigration();
    }
  }, [user]);

  if (showMigration) {
    return <MigrationStatus onComplete={() => setShowMigration(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col min-h-screen">
        {location.pathname !== '/workout' && (
          <Navigation />
        )}
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                currentWorkout ? (
                  <Navigate to="/workout" replace />
                ) : (
                  <Navigate to="/routines" replace />
                )
              }
            />
            <Route
              path="/routines/*"
              element={<ProtectedRoute><ExerciseList /></ProtectedRoute>}
            />
            <Route
              path="/workout"
              element={<ProtectedRoute><WorkoutSession /></ProtectedRoute>}
            />
            <Route
              path="/logs"
              element={<ProtectedRoute><WorkoutLogs /></ProtectedRoute>}
            />
            <Route
              path="/settings"
              element={<ProtectedRoute><Settings /></ProtectedRoute>}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/contact" element={<ContactForm />} />
            <Route path="/routines" element={<RoutinesPage />} />
          </Routes>
        </main>
      </div>
      <UpdateNotification />
    </div>
  );
}

function App() {
  return (
    <div className="app-layout bg-gray-50">
      <AuthProvider>
        <SettingsProvider>
          <WorkoutProvider>
            <div className="app-content">
              <AppContent />
            </div>
          </WorkoutProvider>
        </SettingsProvider>
      </AuthProvider>
    </div>
  );
}

export default App;