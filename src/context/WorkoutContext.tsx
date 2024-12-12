import React, { createContext, useContext, useState, useEffect } from 'react';
import { Exercise, WorkoutLog, WorkoutExercise } from '../types/workout';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from './AuthContext';
import { calculateWorkoutStats } from '../utils/workoutStats';
import { generateUUID } from '../utils/uuid';
import { Analytics } from '../services/analytics';
import { exerciseService } from '../services/exerciseService';

type View = 'exercises' | 'workout' | 'logs';

interface WorkoutContextType {
  selectedExercises: Exercise[];
  currentWorkout: WorkoutLog | null;
  workoutLogs: WorkoutLog[];
  totalLogs: number;
  currentPage: number;
  currentView: View;
  customExercises: Exercise[];
  setSelectedExercises: (exercises: Exercise[]) => void;
  setCurrentWorkout: (workout: WorkoutLog | null) => void;
  startWorkout: (exercises: Exercise[], name?: string, existingExercises?: WorkoutExercise[]) => Promise<WorkoutLog>;
  completeWorkout: (name: string) => Promise<WorkoutLog>;
  updateWorkoutExercise: (exerciseId: string, data: WorkoutExercise) => void;
  addExercisesToWorkout: (exercises: Exercise[]) => void;
  addCustomExercise: (exercise: Exercise) => void;
  deleteExercise: (exerciseId: string) => void;
  deleteLog: (logId: string) => void;
  setCurrentView: (view: View) => void;
  searchLogs: (query: string) => Promise<void>;
  clearWorkoutState: () => void;
  setCurrentPage: (page: number) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const STORAGE_PREFIX = 'logday_';
const CURRENT_WORKOUT_KEY = `${STORAGE_PREFIX}currentWorkout`;
const WORKOUT_TIMER_KEY = `${STORAGE_PREFIX}workoutTimer`;

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutLog | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentView, setCurrentView] = useState<View>('exercises');
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const { user } = useAuth();

  // Load current workout from localStorage
  useEffect(() => {
    try {
      const savedWorkout = localStorage.getItem(CURRENT_WORKOUT_KEY);
      if (savedWorkout) {
        setCurrentWorkout(JSON.parse(savedWorkout));
      }
    } catch (error) {
      console.error('Error loading persisted state:', error);
    }
  }, []);

  // Save current workout to localStorage
  useEffect(() => {
    if (currentWorkout) {
      localStorage.setItem(CURRENT_WORKOUT_KEY, JSON.stringify(currentWorkout));
    }
  }, [currentWorkout]);

  // Load workout logs from Supabase
  useEffect(() => {
    const loadWorkouts = async () => {
      if (user) {
        const { data, count, error } = await supabaseService.getWorkoutLogs(currentPage);
        if (!error) {
          setWorkoutLogs(data);
          setTotalLogs(count);
        }
      }
    };
    loadWorkouts();
  }, [user, currentPage]);

  // Load custom exercises
  useEffect(() => {
    const loadCustomExercises = async () => {
      if (user) {
        try {
          const exercises = await exerciseService.getUserExercises();
          setCustomExercises(exercises);
        } catch (error) {
          console.error('Failed to load custom exercises:', error);
        }
      }
    };
    loadCustomExercises();
  }, [user]);

  const startWorkout = async (exercises: Exercise[], name: string = '', existingExercises?: WorkoutExercise[]) => {
    let workoutExercises;
    
    if (existingExercises) {
      workoutExercises = existingExercises;
    } else {
      workoutExercises = exercises.map(exercise => ({
        exercise,
        sets: [{ 
          id: generateUUID(), 
          setNumber: 1, 
          targetReps: 0, 
          performedReps: '', 
          weight: 0, 
          comments: '', 
          isPR: false,
          isWarmup: false,
          isDropset: false,
          isFailure: false
        }]
      }));
    }

    const workout: WorkoutLog = {
      id: generateUUID(),
      name,
      exercises: workoutExercises,
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0
    };
    
    // Initialize timer state with auto-start (not paused)
    const timerState = {
      accumulated: 0,
      lastTick: Date.now(),
      isPaused: false
    };
    localStorage.setItem(WORKOUT_TIMER_KEY, JSON.stringify(timerState));
    localStorage.setItem(CURRENT_WORKOUT_KEY, JSON.stringify(workout));
    
    // Update all states in the correct order and wait for them to complete
    await Promise.all([
      new Promise<void>(resolve => {
        setCurrentWorkout(workout);
        resolve();
      }),
      new Promise<void>(resolve => {
        setSelectedExercises([]);
        resolve();
      }),
      new Promise<void>(resolve => {
        setCurrentView('workout');
        resolve();
      })
    ]);
    
    Analytics.workoutStarted({
      exercises: exercises.length,
      name: name
    });

    return workout;
  };

  const completeWorkout = async (name: string): Promise<WorkoutLog> => {
    if (!currentWorkout) {
      throw new Error('No active workout to complete');
    }

    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(currentWorkout.startTime).getTime();
    
    const completedWorkout: WorkoutLog = {
      ...currentWorkout,
      name,
      endTime,
      duration
    };

    try {
      const stats = calculateWorkoutStats(completedWorkout);
      Analytics.workoutCompleted({
        duration: completedWorkout.duration,
        exercises: completedWorkout.exercises.length,
        sets: stats.totalSets,
        volume: stats.totalVolume,
        prs: stats.totalPRs
      });
    } catch (error) {
      console.error('Error calculating workout stats:', error);
      // Continue with saving even if stats calculation fails
    }

    try {
      const { error } = await supabaseService.saveWorkoutLog(completedWorkout);
      if (error) throw error;

      // Clear current workout state immediately after successful save
      localStorage.removeItem(CURRENT_WORKOUT_KEY);
      localStorage.removeItem(WORKOUT_TIMER_KEY);
      setCurrentWorkout(null);

      // Refresh the logs
      const { data, count } = await supabaseService.getWorkoutLogs(1);
      setWorkoutLogs(data);
      setTotalLogs(count);
      setCurrentPage(1);

      return completedWorkout;
    } catch (error) {
      console.error('Error saving workout:', error);
      throw error;
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
    exercises.forEach(exercise => {
      Analytics.exerciseAdded({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup
      });
    });
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const newExercises = exercises.map(exercise => ({
        exercise,
        sets: [{ 
          id: generateUUID(),
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

  const addCustomExercise = (exercise: Exercise) => {
    setCustomExercises(prev => [exercise, ...prev]);
  };

  const deleteExercise = (exerciseId: string) => {
    if (!currentWorkout) return;
    const exercise = currentWorkout.exercises.find(ex => ex.exercise.id === exerciseId);
    if (exercise) {
      Analytics.exerciseRemoved({
        exerciseId: exercise.exercise.id,
        exerciseName: exercise.exercise.name,
        muscleGroup: exercise.exercise.muscleGroup
      });
    }
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
      const { error } = await supabaseService.deleteWorkoutLog(logId);
      if (error) throw error;

      // Refresh the logs
      const { data, count } = await supabaseService.getWorkoutLogs(currentPage);
      setWorkoutLogs(data);
      setTotalLogs(count);
    } catch (error) {
      console.error('Error deleting workout log:', error);
      throw error;
    }
  };

  const searchLogs = async (query: string) => {
    try {
      const { data, count } = await supabaseService.searchWorkoutLogs(query, currentPage);
      setWorkoutLogs(data);
      setTotalLogs(count);
    } catch (error) {
      console.error('Error searching workout logs:', error);
    }
  };

  const clearWorkoutState = () => {
    setCurrentWorkout(null);
    setSelectedExercises([]);
    localStorage.removeItem(CURRENT_WORKOUT_KEY);
    localStorage.removeItem(WORKOUT_TIMER_KEY);
  };

  return (
    <WorkoutContext.Provider value={{
      selectedExercises,
      currentWorkout,
      workoutLogs,
      totalLogs,
      currentPage,
      currentView,
      customExercises,
      setSelectedExercises,
      setCurrentWorkout,
      startWorkout,
      completeWorkout,
      updateWorkoutExercise,
      addExercisesToWorkout,
      addCustomExercise,
      deleteExercise,
      deleteLog,
      setCurrentView,
      searchLogs,
      clearWorkoutState,
      setCurrentPage
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