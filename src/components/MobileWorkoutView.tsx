import React, { useState, useEffect, useRef } from 'react';
import { Clock, Link2, Trash2, RefreshCw } from 'lucide-react';
import { WorkoutLog, Exercise } from '../types/workout';
import { MobileSetRow } from './MobileSetRow';
import { AddNoteModal } from './AddNoteModal';
import { ConfirmationModal } from './ConfirmationModal';
import { ExerciseSelectionModal } from './ExerciseSelectionModal';
import { WorkoutReview } from './WorkoutReview';
import { SupersetModal } from './SupersetModal';
import { RestTimer } from './RestTimer';
import { ExerciseReorderModal } from './ExerciseReorderModal';
import { useWorkout } from '../context/WorkoutContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { MobileWorkoutHeader } from './mobile/MobileWorkoutHeader';
import { MobileExerciseCard } from './mobile/MobileExerciseCard';
import { MobileWorkoutFooter } from './mobile/MobileWorkoutFooter';
import { MobileWorkoutMenu } from './mobile/MobileWorkoutMenu';

interface MobileWorkoutViewProps {
  workout: WorkoutLog;
  duration: number;
  workoutName: string;
  isPaused: boolean;
  exerciseHistory?: { [exerciseId: string]: WorkoutLog[] };
  onNameChange: (name: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, field: string, value: any) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onShowExerciseModal: (exercises: Exercise[]) => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
  onPauseResume: () => void;
}

export const MobileWorkoutView: React.FC<MobileWorkoutViewProps> = ({
  workout,
  duration,
  workoutName,
  isPaused,
  exerciseHistory,
  onNameChange,
  onUpdateSet,
  onDeleteSet,
  onAddSet,
  onDeleteExercise,
  onShowExerciseModal,
  onCompleteWorkout,
  onCancelWorkout,
  onPauseResume,
}) => {
  const [activeNoteModal, setActiveNoteModal] = useState<{
    exerciseId: string;
    setId: string;
    exerciseName: string;
    setNumber: number;
  } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [replaceExerciseId, setReplaceExerciseId] = useState<string | null>(null);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showWorkoutReview, setShowWorkoutReview] = useState(false);
  const [completedWorkout, setCompletedWorkout] = useState<WorkoutLog | null>(null);
  const [activeExerciseMenu, setActiveExerciseMenu] = useState<string | null>(null);
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [workoutRestTimer, setWorkoutRestTimer] = useState<boolean>(true);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerEnabled, setRestTimerEnabled] = useState<{ [key: string]: boolean}>(() => {
    const initialState: { [key: string]: boolean } = {};
    workout.exercises.forEach(({ exercise }) => {
      initialState[exercise.id] = workout.restTimerSettings?.[exercise.id] ?? true;
    });
    return initialState;
  });

  useEffect(() => {
    if (workout.workoutRestTimer !== undefined) {
      setWorkoutRestTimer(workout.workoutRestTimer);
    }
  }, [workout.workoutRestTimer]);

  const { setCurrentWorkout } = useWorkout();
  const { weightUnit } = useSettings();
  const navigate = useNavigate();

  const getWorkoutStats = () => {
    const totalExercises = workout.exercises.length;
    const completedExercises = workout.exercises.filter(({ sets }) => 
      sets.every(set => set.performedReps || set.time)
    ).length;

    const totalSets = workout.exercises.reduce((total, { sets }) => total + sets.length, 0);
    const completedSets = workout.exercises.reduce((total, { sets }) => 
      total + sets.filter(set => set.performedReps || set.time).length, 0
    );

    const exerciseProgress = (completedExercises / totalExercises) * 100;
    const setProgress = (completedSets / totalSets) * 100;

    return {
      exercises: {
        completed: completedExercises,
        total: totalExercises,
        progress: exerciseProgress,
        color: exerciseProgress >= 70 ? '#22C55E' : '#EAB308'
      },
      sets: {
        completed: completedSets,
        total: totalSets,
        progress: setProgress,
        color: setProgress >= 70 ? '#22C55E' : '#EAB308'
      }
    };
  };

  const handleExerciseMenuToggle = (exerciseId: string) => {
    setActiveExerciseMenu(activeExerciseMenu === exerciseId ? null : exerciseId);
  };

  const handleSetComplete = (exerciseId: string) => {
    if (workoutRestTimer && restTimerEnabled[exerciseId]) {
      setShowRestTimer(true);
    }
  };

  const toggleRestTimer = (exerciseId: string) => {
    const newSettings = {
      ...restTimerEnabled,
      [exerciseId]: !restTimerEnabled[exerciseId]
    };
    setRestTimerEnabled(newSettings);
    setCurrentWorkout({
      ...workout,
      restTimerSettings: newSettings
    });
  };

  const handleMenuToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setMenuPosition({
      top: rect.top + rect.height + 4,
      right: window.innerWidth - rect.right
    });
    setShowMenu(prev => !prev);
  };

  const handleCompleteWorkout = async () => {
    try {
      setShowFinishConfirmation(false);
      await onCompleteWorkout();
      setShowWorkoutReview(true);
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('Failed to complete workout. Please try again.');
    }
  };

  const handleSuperset = (exerciseId: string) => {
    const exercise = workout.exercises.find(ex => ex.exercise.id === exerciseId);
    if (exercise?.supersetWith) {
      const updatedExercises = workout.exercises.map(ex => {
        if (ex.exercise.id === exerciseId || ex.exercise.id === exercise.supersetWith) {
          const { supersetWith, ...rest } = ex;
          return rest;
        }
        return ex;
      });
  
      setCurrentWorkout({
        ...workout,
        exercises: updatedExercises
      });
      setActiveExerciseMenu(null);
    } else {
      setSelectedExerciseId(exerciseId);
      setActiveExerciseMenu(null);
      setShowSupersetModal(true);
    }
  };

  const handleSupersetSelect = (targetExerciseId: string) => {
    if (!selectedExerciseId) return;

    const updatedExercises = workout.exercises.map(ex => {
      if (ex.exercise.id === selectedExerciseId) {
        return { ...ex, supersetWith: targetExerciseId };
      }
      if (ex.exercise.id === targetExerciseId) {
        return { ...ex, supersetWith: selectedExerciseId };
      }
      return ex;
    });

    setCurrentWorkout({
      ...workout,
      exercises: updatedExercises
    });

    setShowSupersetModal(false);
    setSelectedExerciseId(null);
  };

  const renderExerciseMenu = (exerciseId: string) => (
    <div className="absolute right-4 mt-2 w-52 bg-white rounded-xl shadow-lg border z-10">
      <button
        onClick={() => {
          toggleRestTimer(exerciseId);
          setActiveExerciseMenu(null);
        }}
        className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 ${
          !workoutRestTimer ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={!workoutRestTimer}
      >
        <Clock size={16} className={restTimerEnabled[exerciseId] ? "text-gray-600" : "text-gray-600"} />
        <span>
          {restTimerEnabled[exerciseId] ? 'Disable Rest Timer' : 'Enable Rest Timer'}
        </span>
      </button>
      <button
        onClick={() => {
          handleSuperset(exerciseId);
        }}
        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-lime-500" />
        <span>
          {workout.exercises.find(ex => ex.exercise.id === exerciseId)?.supersetWith
            ? 'Remove Superset'
            : 'Superset with'}
        </span>
      </button>
      <button
        onClick={() => {
          setReplaceExerciseId(exerciseId);
          setShowExerciseModal(true);
          setActiveExerciseMenu(null);
        }}
        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2"
      >
        <RefreshCw size={16} />
        <span>Replace Exercise</span>
      </button>
      <button
        onClick={() => {
          onDeleteExercise(exerciseId);
          setActiveExerciseMenu(null);
        }}
        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center text-red-600"
      >
        <Trash2 size={16} className="mr-2" />
        <span>Remove Exercise</span>
      </button>
    </div>
  );

  const stats = getWorkoutStats();

  const toggleWorkoutRestTimer = () => {
    const newValue = !workoutRestTimer;
    setWorkoutRestTimer(newValue);
    setCurrentWorkout({
      ...workout,
      workoutRestTimer: newValue
    });
  };

  return (
    <div className="md:hidden app-layout bg-gray-50">
      <MobileWorkoutHeader
        workoutName={workoutName}
        duration={duration}
        isPaused={isPaused}
        stats={stats}
        onNameChange={onNameChange}
        onMenuToggle={handleMenuToggle}
        onAddExercise={() => setShowExerciseModal(true)}
        onPauseResume={onPauseResume}
      />

      <div className="px-4 space-y-6 pt-32 pb-40">
        {workout.exercises.map(({ exercise, sets, supersetWith }, index) => {
          if (supersetWith && workout.exercises.findIndex(ex => ex.exercise.id === supersetWith) < index) {
            return null;
          }

          const supersetPartner = workout.exercises.find(ex => ex.exercise.id === supersetWith);

          return (
            <MobileExerciseCard
              key={exercise.id}
              exercise={exercise}
              sets={sets}
              supersetWith={supersetWith}
              exerciseHistory={exerciseHistory}
              weightUnit={weightUnit}
              onUpdateSet={onUpdateSet}
              onDeleteSet={onDeleteSet}
              onAddSet={onAddSet}
              onOpenNoteModal={setActiveNoteModal}
              onSetComplete={handleSetComplete}
              onExerciseMenuToggle={handleExerciseMenuToggle}
              activeExerciseMenu={activeExerciseMenu}
              renderExerciseMenu={renderExerciseMenu}
              supersetPartner={supersetPartner}
            />
          );
        })}

        <MobileWorkoutFooter
          onFinish={() => setShowFinishConfirmation(true)}
          onCancel={() => setShowCancelConfirmation(true)}
        />
      </div>

      {/* Modals */}
      {activeNoteModal && (
        <AddNoteModal
          exerciseName={activeNoteModal.exerciseName}
          exerciseId={activeNoteModal.exerciseId}
          setNumber={activeNoteModal.setNumber}
          currentNote={
            workout.exercises
              .find(e => e.exercise.id === activeNoteModal.exerciseId)
              ?.sets.find(s => s.id === activeNoteModal.setId)
              ?.comments || ''
          }
          onSave={(note) => {
            onUpdateSet(activeNoteModal.exerciseId, activeNoteModal.setId, 'comments', note);
            setActiveNoteModal(null);
          }}
          onClose={() => setActiveNoteModal(null)}
        />
      )}

      {showExerciseModal && (
        <ExerciseSelectionModal
          isReplacing={replaceExerciseId !== null}
          onClose={() => {
            setShowExerciseModal(false);
            setReplaceExerciseId(null);
          }}
          onAdd={(selectedExercises) => {
            if (replaceExerciseId) {
              // Handle replacing an exercise
              const exerciseToReplace = workout.exercises.find(e => e.exercise.id === replaceExerciseId);
              if (exerciseToReplace && selectedExercises.length === 1) {
                // Create a new exercise with the same number of sets but with empty values
                const newExercise = {
                  exercise: selectedExercises[0],
                  sets: exerciseToReplace.sets.map(set => ({
                    ...set,
                    weight: 0,
                    targetReps: 0,
                    completedReps: 0,
                    comments: ''
                  })),
                  supersetWith: null
                };
                
                // Replace the exercise in the workout
                const updatedExercises = workout.exercises.map(e => 
                  e.exercise.id === replaceExerciseId ? newExercise : e
                );
                
                // Update the workout with the new exercises array
                setCurrentWorkout({
                  ...workout,
                  exercises: updatedExercises
                });
              }
              setReplaceExerciseId(null);
            } else {
              // Normal add exercise flow
              onShowExerciseModal(selectedExercises);
            }
            setShowExerciseModal(false);
          }}
          currentExercises={workout.exercises.map(e => e.exercise)}
        />
      )}

      {showSupersetModal && selectedExerciseId && (
        <SupersetModal
          onClose={() => {
            setShowSupersetModal(false);
            setSelectedExerciseId(null);
          }}
          onSelect={handleSupersetSelect}
          exercises={workout.exercises}
          currentExerciseId={selectedExerciseId}
        />
      )}

      {showReorderModal && (
        <ExerciseReorderModal
          exercises={workout.exercises}
          onClose={() => setShowReorderModal(false)}
          onReorder={(exercises) => {
            setCurrentWorkout({
              ...workout,
              exercises
            });
            setShowReorderModal(false);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={showFinishConfirmation}
        onClose={() => setShowFinishConfirmation(false)}
        onConfirm={handleCompleteWorkout}
        title="Finish Workout?"
        message={
          stats.exercises.total - stats.exercises.completed === 0 && 
          stats.sets.total - stats.sets.completed === 0
            ? "Woah, looks like you're all done! Time to cool down and focus on your recovery for the next session. 💪"
            : `You still have ${stats.exercises.total - stats.exercises.completed} exercises and ${stats.sets.total - stats.sets.completed} sets remaining. Are you sure you want to finish?`
        }
        confirmText="Yes, Finish"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />

      <ConfirmationModal
        isOpen={showCancelConfirmation}
        onClose={() => setShowCancelConfirmation(false)}
        onConfirm={onCancelWorkout}
        title="Cancel Workout?"
        message="Are you sure you want to cancel this workout? All progress will be lost."
        confirmText="Yes, Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {showRestTimer && (
        <RestTimer
          isOpen={showRestTimer}
          onClose={() => setShowRestTimer(false)}
          defaultDuration={120}
        />
      )}

      {showWorkoutReview && (
        <WorkoutReview
          workout={workout}
          onClose={() => {
            setShowWorkoutReview(false);
            navigate('/');
          }}
        />
      )}

      <MobileWorkoutMenu
        isOpen={showMenu}
        position={menuPosition}
        isPaused={isPaused}
        workoutRestTimer={workoutRestTimer}
        onClose={() => setShowMenu(false)}
        onFinishWorkout={() => setShowFinishConfirmation(true)}
        onPauseResume={onPauseResume}
        onReorderExercises={() => setShowReorderModal(true)}
        onToggleWorkoutRestTimer={toggleWorkoutRestTimer}
        onNavigateToHistory={() => navigate('/logs')}
        onNavigateToSettings={() => navigate('/settings')}
        onRefresh={() => window.location.reload()}
      />
    </div>
  );
};