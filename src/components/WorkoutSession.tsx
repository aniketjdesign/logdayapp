import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { WorkoutReview } from './WorkoutReview';
import { MobileWorkoutView } from './MobileWorkoutView';
import { Exercise, WorkoutLog } from '../types/workout';

const STORAGE_PREFIX = 'logday_';
const WORKOUT_TIMER_KEY = `${STORAGE_PREFIX}workoutTimer`;

export const WorkoutSession: React.FC = () => {
  const { 
    currentWorkout, 
    updateWorkoutExercise, 
    workoutLogs,
    completeWorkout,
    deleteExercise,
    addExercisesToWorkout,
    setCurrentWorkout,
    clearWorkoutState 
  } = useWorkout();
  const { defaultHomePage } = useSettings();
  const [workoutName, setWorkoutName] = useState(currentWorkout?.name || '');
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [completedWorkout, setCompletedWorkout] = useState<WorkoutLog | null>(null);
  const [isCompletingWorkout, setIsCompletingWorkout] = useState(false);
  const navigate = useNavigate();
  const lastTickRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  const getExerciseHistory = () => {
    const history: { [key: string]: WorkoutLog[] } = {};
    
    workoutLogs.forEach(log => {
      log.exercises.forEach(ex => {
        if (!history[ex.exercise.id]) {
          history[ex.exercise.id] = [];
        }
        if (ex.sets.length > 0) {
          history[ex.exercise.id].push(log);
        }
      });
    });
    
    Object.keys(history).forEach(exerciseId => {
      history[exerciseId].sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    });
    
    return history;
  };

  useEffect(() => {
    if (!currentWorkout?.startTime || isInitializedRef.current) return;

    const savedTimer = localStorage.getItem(WORKOUT_TIMER_KEY);
    if (savedTimer) {
      try {
        const { accumulated, lastTick, isPaused: savedPauseState } = JSON.parse(savedTimer);
        accumulatedTimeRef.current = accumulated || 0;
        
        if (typeof savedPauseState === 'boolean') {
          setIsPaused(savedPauseState);
        } else {
          setIsPaused(false);
        }
        
        if (!savedPauseState && lastTick) {
          const now = Date.now();
          const timeElapsed = now - lastTick;
          accumulatedTimeRef.current += timeElapsed;
        }
        
        lastTickRef.current = Date.now();
        setDuration(Math.floor(accumulatedTimeRef.current / 1000));
      } catch (error) {
        console.error('Error parsing timer state:', error);
      }
    } else {
      setIsPaused(false);
      const timeElapsed = Date.now() - new Date(currentWorkout.startTime).getTime();
      accumulatedTimeRef.current = timeElapsed;
      lastTickRef.current = Date.now();
      setDuration(Math.floor(timeElapsed / 1000));
    }

    isInitializedRef.current = true;
  }, [currentWorkout?.startTime]);

  useEffect(() => {
    if (!currentWorkout?.startTime) return;

    const timerState = {
      accumulated: accumulatedTimeRef.current,
      lastTick: Date.now(),
      isPaused
    };
    localStorage.setItem(WORKOUT_TIMER_KEY, JSON.stringify(timerState));
  }, [isPaused, currentWorkout?.startTime]);

  useEffect(() => {
    if (!currentWorkout?.startTime || isPaused) {
      return;
    }

    lastTickRef.current = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      accumulatedTimeRef.current += delta;
      
      const timerState = {
        accumulated: accumulatedTimeRef.current,
        lastTick: now,
        isPaused
      };
      localStorage.setItem(WORKOUT_TIMER_KEY, JSON.stringify(timerState));
      
      setDuration(Math.floor(accumulatedTimeRef.current / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentWorkout?.startTime, isPaused]);

  useEffect(() => {
    if (currentWorkout) {
      setWorkoutName(currentWorkout.name);
    }
  }, [currentWorkout]);


  useEffect(() => {
    if (!currentWorkout) return;

    // Check for previous notes for each exercise and set
    const updatedExercises = currentWorkout.exercises.map(ex => {
      const updatedSets = ex.sets.map((set, index) => {
        // If comments is null, it means it was explicitly unpinned, so don't apply last note
        if (set.comments === null) {
          return set;
        }

        // Find the most recent note for this exercise and set number
        const lastNote = workoutLogs
          .flatMap(log => 
            log.exercises
              .filter(e => e.exercise.id === ex.exercise.id)
              .flatMap(e => 
                e.sets
                  .filter((s, i) => i === index && s.comments)
                  .map(s => ({
                    note: s.comments,
                    date: new Date(log.startTime).getTime()
                  }))
              )
          )
          .sort((a, b) => b.date - a.date)[0]?.note;

        // If there's a last note and the current set doesn't have comments, add the note
        // But only carry forward pinned notes (ones with the pin prefix)
        if (lastNote && !set.comments) {
          // Check if the note from previous session was pinned (has the pin prefix)
          const isPinned = lastNote.startsWith('\ud83d\udccc ');
          
          if (isPinned) {
            // If it was pinned, carry it forward to the new session
            console.log('[WorkoutSession] Carrying forward pinned note:', lastNote);
            return { ...set, comments: lastNote };
          }
          // Don't carry forward regular (non-pinned) notes
        }
        return set;
      });

      return { ...ex, sets: updatedSets };
    });

    // Only update if there are actual changes
    const currentJson = JSON.stringify(currentWorkout.exercises);
    const updatedJson = JSON.stringify(updatedExercises);
    if (currentJson !== updatedJson) {
      // Create a new workout object with updated exercises
      const updatedWorkout = {
        ...currentWorkout,
        exercises: updatedExercises
      };
      setCurrentWorkout(updatedWorkout);
    }
  }, [currentWorkout?.exercises, workoutLogs]);


  const handleCompleteWorkout = async () => {
    if (!currentWorkout) return;
    
    try {
      setIsCompletingWorkout(true);
      const completed = await completeWorkout(workoutName);
      setCompletedWorkout(completed);
      localStorage.removeItem(WORKOUT_TIMER_KEY);
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('Failed to save workout. Please try again.');
      setIsCompletingWorkout(false);
    }
  };

  const handleCancelWorkout = () => {
    try {
      clearWorkoutState();
      localStorage.removeItem(WORKOUT_TIMER_KEY);
      
      const homePath = defaultHomePage === 'routines' ? '/routines' : '/';
      navigate(homePath);
    } catch (error) {
      console.error('Error canceling workout:', error);
      alert('Failed to cancel workout. Please try again.');
    }
  };

  const handleAddSet = (exerciseId: string) => {
    const exercise = currentWorkout?.exercises.find(e => e.exercise.id === exerciseId);
    if (exercise) {
      const lastSet = exercise.sets.length > 0 
        ? exercise.sets[exercise.sets.length - 1]
        : { targetReps: 0, weight: 0 };
  
      const newSet = {
        id: Date.now().toString(),
        setNumber: exercise.sets.length + 1,
        targetReps: lastSet.targetReps,
        performedReps: '',
        weight: lastSet.weight,
        comments: '',
        isPR: false,
        isWarmup: false,
        isDropset: false,
        isFailure: false
      };
      updateWorkoutExercise(exerciseId, {
        ...exercise,
        sets: [...exercise.sets, newSet]
      });
    }
  };
  

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    const exercise = currentWorkout?.exercises.find(e => e.exercise.id === exerciseId);
    if (exercise) {
      const updatedSets = exercise.sets.filter(set => set.id !== setId);
      const renumberedSets = updatedSets.map((set, index) => ({
        ...set,
        setNumber: index + 1
      }));
      updateWorkoutExercise(exerciseId, {
        ...exercise,
        sets: renumberedSets
      });
    }
  };

  const handleUpdateSet = (exerciseId: string, setId: string, field: string, value: any) => {
    if (!currentWorkout) return;
    const exercise = currentWorkout.exercises.find(e => e.exercise.id === exerciseId);
    if (exercise) {
      let processedValue = value;
      
      if (field === 'weight' || field === 'targetReps') {
        processedValue = Math.max(0, value);
        if (field === 'weight') {
          processedValue = Math.round(parseFloat(processedValue) * 4) / 4;
        }
        if (isNaN(processedValue)) processedValue = 0;
      }

      const updatedSets = exercise.sets.map(set =>
        set.id === setId ? { ...set, [field]: processedValue } : set
      );
      updateWorkoutExercise(exerciseId, {
        ...exercise,
        sets: updatedSets
      });
    }
  };


  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    lastTickRef.current = Date.now();
  };

  // Use mobile experience for all screens with max width constraint on desktop
  if (completedWorkout) {
    return (
      <WorkoutReview
        workout={completedWorkout}
        onClose={() => {
          setCompletedWorkout(null);
          navigate('/');
        }}
      />
    );
  }
  
  if (!currentWorkout && !completedWorkout && !isCompletingWorkout) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <Dumbbell className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No active workout</h3>
          <p className="text-gray-500 mb-6">Select exercises to start your workout session</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Select Exercises
          </button>
        </div>
      </div>
    );
  }

  if (isCompletingWorkout) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing workout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[768px]">
        <MobileWorkoutView
          workout={currentWorkout!}
          duration={duration}
          workoutName={workoutName}
          exerciseHistory={getExerciseHistory()}  
          onNameChange={setWorkoutName}
          onUpdateSet={handleUpdateSet}
          onDeleteSet={handleDeleteSet}
          onAddSet={handleAddSet}
          onDeleteExercise={deleteExercise}
          onShowExerciseModal={addExercisesToWorkout}
          onCompleteWorkout={handleCompleteWorkout}
          onCancelWorkout={handleCancelWorkout}
          isPaused={isPaused}
          onPauseResume={handlePauseResume}
        />
      </div>
    </div>
  );
};