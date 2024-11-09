import React, { createContext, useContext, useState, useEffect } from 'react';
import { Exercise, WorkoutLog, WorkoutExercise } from '../types/workout';
import { saveWorkout, getWorkouts, searchWorkouts, deleteWorkoutLog } from '../db/database';
import { useLocation } from 'react-router-dom';

type View = 'exercises' | 'workout' | 'logs';

interface WorkoutContextType {
  selectedExercises: Exercise[];
  currentWorkout: WorkoutLog | null;
  workoutLogs: WorkoutLog[];
  currentView: View;
  setSelectedExercises: (exercises: Exercise[]) => void;
  setCurrentWorkout: (workout: WorkoutLog | null) => void;
  startWorkout: (exercises: Exercise[], name?: string) => void;
  completeWorkout: (name: string) => Promise<void>;
  updateWorkoutExercise: (exerciseId: string, data: WorkoutExercise) => void;
  addExercisesToWorkout: (exercises: Exercise[]) => void;
  deleteExercise: (exerciseId: string) => void;
  deleteLog: (logId: string) => void;
  setCurrentView: (view: View) => void;
  searchLogs: (query: string) => void;
  clearWorkoutState: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const STORAGE_PREFIX = 'logday_';
const CURRENT_WORKOUT_KEY = `${STORAGE_PREFIX}currentWorkout`;
const SELECTED_EXERCISES_KEY = `${STORAGE_PREFIX}selectedExercises`;

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutLog | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [currentView, setCurrentView] = useState<View>('exercises');
  const location = useLocation();

  useEffect(() => {
    try {
      const savedWorkout = localStorage.getItem(CURRENT_WORKOUT_KEY);
      const savedExercises = localStorage.getItem(SELECTED_EXERCISES_KEY);

      if (savedWorkout) {
        setCurrentWorkout(JSON.parse(savedWorkout));
      }
      if (savedExercises) {
        setSelectedExercises(JSON.parse(savedExercises));
      }
    } catch (error) {
      console.error('Error loading persisted state:', error);
    }
  }, []);

  useEffect(() => {
    if (currentWorkout) {
      localStorage.setItem(CURRENT_WORKOUT_KEY, JSON.stringify(currentWorkout));
    }
  }, [currentWorkout]);

  useEffect(() => {
    if (selectedExercises.length > 0) {
      localStorage.setItem(SELECTED_EXERCISES_KEY, JSON.stringify(selectedExercises));
    }
  }, [selectedExercises]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentWorkout) {
        window.onbeforeunload = (e) => {
          e.preventDefault();
          e.returnValue = '';
          return '';
        };
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.onbeforeunload = null;
    };
  }, [currentWorkout]);

  useEffect(() => {
    const loadWorkouts = async () => {
      const logs = await getWorkouts();
      setWorkoutLogs(logs);
    };
    loadWorkouts();
  }, []);

  const startWorkout = (exercises: Exercise[], name: string = '') => {
    const workout: WorkoutLog = {
      id: Date.now().toString(),
      name,
      exercises: exercises.map(exercise => ({
        exercise,
        sets: [{ 
          id: '1', 
          setNumber: 1, 
          targetReps: 0, 
          performedReps: '', 
          weight: 0, 
          comments: '', 
          isPR: false 
        }]
      })),
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0
    };
    setCurrentWorkout(workout);
    setCurrentView('workout');
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
      clearWorkoutState();
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

  const addExercisesToWorkout = (exercises: Exercise[]) => {
    if (!currentWorkout) return;
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const newExercises = exercises.map(exercise => ({
        exercise,
        sets: [{ 
          id: Date.now().toString(), 
          setNumber: 1, 
          targetReps: 0, 
          performedReps: '', 
          weight: 0, 
          comments: '', 
          isPR: false 
        }]
      }));
      return {
        ...prev,
        exercises: [...prev.exercises, ...newExercises]
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

  const deleteLog = async (logId: string) => {
    try {
      await deleteWorkoutLog(logId);
      setWorkoutLogs(prev => prev.filter(log => log.id !== logId));
    } catch (error) {
      console.error('Error deleting workout log:', error);
    }
  };

  const searchLogs = async (query: string) => {
    const results = await searchWorkouts(query);
    setWorkoutLogs(results);
  };

  const clearWorkoutState = () => {
    setCurrentWorkout(null);
    setSelectedExercises([]);
    localStorage.removeItem(CURRENT_WORKOUT_KEY);
    localStorage.removeItem(SELECTED_EXERCISES_KEY);
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
      deleteLog,
      setCurrentView,
      searchLogs,
      clearWorkoutState
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