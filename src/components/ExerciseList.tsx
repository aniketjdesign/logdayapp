// In ExerciseList.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

export const ExerciseList: React.FC = () => {
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();
  const { selectedExercises, setSelectedExercises, currentWorkout, startWorkout, setCurrentView } = useWorkout();

  useEffect(() => {
    loadCustomExercises();
    loadRecentExercises();
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

  return (
    <div className="h-full max-w-3xl mx-auto">
      <div className="px-4 py-0">
      {currentWorkout && <OngoingWorkoutMessage />}
      </div>
      <InstallAppToast />
     
      <motion.div 
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`${currentWorkout ? 'pointer-events-none opacity-50' : ''}`}>
      <motion.div 
        className="px-4"
        initial={{ y: 10, opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.05 }}>
        <motion.div 
          className="heading-wrapper flex-col gap-y-2 pt-4 pb-3"
          initial={{ y: 5, opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}>
          <motion.h1 
            className="text-lg font-bold"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.12 }}>
            Quick Start
          </motion.h1>
          <motion.p 
            className="text-sm text-gray-500"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}>
            Select your exercises and click Start Workout
          </motion.p>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.2 }}>
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
        initial={{ y: 20, opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.25 }}
        className={`fixed max-w-3xl mx-auto bottom-0 left-0 right-0 px-4 pt-4 pb-8 bg-white border-t ${currentWorkout ? 'opacity-100' : ''}`}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartWorkout}
          disabled={currentWorkout || selectedExercises.length === 0}
          className={`w-full py-3 px-4 rounded-xl text-white font-medium 
            ${selectedExercises.length === 0 || currentWorkout
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
        >
          Start Workout ({selectedExercises.length} Exercise{selectedExercises.length !== 1 ? 's' : ''})
        </motion.button>
      </motion.div>

      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onExerciseAdded={(exercise) => {
          loadCustomExercises();
          setIsAddModalOpen(false);
        }}
      />
      </motion.div>
    </div>
  );
};