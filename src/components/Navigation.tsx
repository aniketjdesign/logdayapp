import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, LogOut, Bell, User, Share, RefreshCw, Zap, Timer, History, Settings, MessageSquare } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogoutConfirmationModal } from './LogoutConfirmationModal';
import { LogDayLogo } from './LogDayLogo';
import { InstallAppToast } from './InstallAppToast';

declare global {
  interface Window {
    Canny: any;
  }
}

export const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    setSelectedExercises,
    setCurrentView,
    currentWorkout,
    clearWorkoutState,
    searchLogs 
  } = useWorkout();
  const { user, signOut } = useAuth();
  const { isInstallable, isIOS } = useInstallPrompt();
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Force a hard refresh by reloading without cache
    window.location.reload(true);
  };

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
      
      // Clear all localStorage data
      Object.keys(localStorage).forEach(key => {
        if (!key.startsWith('vite-')) {
          localStorage.removeItem(key);
        }
      });

      // Clear all sessionStorage data
      sessionStorage.clear();

      // Reset Canny
      cannyInitialized.current = false;

      // Force a hard reload and redirect
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, force logout
      window.location.href = '/login';
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
      <nav className="app-header bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 bg-gray-50 text-gray-700 mr-2"
              >
                {isMenuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
              </button>
              <LogDayLogo/>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 ${
                  isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <RefreshCw size={16} strokeWidth={2} className={`${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                data-canny-changelog
                className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <Bell size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-40 safe-top ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
          <div className="flex items-center">
            <LogDayLogo/>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg bg-gray-50 text-gray-700"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 py-2">
          <button
            onClick={navigateToHome}
            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 border-b-[1.5px] border-gray-100 font-medium text-md flex items-center"
          >
            <Zap size={18} strokeWidth={2} className="mr-3 text-gray-500" />
            Quick Start
          </button>
          {currentWorkout && (
            <button
              onClick={navigateToWorkout}
              className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 border-b-[1.5px] border-gray-100 font-medium text-md flex items-center"
            >
              <Timer size={18} strokeWidth={2} className="mr-3  text-gray-500" />
              Active Workout
            </button>
          )}
          <button
            onClick={navigateToSettings}
            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 border-b-[1.5px] border-gray-100 font-medium text-md flex items-center"
          >
            <Settings size={18} strokeWidth={2} className="mr-3  text-gray-500" />
            Settings
          </button>
          <button
            onClick={navigateToLogs}
            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 border-b-[1.5px] border-gray-100 font-medium text-md flex items-center"
          >
            <History size={18} strokeWidth={2} className="mr-3  text-gray-500" />
            Workout History
          </button>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              navigate('/contact');
            }}
            className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-100 border-b-[1.5px] border-gray-100"
          >
            <MessageSquare size={18} className="mr-3 text-gray-500" />
            <span>Contact</span>
          </button>
          
        </div>
        {isInstallable && (
            <div className="p-3 bg-blue-50 rounded-lg m-4">
              <div className="flex items-center text-blue-800 mb-1.5">
                <Share size={16} strokeWidth={2} className="mr-2 flex-shrink-0" />
                <span className="text-sm font-medium">Install Logday App</span>
              </div>
              <p className="text-xs text-blue-600 leading-relaxed">
                {isIOS ? 
                  "Tap the share button in your browser and select 'Add to Home Screen'" :
                  "Click the install button in your browser's address bar"}
              </p>
            </div>
          )}



        <div className="border-t border-gray-100 py-4 px-4 space-y-4">
          <div className="flex flex-row items-center px-2 bg-gray-50 py-2 rounded-lg space-x-2 text-gray-600 px-1 w-full">
            <User size={18} strokeWidth={2} />
            <span className="text-sm font-medium truncate">{user?.email}</span>
          </div>
          <button
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            className="w-full py-2.5 text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <LogOut size={16} strokeWidth={2} />
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