import React, { useState, useEffect, useRef } from 'react';
import { Timer, Plus, Trash2, Dumbbell, CheckCheck, X } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { ExerciseSelectionModal } from './ExerciseSelectionModal';
import { WorkoutReview } from './WorkoutReview';
import { ConfirmationModal } from './ConfirmationModal';
import { SetRow } from './SetRow';
import { MobileWorkoutView } from './MobileWorkoutView';
import { Exercise } from '../types/workout';
import { exerciseService } from '../services/exerciseService';

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
    setSelectedExercises,
    clearWorkoutState 
  } = useWorkout();
  const { weightUnit, defaultHomePage } = useSettings();
  const [workoutName, setWorkoutName] = useState(currentWorkout?.name || '');
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [completedWorkout, setCompletedWorkout] = useState(null);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isCompletingWorkout, setIsCompletingWorkout] = useState(false);
  const navigate = useNavigate();
  const lastTickRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);

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
    const loadCustomExercises = async () => {
      try {
        const exercises = await exerciseService.getUserExercises();
        setCustomExercises(exercises);
      } catch (error) {
        console.error('Failed to load custom exercises:', error);
      } finally {
        setIsLoadingExercises(false);
      }
    };

    loadCustomExercises();
  }, []);

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

        // If there's a last note and current set doesn't have comments, add them
        if (lastNote && !set.comments) {
          return { ...set, comments: ' ' }; // Space instead of empty string to ensure indicator shows
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

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getIncompleteStats = () => {
    if (!currentWorkout) return { exercises: 0, sets: 0 };
    
    let incompleteSets = 0;
    currentWorkout.exercises.forEach(({ exercise, sets }) => {
      const isBodyweight = exercise.name.includes('(Bodyweight)');
      sets.forEach(set => {
        if (!set.performedReps || (!isBodyweight && !set.weight)) {
          incompleteSets++;
        }
      });
    });

    return {
      exercises: currentWorkout.exercises.length,
      sets: incompleteSets
    };
  };

  const handleCompleteWorkout = async () => {
    if (!currentWorkout) return;
    
    try {
      setIsCompletingWorkout(true);
      const completed = await completeWorkout(workoutName);
      setCompletedWorkout(completed);
      setShowFinishConfirmation(false);
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
      setShowCancelConfirmation(false);
      
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

  const handleAddExercises = (selectedExercises: Exercise[]) => {
    addExercisesToWorkout(selectedExercises);
    setShowExerciseModal(false);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    lastTickRef.current = Date.now();
  };

  // Mobile View
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
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

    // Don't render MobileWorkoutView during the completion transition
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
      <MobileWorkoutView
        workout={currentWorkout}
        duration={duration}
        workoutName={workoutName}
        exerciseHistory={getExerciseHistory()}  
        onNameChange={setWorkoutName}
        onUpdateSet={handleUpdateSet}
        onDeleteSet={handleDeleteSet}
        onAddSet={handleAddSet}
        onDeleteExercise={deleteExercise}
        onShowExerciseModal={handleAddExercises}
        onCompleteWorkout={handleCompleteWorkout}
        onCancelWorkout={handleCancelWorkout}
        isPaused={isPaused}
        onPauseResume={handlePauseResume}
      />
    );
  }

  // Desktop View
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

  const { exercises: exerciseCount, sets: incompleteSets } = getIncompleteStats();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Timer size={24} className={isPaused ? "text-yellow-500" : "text-gray-500"} />
            <span className="text-2xl font-bold">{formatTime(duration)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePauseResume}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                isPaused 
                  ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={() => setIsExerciseModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm"
            >
              <Plus size={18} className="mr-2" />
              Add Exercise
            </button>
            <button
              onClick={() => setShowFinishConfirmation(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm"
            >
              <CheckCheck size={18} />
            </button>
          </div>
        </div>
        <input
          type="text"
          placeholder="Workout Name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
        />
      </div>

      {currentWorkout.exercises.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="flex justify-center mb-4">
            <Dumbbell className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No exercises in your workout</h3>
          <p className="text-gray-500 mb-6">Add some exercises to continue your workout</p>
          <button
            onClick={() => setIsExerciseModalOpen(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={20} className="mr-2" />
            Add Exercises
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-6 mb-6">
            {currentWorkout.exercises.map(({ exercise, sets }) => {
              const isBodyweight = exercise.name.includes('(Bodyweight)');
              const isCardio = exercise.muscleGroup === 'Cardio';
              const isTimeBasedCore = exercise.muscleGroup === 'Core' && exercise.metrics?.time;

              return (
                <div key={exercise.id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{exercise.name}</h3>
                    <button
                      onClick={() => deleteExercise(exercise.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="hidden md:grid md:grid-cols-[35px_1fr_1fr_1fr_1.2fr_100px] gap-2 mb-2 text-xs font-medium text-gray-500">
                      <div className="text-center">SET</div>
                      {isCardio || isTimeBasedCore ? (
                        <>
                          <div>TIME</div>
                          {exercise.metrics?.distance && <div>DISTANCE</div>}
                          {exercise.metrics?.difficulty && <div>DIFFICULTY</div>}
                          {exercise.metrics?.incline && <div>INCLINE</div>}
                          {exercise.metrics?.pace && <div>PACE</div>}
                          {exercise.metrics?.reps && <div>REPS</div>}
                        </>
                      ) : (
                        <>
                          <div>{isBodyweight ? 'WEIGHT' : weightUnit.toUpperCase()}</div>
                          <div>GOAL</div>
                          <div>DONE</div>
                        </>
                      )}
                      <div>NOTES</div>
                      <div>ACTIONS</div>
                      <div>ACTIONS</div>
                    </div>

                    {sets.map(set => (
                      <SetRow
                        key={set.id}
                        set={set}
                        exercise={exercise}
                        onUpdate={(field, value) => handleUpdateSet(exercise.id, set.id, field, value)}
                        onDelete={() => handleDeleteSet(exercise.id, set.id)}
                      />
                    ))}
                    <button
                      onClick={() => handleAddSet(exercise.id)}
                      className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                    >
                      <Plus size={18} className="mr-2" />
                      Add Set
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 mb-6">
            <button
              onClick={() => setShowFinishConfirmation(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center"
            >
              <CheckCheck size={20} className="mr-2" />
              Finish Workout
            </button>
            <button
              onClick={() => setShowCancelConfirmation(true)}
              className="w-full py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors flex items-center justify-center"
            >
              <X size={20} className="mr-2" />
              Cancel Workout
            </button>
          </div>
        </>
      )}

      {isExerciseModalOpen && (
        <ExerciseSelectionModal
          onClose={() => setIsExerciseModalOpen(false)}
          onAdd={handleAddExercises}
          currentExercises={currentWorkout.exercises.map(e => e.exercise)}
          customExercises={customExercises}
          onCustomExerciseAdded={(exercise) => {
            setCustomExercises(prev => [exercise, ...prev]);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={showFinishConfirmation}
        onClose={() => setShowFinishConfirmation(false)}
        onConfirm={handleCompleteWorkout}
        title="Finish Workout?"
        message={`You have ${exerciseCount} exercises with ${incompleteSets} incomplete sets. Are you sure you want to finish this workout?`}
        confirmText="Yes, Finish"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />

      <ConfirmationModal
        isOpen={showCancelConfirmation}
        onClose={() => setShowCancelConfirmation(false)}
        onConfirm={handleCancelWorkout}
        title="Cancel Workout?"
        message={`You have ${exerciseCount} exercises with ${incompleteSets} sets that will be discarded. This action cannot be undone.`}
        confirmText="Yes, Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};