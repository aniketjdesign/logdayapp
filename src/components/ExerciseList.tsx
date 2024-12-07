// In ExerciseList.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="h-full">
      {currentWorkout && <OngoingWorkoutMessage />}
      <InstallAppToast />
      
      <div className="px-4">
        <div className="heading-wrapper flex-col gap-y-2 pt-6 pb-4">
          <h1 className="text-lg font-bold">Quick Start</h1>
          <p className="text-sm text-gray-500">Select your exercises and click Start Workout</p>
        </div>
      </div>

      <ExerciseSelector
        customExercises={customExercises}
        recentExercises={recentExercises}
        allExercises={groupedExercises}
        selectedExercises={selectedExercises}
        onExerciseSelect={handleExerciseSelect}
        onAddCustomExercise={() => setIsAddModalOpen(true)}
        currentWorkout={currentWorkout}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={(e) => {
            console.log('Button clicked', { selectedExercises, currentWorkout }); // Debug log
            handleStartWorkout();
          }}
          disabled={selectedExercises.length === 0 || !!currentWorkout}
          className={`w-full py-3 px-4 rounded-lg font-medium text-sm
            ${selectedExercises.length === 0 || currentWorkout
              ? 'bg-gray-100 text-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          Start Workout ({selectedExercises.length} Exercise{selectedExercises.length !== 1 ? 's' : ''})
        </button>
      </div>

      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onExerciseAdded={(exercise) => {
          loadCustomExercises();
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
};