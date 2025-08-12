import React from 'react';
import { 
  Timer, 
  Notebook, 
  Lightning, 
  CalendarCheck, 
  UserCircle
} from 'phosphor-react';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

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

  const isActive = (path: string | string[]): boolean => {
    if (Array.isArray(path)) {
      return path.some(p => location.pathname === p);
    }
    if (path === '/quickstart') {
      return location.pathname === '/quickstart' || (location.pathname === '/' && location.key !== 'default');
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:left-1/2 md:transform md:mb-4 md:border md:border-gray-200 md:rounded-2xl md:h-20 md:-translate-x-1/2 md:max-w-2xl bg-white border-t border-gray-200 z-40 safe-bottom">
        <div className="flex justify-around items-start pt-0 h-24">
          {currentWorkout && (
            <motion.button
              onClick={navigateToWorkout}
              className={`flex flex-col items-center justify-center flex-1 py-4 relative ${
                isActive('/workout') ? 'text-blue-600' : 'text-gray-600'
              }`}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {isActive('/workout') ? (
                <>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-blue-600 rounded-b-md"></div>
                  <Timer size={24} weight="fill" />
                </>
              ) : (
                <Timer size={24} weight="duotone" />
              )}
              <span className="text-xs mt-1">Active</span>
            </motion.button>
          )}
          
          <motion.button
            onClick={navigateToRoutines}
            className={`flex flex-col items-center justify-center flex-1 py-4 relative ${
              isActive('/routines') ? 'text-blue-600' : 'text-gray-600'
            }`}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {isActive('/routines') ? (
              <>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-blue-600 rounded-b-md"></div>
                <Notebook size={24} weight="fill" />
              </>
            ) : (
              <Notebook size={24} weight="duotone" />
            )}
            <span className="text-xs mt-1">Routines</span>
          </motion.button>
          
          <motion.button
            onClick={navigateToHome}
            className={`flex flex-col items-center justify-center flex-1 py-4 relative ${
              isActive('/quickstart') ? 'text-blue-600' : 'text-gray-600'
            }`}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {isActive('/quickstart') ? (
              <>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-blue-600 rounded-b-md"></div>
                <Lightning size={24} weight="fill" />
              </>
            ) : (
              <Lightning size={24} weight="duotone" />
            )}
            <span className="text-xs mt-1">Quick Start</span>
          </motion.button>
          
          <motion.button
            onClick={navigateToLogs}
            className={`flex flex-col items-center justify-center flex-1 py-4 relative ${
              isActive('/logs') ? 'text-blue-600' : 'text-gray-600'
            }`}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {isActive('/logs') ? (
              <>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-blue-600 rounded-b-md"></div>
                <CalendarCheck size={24} weight="fill" />
              </>
            ) : (
              <CalendarCheck size={24} weight="duotone" />
            )}
            <span className="text-xs mt-1">Logs</span>
          </motion.button>
          
          <motion.button
            onClick={navigateToProfile}
            className={`flex flex-col items-center justify-center flex-1 py-4 relative ${
              isActive(['/profile', '/settings', '/contact']) ? 'text-blue-600' : 'text-gray-600'
            }`}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {isActive(['/profile', '/settings', '/contact']) ? (
              <>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-blue-600 rounded-b-md"></div>
                <UserCircle size={24} weight="fill" />
              </>
            ) : (
              <UserCircle size={24} weight="duotone" />
            )}
            <span className="text-xs mt-1">Profile</span>
          </motion.button>
        </div>
      </div>
    </>
  );
};