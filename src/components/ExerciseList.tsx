// In ExerciseList.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Exercise } from '../types/exercise';
import { useWorkout } from '../context/WorkoutContext';
import { generateWorkoutName } from '../utils/workoutNameGenerator';
import { OngoingWorkoutMessage } from './OngoingWorkoutMessage';
import { InstallAppToast } from './InstallAppToast';
import { AddExerciseModal } from './AddExerciseModal';
import { exerciseService } from '../services/exerciseService';
import { supabaseService } from '../services/supabaseService';
import { exercises } from '../data/exercises';
import { ExerciseSelector } from './ExerciseSelector';

// This key will be used to store in localStorage if we've shown the loading animation
const LOADING_KEY = 'logday_quickstart_loaded';

export const ExerciseList: React.FC = () => {
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const navigate = useNavigate();
  const { selectedExercises, setSelectedExercises, currentWorkout, startWorkout, setCurrentView } = useWorkout();

  useEffect(() => {
    // Check if this is a page load/refresh or navigation
    // Navigation performance entry type will be "navigate"
    const navigationEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const isPageLoadOrRefresh = navigationEntries.length > 0 && 
      (navigationEntries[0].type === "reload" || navigationEntries[0].type === "navigate");
    
    // Only show loading on actual page load or refresh, not on navigation between pages
    const shouldShowLoading = isPageLoadOrRefresh && !localStorage.getItem(LOADING_KEY);
    setShowSkeleton(shouldShowLoading);
    
    const loadData = async () => {
      try {
        await Promise.all([
          loadCustomExercises(),
          loadRecentExercises()
        ]);
        
        // Store that we've loaded the page
        if (shouldShowLoading) {
          localStorage.setItem(LOADING_KEY, 'true');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Clear localStorage on page unload (refresh)
    const handleBeforeUnload = () => {
      localStorage.removeItem(LOADING_KEY);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const loadCustomExercises = async () => {
    try {
      const exercises = await exerciseService.getUserExercises();
      setCustomExercises(exercises);
    } catch (error) {
      console.error('Failed to load custom exercises:', error);
    }
  };

  const loadRecentExercises = async () => {
    try {
      const exercises = await supabaseService.getRecentExercises();
      setRecentExercises(exercises);
    } catch (error) {
      console.error('Failed to load recent exercises:', error);
    }
  };

  const handleStartWorkout = async () => {
    if (selectedExercises.length > 0 && !currentWorkout) {
      try {
        console.log('Starting workout with exercises:', selectedExercises);
        const workoutName = generateWorkoutName(selectedExercises);
        
        // Navigate first to prevent UI flicker
        navigate('/workout');
        
        // Then create the workout
        const workout = await startWorkout(selectedExercises, workoutName);
        console.log('Workout created:', workout);
      } catch (error) {
        console.error('Error starting workout:', error);
        // If there's an error, navigate back
        navigate('/');
      }
    } else {
      console.log('Cannot start workout:', { 
        selectedExercises: selectedExercises.length, 
        hasCurrentWorkout: !!currentWorkout 
      });
    }
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercises(
      selectedExercises.find(e => e.id === exercise.id)
        ? selectedExercises.filter(e => e.id !== exercise.id)
        : [...selectedExercises, exercise]
    );
  };

  const groupedExercises = useMemo(() => {
    return exercises.reduce((groups, exercise) => {
      const letter = exercise.name[0].toUpperCase();
      return {
        ...groups,
        [letter]: [...(groups[letter] || []), exercise],
      };
    }, {} as { [key: string]: Exercise[] });
  }, []);

  if (isLoading && showSkeleton) {
    return (
      <div className="h-full max-w-3xl mx-auto">
        <div className="px-4 py-0">
          {currentWorkout && <OngoingWorkoutMessage />}
        </div>
        <InstallAppToast />
        
        <div className="px-4">
          <div className="heading-wrapper flex-col gap-y-2 pt-8 pb-3">
            <div className="h-7 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
        
        <div className="px-4 mt-6">
          {/* Simplified skeleton for tabs */}
          <div className="flex space-x-2 mb-4">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          
          {/* Reduced number of skeleton exercise cards */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Simplified skeleton for start workout button */}
        <div className="sticky mx-auto bottom-0 left-0 right-0 flex justify-center px-4 pt-4 pb-24 bg-transparent">
          <div className="h-12 bg-gray-200 rounded-xl w-full max-w-xs animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-w-3xl mx-auto flex flex-col overflow-y-auto">
      <div className="px-4 py-0">
      {currentWorkout && <OngoingWorkoutMessage />}
      </div>
      <InstallAppToast />
     
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex-1 flex flex-col ${currentWorkout ? 'pointer-events-none opacity-50' : ''}`}>
        <motion.div 
          className="px-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}>
          <motion.div 
            className="heading-wrapper flex-col gap-y-2 pt-8 pb-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}>
            <motion.h1 
              className="text-2xl font-semibold tracking-tight text-slate-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}>
              Quick Start
            </motion.h1>
            <motion.p 
              className="text-sm text-gray-500"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}>
              Select your exercises and click Start Workout
            </motion.p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex-1">
          <ExerciseSelector
            customExercises={customExercises}
            recentExercises={recentExercises}
            allExercises={groupedExercises}
            selectedExercises={selectedExercises}
            onExerciseSelect={handleExerciseSelect}
            onAddCustomExercise={() => setIsAddModalOpen(true)}
            currentWorkout={currentWorkout}
          />
        </motion.div>

        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={`sticky mx-auto bottom-0 left-0 right-0 flex justify-center px-4 pt-4 pb-24 bg-transparent ${currentWorkout ? 'opacity-100' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3 }}
            onClick={handleStartWorkout}
            disabled={currentWorkout || selectedExercises.length === 0}
            className={` py-3 px-4 rounded-xl text-white font-medium 
              ${selectedExercises.length === 0 || currentWorkout
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
          >
            Start Workout ({selectedExercises.length} Exercise{selectedExercises.length !== 1 ? 's' : ''})
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {isAddModalOpen && (
            <AddExerciseModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onExerciseAdded={(exercise) => {
                loadCustomExercises();
                setIsAddModalOpen(false);
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};