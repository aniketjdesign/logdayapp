import React, { useState } from 'react';
import { Menu, X, Dumbbell, LogOut } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { 
    selectedExercises, 
    currentWorkout, 
    startWorkout, 
    setSelectedExercises,
    setCurrentView 
  } = useWorkout();
  const { signOut } = useAuth();

  const handleStartWorkout = () => {
    startWorkout(selectedExercises);
    navigate('/workout');
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
              <Dumbbell className="h-8 w-8 text-blue-500 ml-3" />
              <span className="ml-2 text-xl font-bold text-gray-900">SSL</span>
            </div>
            {!currentWorkout && selectedExercises.length > 0 && (
              <div className="flex items-center">
                <button
                  onClick={handleStartWorkout}
                  className="inline-flex items-center px-6 py-2 border-2 border-blue-600 text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 hover:border-blue-700 transition-colors"
                >
                  Start Workout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Full-height slide-out menu */}
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
    </>
  );
};