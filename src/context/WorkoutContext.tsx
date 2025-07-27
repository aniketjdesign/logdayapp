import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Exercise, WorkoutLog, WorkoutExercise, Folder, Routine } from '../types/workout';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from './AuthContext';
import { calculateWorkoutStats } from '../utils/workoutStats';
import { generateUUID } from '../utils/uuid';
import { Analytics } from '../services/analytics';
import { exerciseService } from '../services/exerciseService';
import { generateWorkoutName } from '../utils/workoutNameGenerator';

type View = 'exercises' | 'workout' | 'logs';

interface WorkoutContextType {
  selectedExercises: Exercise[];
  currentWorkout: WorkoutLog | null;
  workoutLogs: WorkoutLog[];
  currentView: View;
  customExercises: Exercise[];
  folders: Folder[];
  routines: Routine[];
  setSelectedExercises: (exercises: Exercise[]) => void;
  setCurrentWorkout: (workout: WorkoutLog | null) => void;
  startWorkout: (exercises: Exercise[], name?: string, existingExercises?: WorkoutExercise[]) => Promise<WorkoutLog>;
  completeWorkout: (name: string) => Promise<WorkoutLog>;
  updateWorkoutExercise: (exerciseId: string, data: WorkoutExercise) => void;
  reorderWorkoutExercises: (reorderedExercises: WorkoutExercise[]) => void;
  addExercisesToWorkout: (exercises: Exercise[]) => void;
  addCustomExercise: (exercise: Exercise) => void;
  deleteExercise: (exerciseId: string) => void;
  deleteLog: (logId: string) => void;
  setCurrentView: (view: View) => void;
  searchLogs: (query: string) => Promise<void>;
  clearWorkoutState: () => void;
  addFolder: (folder: { name: string }) => Promise<void>;
  updateFolder: (id: string, updates: { name: string }) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  addRoutine: (routine: Routine) => Promise<void>;
  updateRoutine: (id: string, updates: Partial<Routine>) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  moveRoutine: (routineId: string, newFolderId: string | null) => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const STORAGE_PREFIX = 'logday_';
const CURRENT_WORKOUT_KEY = `${STORAGE_PREFIX}currentWorkout`;
const WORKOUT_TIMER_KEY = `${STORAGE_PREFIX}workoutTimer`;
const LAST_ROUTE_KEY = `${STORAGE_PREFIX}lastRoute`;

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutLog | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [currentView, setCurrentView] = useState<View>('exercises');
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
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
        const response = await supabaseService.getWorkoutLogs();
        if (!response.error) {
          setWorkoutLogs(response.data);
        }
      }
    };
    loadWorkouts();
  }, [user]);

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

  // Fetch folders when user changes
  useEffect(() => {
    if (user) {
      fetchFolders();
    } else {
      setFolders([]);
    }
  }, [user]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabaseService.getFolders();
      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  // Fetch routines when user changes
  useEffect(() => {
    if (user) {
      fetchRoutines();
    } else {
      setRoutines([]);
    }
  }, [user]);

  const fetchRoutines = async () => {
    try {
      const { data, error } = await supabaseService.getRoutines();
      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
    }
  };

  useEffect(() => {
    // When workout exists, save the route
    if (currentWorkout) {
      localStorage.setItem(LAST_ROUTE_KEY, '/workout');
    } else {
      localStorage.removeItem(LAST_ROUTE_KEY);
    }
  }, [currentWorkout]);

  const startWorkout = async (exercises: Exercise[], name: string = '', existingExercises?: WorkoutExercise[]) => {
    let workoutExercises;
    
    console.log('Starting workout with name param:', name);
    
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

    const workoutName = name.trim() || generateWorkoutName(exercises);
    console.log('Final workout name:', workoutName);

    const workout: WorkoutLog = {
      id: generateUUID(),
      name: workoutName,
      exercises: workoutExercises,
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0,
      workoutRestTimer: true,
      workoutRestTimerOverride: false
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
      const response = await supabaseService.saveWorkoutLog(completedWorkout);
      if (response.error) throw response.error;

      // Clear current workout state immediately after successful save
      localStorage.removeItem(CURRENT_WORKOUT_KEY);
      localStorage.removeItem(WORKOUT_TIMER_KEY);
      setCurrentWorkout(null);

      // Refresh the logs
      const logsResponse = await supabaseService.getWorkoutLogs();
      if (!logsResponse.error) {
        setWorkoutLogs(logsResponse.data);
      }

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

  const reorderWorkoutExercises = (reorderedExercises: WorkoutExercise[]) => {
    if (!currentWorkout) return;
    setCurrentWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: reorderedExercises
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
      
      // Find the exercise to be deleted and its superset partner if any
      const exerciseToDelete = prev.exercises.find(ex => ex.exercise.id === exerciseId);
      const supersetPartnerId = exerciseToDelete?.supersetWith;
      
      // Remove the exercise and clean up superset relationships
      const updatedExercises = prev.exercises
        .filter(ex => ex.exercise.id !== exerciseId)
        .map(ex => {
          // If this exercise was supersetted with the deleted exercise, remove the superset reference
          if (supersetPartnerId && ex.exercise.id === supersetPartnerId) {
            const { supersetWith, ...rest } = ex;
            return rest as WorkoutExercise;
          }
          return ex;
        });
      
      return {
        ...prev,
        exercises: updatedExercises
      };
    });
  };

  const deleteLog = async (logId: string) => {
    try {
      const response = await supabaseService.deleteWorkoutLog(logId);
      if (response.error) throw response.error;

      // Refresh the logs
      const logsResponse = await supabaseService.getWorkoutLogs();
      if (!logsResponse.error) {
        setWorkoutLogs(logsResponse.data);
      }
    } catch (error) {
      console.error('Error deleting workout log:', error);
      throw error;
    }
  };

  const searchLogs = async (query: string) => {
    if (user) {
      const response = await supabaseService.searchWorkoutLogs(query);
      if (!response.error) {
        setWorkoutLogs(response.data);
      }
    }
  };

  const clearWorkoutState = () => {
    setCurrentWorkout(null);
    setSelectedExercises([]);
    localStorage.removeItem(CURRENT_WORKOUT_KEY);
    localStorage.removeItem(WORKOUT_TIMER_KEY);
  };

  const addFolder = async (folder: { name: string }) => {
    try {
      const { error } = await supabaseService.addFolder({
        name: folder.name,
        user_id: user?.id || '',
      });
      if (error) throw error;
      await fetchFolders();
    } catch (error) {
      console.error('Error adding folder:', error);
      throw error;
    }
  };

  const updateFolder = async (id: string, updates: { name: string }) => {
    try {
      const { error } = await supabaseService.updateFolder(id, updates);
      if (error) throw error;
      await fetchFolders();
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      const { error } = await supabaseService.deleteFolder(id);
      if (error) throw error;
      await fetchFolders();
      await fetchRoutines();
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  };

  const addRoutine = async (routine: Routine) => {
    try {
      const routineData: Omit<Routine, 'id' | 'created_at' | 'updated_at'> = {
        name: routine.name,
        description: routine.description,
        exercises: routine.exercises,
        folder_id: routine.folder_id,
        total_exercises: routine.exercises.length,
        total_sets: routine.exercises.reduce((total: number, ex: any) => total + ex.sets.length, 0),
      };

      const { error } = await supabaseService.addRoutine(routineData);
      if (error) throw error;
      await fetchRoutines();
    } catch (error) {
      console.error('Error adding routine:', error);
      throw error;
    }
  };

  const updateRoutine = async (id: string, updates: Partial<Routine>) => {
    try {
      const routineData: Partial<Omit<Routine, 'id' | 'user_id' | 'created_at' | 'updated_at'>> = {
        name: updates.name,
        description: updates.description,
        exercises: updates.exercises,
        folder_id: updates.folder_id,
        total_exercises: updates.exercises.length,
        total_sets: updates.exercises.reduce((total: number, ex: any) => total + ex.sets.length, 0),
      };

      const { error } = await supabaseService.updateRoutine(id, routineData);
      if (error) throw error;
      await fetchRoutines();
    } catch (error) {
      console.error('Error updating routine:', error);
      throw error;
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      const { error } = await supabaseService.deleteRoutine(id);
      if (error) throw error;
      await fetchRoutines();
    } catch (error) {
      console.error('Error deleting routine:', error);
      throw error;
    }
  };

  const moveRoutine = async (routineId: string, newFolderId: string | null) => {
    try {
      const { error } = await supabaseService.moveRoutine(routineId, newFolderId);
      if (error) throw error;

      // Update local state
      setRoutines(prev => prev.map(routine => 
        routine.id === routineId 
          ? { ...routine, folder_id: newFolderId }
          : routine
      ));
    } catch (error) {
      console.error('Error moving routine:', error);
      throw error;
    }
  };

  const contextValue = useMemo(() => ({
    selectedExercises,
    currentWorkout,
    workoutLogs,
    currentView,
    customExercises,
    folders,
    routines,
    setSelectedExercises,
    setCurrentWorkout,
    startWorkout,
    completeWorkout,
    updateWorkoutExercise,
    reorderWorkoutExercises,
    addExercisesToWorkout,
    addCustomExercise,
    deleteExercise,
    deleteLog,
    setCurrentView,
    searchLogs,
    clearWorkoutState,
    addFolder,
    updateFolder,
    deleteFolder,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    moveRoutine,
  }), [
    selectedExercises,
    currentWorkout,
    workoutLogs,
    currentView,
    customExercises,
    folders,
    routines,
    setSelectedExercises,
    setCurrentWorkout,
    startWorkout,
    completeWorkout,
    updateWorkoutExercise,
    reorderWorkoutExercises,
    addExercisesToWorkout,
    addCustomExercise,
    deleteExercise,
    deleteLog,
    setCurrentView,
    searchLogs,
    clearWorkoutState,
    addFolder,
    updateFolder,
    deleteFolder,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    moveRoutine,
  ]);

  return (
    <WorkoutContext.Provider value={contextValue}>
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