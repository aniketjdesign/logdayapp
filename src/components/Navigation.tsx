import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, LogOut, Bell, User } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogoutConfirmationModal } from './LogoutConfirmationModal';
import { LogDayLogo } from './LogDayLogo';

declare global {
  interface Window {
    Canny: any;
  }
}

export const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { 
    setSelectedExercises,
    setCurrentView,
    currentWorkout,
    clearWorkoutState 
  } = useWorkout();
  const { user, signOut } = useAuth();
  const cannyInitialized = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Canny && user?.email && !cannyInitialized.current) {
      cannyInitialized.current = true;

      window.Canny('identify', {
        appID: '672e7aa3fb3f5695ec02ebee',
        user: {
          email: user.email,
          id: user.id,
          name: user.email.split('@')[0],
        },
      });

      window.Canny('initChangelog', {
        appID: '672e7aa3fb3f5695ec02ebee',
        position: 'bottom',
        align: 'right',
        theme: 'light'
      });
    }
  }, [user]);

  const handleLogoutClick = () => {
    if (currentWorkout) {
      setShowLogoutConfirmation(true);
    } else {
      handleLogout();
    }
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      clearWorkoutState();
      await signOut();
      setShowLogoutConfirmation(false);
      cannyInitialized.current = false;
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleFinishWorkout = () => {
    setShowLogoutConfirmation(false);
    navigate('/workout');
  };

  const handleGoToWorkout = () => {
    setShowLogoutConfirmation(false);
    navigate('/workout');
  };

  const navigateToHome = () => {
    setSelectedExercises([]);
    setCurrentView('exercises');
    setIsMenuOpen(false);
    navigate('/');
  };

  const navigateToWorkout = () => {
    setCurrentView('workout');
    setIsMenuOpen(false);
    navigate('/workout');
  };

  const navigateToLogs = () => {
    setCurrentView('logs');
    setIsMenuOpen(false);
    navigate('/logs');
  };

  const navigateToSettings = () => {
    setIsMenuOpen(false);
    navigate('/settings');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <LogDayLogo />
              <span className="ml-2 text-xl font-bold text-gray-900">Logday</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                data-canny-changelog
                className="px-2 py-1.5 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
              >
                🔔 What's new
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="flex items-center">
            <LogDayLogo className="h-8 w-8" />
            <span className="ml-2 text-xl font-bold text-gray-900">Logday</span>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 py-4">
          <button
            onClick={navigateToHome}
            className="w-full px-6 py-3 text-left text-gray-700 hover:bg-gray-100 font-medium"
          >
            Quick Start
          </button>
          {currentWorkout && (
            <button
              onClick={navigateToWorkout}
              className="w-full px-6 py-3 text-left text-gray-700 hover:bg-gray-100 font-medium"
            >
              Active Workout
            </button>
          )}
          <button
            onClick={navigateToLogs}
            className="w-full px-6 py-3 text-left text-gray-700 hover:bg-gray-100 font-medium"
          >
            Workout History
          </button>
          <button
            onClick={navigateToSettings}
            className="w-full px-6 py-3 text-left text-gray-700 hover:bg-gray-100 font-medium"
          >
            Settings
          </button>
        </div>

        <div className="border-t py-4 px-6 space-y-4">
          <div className="flex items-center space-x-3 text-gray-600">
            <User size={20} />
            <span className="text-sm font-medium truncate">{user?.email}</span>
          </div>
          <button
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            className="w-full py-2 text-red-600 hover:bg-red-50 font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={20} />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
      
      <LogoutConfirmationModal 
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onLogout={handleLogout}
        onFinishWorkout={handleFinishWorkout}
        onGoToWorkout={handleGoToWorkout}
      />
    </>
  );
};