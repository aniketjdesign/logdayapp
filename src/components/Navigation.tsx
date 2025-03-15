import React, { useState, useEffect, useRef } from 'react';
import { X, LogOut, Bell, User, Share, RefreshCw, Zap, Timer, History, Settings, MessageSquare, Clipboard } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogoutConfirmationModal } from './LogoutConfirmationModal';
import { LogDayLogo } from './LogDayLogo';
import { AnimatePresence, motion } from 'framer-motion';

declare global {
  interface Window {
    Canny: any;
  }
}

export const Navigation: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCannyLoading, setIsCannyLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    setSelectedExercises,
    setCurrentView,
    currentWorkout,
    clearWorkoutState
  } = useWorkout();
  const { user, signOut } = useAuth();
  const { isInstallable, isIOS } = useInstallPrompt();
  const cannyInitialized = useRef(false);

  // Initialize Canny as soon as possible when user is available
  useEffect(() => {
    const initCanny = async () => {
      if (typeof window !== 'undefined' && user?.email && !cannyInitialized.current) {
        // If Canny is not loaded yet, wait for it
        if (!window.Canny) {
          const checkCannyLoaded = () => {
            return new Promise<void>((resolve) => {
              const checkInterval = setInterval(() => {
                if (window.Canny) {
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 100);
              
              // Set a timeout to avoid infinite waiting
              setTimeout(() => {
                clearInterval(checkInterval);
                resolve(); // Resolve anyway after timeout
              }, 5000);
            });
          };
          
          await checkCannyLoaded();
        }
        
        if (window.Canny) {
          cannyInitialized.current = true;

          window.Canny('identify', {
            appID: '672e7aa3fb3f5695ec02ebee',
            user: {
              email: `${user.id}@logday.app`,
              id: user.id,
              name: `User_${user.id.slice(0, 8)}`,
            },
          });

          window.Canny('initChangelog', {
            appID: '672e7aa3fb3f5695ec02ebee',
            position: 'bottom',
            align: 'right',
            theme: 'light'
          });
        }
      }
    };
    
    initCanny();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Force a hard refresh by reloading without cache
    window.location.reload();
  };

  const handleLogoutClick = () => {
    if (currentWorkout) {
      setShowLogoutConfirmation(true);
    } else {
      handleLogout();
    }
    setIsProfileOpen(false);
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
    setIsProfileOpen(false);
    navigate('/');
  };

  const navigateToWorkout = () => {
    setCurrentView('workout');
    setIsProfileOpen(false);
    navigate('/workout');
  };

  const navigateToLogs = () => {
    setCurrentView('logs');
    setIsProfileOpen(false);
    navigate('/logs');
  };

  const navigateToSettings = () => {
    setIsProfileOpen(false);
    navigate('/settings');
  };

  const navigateToRoutines = () => {
    setIsProfileOpen(false);
    navigate('/routines');
  };

  const navigateToContact = () => {
    setIsProfileOpen(false);
    navigate('/contact');
  };

  return (
    <>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
        <div className="flex justify-around items-center h-16">
          {currentWorkout && (
            <button
              onClick={navigateToWorkout}
              className={`flex flex-col items-center justify-center flex-1 py-2 ${
                location.pathname === '/workout' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Timer size={24} strokeWidth={2} />
              <span className="text-xs mt-1">Active</span>
            </button>
          )}
          
          <button
            onClick={navigateToRoutines}
            className={`flex flex-col items-center justify-center flex-1 py-2 ${
              location.pathname === '/routines' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Clipboard size={24} strokeWidth={2} />
            <span className="text-xs mt-1">Routines</span>
          </button>
          
          <button
            onClick={navigateToHome}
            className={`flex flex-col items-center justify-center flex-1 py-2 ${
              location.pathname === '/' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Zap size={24} strokeWidth={2} />
            <span className="text-xs mt-1">Quick Start</span>
          </button>
          
          <button
            onClick={navigateToLogs}
            className={`flex flex-col items-center justify-center flex-1 py-2 ${
              location.pathname === '/logs' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <History size={24} strokeWidth={2} />
            <span className="text-xs mt-1">Logs</span>
          </button>
          
          <button
            onClick={() => setIsProfileOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-2 ${
              isProfileOpen || location.pathname === '/settings' || location.pathname === '/contact' 
                ? 'text-blue-600' 
                : 'text-gray-600'
            }`}
          >
            <User size={24} strokeWidth={2} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>

      {/* Profile Sidebar */}
      <AnimatePresence>
        {isProfileOpen && (
          <>
            <motion.div 
              className="fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
            />
            <motion.div
              className="fixed inset-0 bg-white z-50 flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
                <div className="flex items-center">
                  <span className="font-medium text-lg">Profile</span>
                </div>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg bg-gray-50 text-gray-700"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 py-2">
                <div className="flex flex-row items-center p-4 bg-gray-50 mx-4 mt-4 mb-6 rounded-lg space-x-2 text-gray-600">
                  <User size={18} strokeWidth={2} />
                  <span className="text-sm font-medium truncate">{user?.email}</span>
                </div>
                
                <button
                  onClick={navigateToSettings}
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 border-b-[1.5px] border-gray-100 font-medium text-md flex items-center"
                >
                  <Settings size={18} strokeWidth={2} className="mr-3 text-gray-500" />
                  Settings
                </button>
                <button
                  onClick={navigateToContact}
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 border-b-[1.5px] border-gray-100 font-medium text-md flex items-center"
                >
                  <MessageSquare size={18} className="mr-3 text-gray-500" />
                  <span>Contact</span>
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 border-b-[1.5px] border-gray-100 font-medium text-md flex items-center"
                >
                  <RefreshCw size={18} strokeWidth={2} className={`mr-3 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh App'}</span>
                </button>
                <button
                  onClick={() => {
                    if (!cannyInitialized.current) {
                      setIsCannyLoading(true);
                      if (window.Canny && user?.email) {
                        cannyInitialized.current = true;
                        window.Canny('identify', {
                          appID: '672e7aa3fb3f5695ec02ebee',
                          user: {
                            email: `${user.id}@logday.app`,
                            id: user.id,
                            name: `User_${user.id.slice(0, 8)}`,
                          },
                        });
                        window.Canny('initChangelog', {
                          appID: '672e7aa3fb3f5695ec02ebee',
                          position: 'bottom',
                          align: 'right',
                          theme: 'light',
                          onLoad: () => setIsCannyLoading(false)
                        });
                      } else {
                        setTimeout(() => setIsCannyLoading(false), 3000);
                      }
                    }
                  }}
                  data-canny-changelog
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 border-b-[1.5px] border-gray-100 font-medium text-md flex items-center"
                  disabled={isCannyLoading}
                >
                  <Bell size={18} strokeWidth={2} className="mr-3 text-gray-500" />
                  <span>{isCannyLoading ? 'Loading...' : 'What\'s New'}</span>
                </button>
              </div>

              {isInstallable && (
                <div className="p-3 bg-blue-50 rounded-lg mx-4 mb-4">
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

              <div className="border-t border-gray-100 py-4 px-4 space-y-4 mb-4">
                <button
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut}
                  className="w-full py-2.5 text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <LogOut size={16} strokeWidth={2} />
                  <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
              </div>

              <div className="flex justify-center mb-6">
                <LogDayLogo />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
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