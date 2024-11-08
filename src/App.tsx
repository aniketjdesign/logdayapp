import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { Navigation } from './components/Navigation';
import { ExerciseList } from './components/ExerciseList';
import { WorkoutSession } from './components/WorkoutSession';
import { WorkoutLogs } from './components/WorkoutLogs';
import { Login } from './components/Auth/Login';
import { SignUp } from './components/Auth/SignUp';
import { useAuth } from './context/AuthContext';

const AppContent = () => {
  const { user } = useAuth();

  // // Prevent page reload on mobile when pulling down
  // useEffect(() => {
  //   const preventDefault = (e: TouchEvent) => {
  //     e.preventDefault();
  //   };

  //   document.addEventListener('touchmove', preventDefault, { passive: false });
  //   return () => {
  //     document.removeEventListener('touchmove', preventDefault);
  //   };
  // }, []);

  return (
    <WorkoutProvider>
      <div className="min-h-screen bg-gray-50">
        {user && <Navigation />}
        <div className={user ? 'pt-16' : ''}>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
            <Route
              path="/"
              element={user ? <ExerciseList /> : <Navigate to="/login" />}
            />
            <Route
              path="/workout"
              element={user ? <WorkoutSession /> : <Navigate to="/login" />}
            />
            <Route
              path="/logs"
              element={user ? <WorkoutLogs /> : <Navigate to="/login" />}
            />
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </WorkoutProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;