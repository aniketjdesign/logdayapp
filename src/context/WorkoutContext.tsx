import React, { createContext, useContext, useState, useEffect } from 'react';
import { Exercise, WorkoutLog, WorkoutExercise } from '../types/workout';
import { saveWorkout, getWorkouts, searchWorkouts } from '../db/database';

type View = 'exercises' | 'workout' | 'logs';

interface WorkoutContextType {
  selectedExercises: Exercise[];
  currentWorkout: WorkoutLog | null;
  workoutLogs: WorkoutLog[];
  currentView: View;
  setSelectedExercises: (exercises: Exercise[]) => void;
  setCurrentWorkout: (workout: WorkoutLog | null) => void;
  startWorkout: (exercises: Exercise[]) => void;
  completeWorkout: (name: string) => void;
  updateWorkoutExercise: (exerciseId: string, data: WorkoutExercise) => void;
  addExercisesToWorkout: (exercises: Exercise[]) => void;
  deleteExercise: (exerciseId: string) => void;
  setCurrentView: (view: View) => void;
  searchLogs: (query: string) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutLog | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [currentView, setCurrentView] = useState<View>('exercises');

  useEffect(() => {
    const loadWorkouts = async () => {
      const logs = await getWorkouts();
      setWorkoutLogs(logs);
    };
    loadWorkouts();
  }, []);

  const startWorkout = (exercises: Exercise[]) => {
    const workout: WorkoutLog = {
      id: Date.now().toString(),
      name: '',
      exercises: exercises.map(exercise => ({
        exercise,
        sets: [{ id: '1', setNumber: 1, targetReps: 0, performedReps: '', weight: 0, comments: '', isPR: false }]
      })),
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0
    };
    setCurrentWorkout(workout);
    setCurrentView('workout');
  };

  const addExercisesToWorkout = (exercises: Exercise[]) => {
    if (!currentWorkout) return;

    setCurrentWorkout(prev => {
      if (!prev) return null;

      const newExercises = exercises.map(exercise => ({
        exercise,
        sets: [{ id: Date.now().toString(), setNumber: 1, targetReps: 0, performedReps: '', weight: 0, comments: '', isPR: false }]
      }));

      return {
        ...prev,
        exercises: [...prev.exercises, ...newExercises]
      };
    });
  };

  const completeWorkout = async (name: string) => {
    if (currentWorkout) {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(currentWorkout.startTime).getTime();
      const completedWorkout = {
        ...currentWorkout,
        name,
        endTime,
        duration
      };
      await saveWorkout(completedWorkout);
      setWorkoutLogs(prev => [completedWorkout, ...prev]);
      setCurrentWorkout(null);
      setSelectedExercises([]);
      setCurrentView('logs');
    }
  };

  const updateWorkoutExercise = (exerciseId: string, data: WorkoutExercise) => {
    if (!currentWorkout) return;

    setCurrentWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => 
          ex.exercise.id === exerciseId ? data : ex
        )
      };
    });
  };

  const deleteExercise = (exerciseId: string) => {
    if (!currentWorkout) return;
    
    setCurrentWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.filter(ex => ex.exercise.id !== exerciseId)
      };
    });
  };

  const searchLogs = async (query: string) => {
    const results = await searchWorkouts(query);
    setWorkoutLogs(results);
  };

  return (
    <WorkoutContext.Provider value={{
      selectedExercises,
      currentWorkout,
      workoutLogs,
      currentView,
      setSelectedExercises,
      setCurrentWorkout,
      startWorkout,
      completeWorkout,
      updateWorkoutExercise,
      addExercisesToWorkout,
      deleteExercise,
      setCurrentView,
      searchLogs
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};