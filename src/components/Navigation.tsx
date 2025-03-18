import React from 'react';
import { Timer, Clipboard, Zap, History, User } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    setSelectedExercises,
    setCurrentView,
    currentWorkout
  } = useWorkout();

  const navigateToHome = () => {
    setSelectedExercises([]);
    setCurrentView('exercises');
    navigate('/quickstart');
  };

  const navigateToWorkout = () => {
    setCurrentView('workout');
    navigate('/workout');
  };

  const navigateToLogs = () => {
    setCurrentView('logs');
    navigate('/logs');
  };

  const navigateToRoutines = () => {
    navigate('/routines');
  };

  const navigateToProfile = () => {
    navigate('/profile');
  };

  return (
    <>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
        <div className="flex justify-around items-start pt-1 h-20">
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
              location.pathname === '/quickstart' || location.pathname === '/' && location.key !== 'default' ? 'text-blue-600' : 'text-gray-600'
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
            onClick={navigateToProfile}
            className={`flex flex-col items-center justify-center flex-1 py-2 ${
              location.pathname === '/profile' || location.pathname === '/settings' || location.pathname === '/contact' 
                ? 'text-blue-600' 
                : 'text-gray-600'
            }`}
          >
            <User size={24} strokeWidth={2} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </>
  );
};