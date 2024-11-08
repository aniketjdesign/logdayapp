import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChangelogModal } from './ChangelogModal';
import { LogDayLogo } from './LogDayLogo';

const CHANGELOG_VIEWED_KEY = 'changelog_viewed';

export const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const navigate = useNavigate();
  const { 
    setSelectedExercises,
    setCurrentView 
  } = useWorkout();
  const { signOut } = useAuth();

  useEffect(() => {
    const hasViewedChangelog = localStorage.getItem(CHANGELOG_VIEWED_KEY);
    if (!hasViewedChangelog) {
      setShowChangelog(true);
    }
  }, []);

  const handleCloseChangelog = () => {
    setShowChangelog(false);
    localStorage.setItem(CHANGELOG_VIEWED_KEY, 'true');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
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

  return (
    <>
      <nav className="bg-white shadow-md relative z-50">
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
              <span className="ml-2 text-xl font-bold text-gray-900">LogDay</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowChangelog(true)}
                className="p-2 rounded-md hover:bg-gray-100"
                title="What's New"
              >
                <Bell size={24} className="text-gray-600" />
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
        className={`fixed top-0 left-0 h-full w-64 bg-white transform transition-transform duration-300 ease-in-out z-50 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-end px-4 border-b">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
        <div className="py-4">
          <button
            onClick={navigateToHome}
            className="w-full px-6 py-3 text-left text-gray-700 hover:bg-gray-100 font-medium"
          >
            Select Exercises
          </button>
          <button
            onClick={navigateToWorkout}
            className="w-full px-6 py-3 text-left text-gray-700 hover:bg-gray-100 font-medium"
          >
            Current Workout
          </button>
          <button
            onClick={navigateToLogs}
            className="w-full px-6 py-3 text-left text-gray-700 hover:bg-gray-100 font-medium"
          >
            Workout Logs
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-6 py-3 text-left text-red-600 hover:bg-red-50 font-medium flex items-center"
          >
            <LogOut size={20} className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      <ChangelogModal isOpen={showChangelog} onClose={handleCloseChangelog} />
    </>
  );
};