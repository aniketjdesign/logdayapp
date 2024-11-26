import React, { useState, useEffect, useRef } from 'react';
import { Plus, Timer, MoreVertical, Trash2, CheckCheck, X, History, Settings, RefreshCw, PlayCircle, PauseCircle, MoveVertical, Link2, Clock } from 'lucide-react';
import { WorkoutLog, Exercise } from '../types/workout';
import { MobileSetRow } from './MobileSetRow';
import { AddNoteModal } from './AddNoteModal';
import { ConfirmationModal } from './ConfirmationModal';
import { ExerciseSelectionModal } from './ExerciseSelectionModal';
import { WorkoutReview } from './WorkoutReview';
import { CircularProgress } from './CircularProgress';
import { ExerciseReorderModal } from './ExerciseReorderModal';
import { SupersetModal } from './SupersetModal';
import { RestTimer } from './RestTimer';
import { useWorkout } from '../context/WorkoutContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

interface MobileWorkoutViewProps {
  workout: WorkoutLog;
  duration: number;
  workoutName: string;
  isPaused: boolean;
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
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showWorkoutReview, setShowWorkoutReview] = useState(false);
  const [completedWorkout, setCompletedWorkout] = useState<WorkoutLog | null>(null);
  const [activeExerciseMenu, setActiveExerciseMenu] = useState<string | null>(null);
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const { weightUnit } = useSettings();
  const [showRestTimer, setShowRestTimer] = useState(false);
  // Initialize rest timer as enabled for all exercises by default
  const [restTimerEnabled, setRestTimerEnabled] = useState<{ [key: string]: boolean}>(() => {
    const initialState: { [key: string]: boolean } = {};
    workout.exercises.forEach(({ exercise }) => {
      initialState[exercise.id] = true;
    });
    return initialState;
  });

  const { setCurrentWorkout } = useWorkout();
  const navigate = useNavigate();

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
    if (restTimerEnabled[exerciseId]) {
      setShowRestTimer(true);
    }
  };

  const toggleRestTimer = (exerciseId: string) => {
    setRestTimerEnabled(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
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

  const renderExerciseMenu = (exerciseId: string) => (
    <div className="absolute right-4 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
      <button
        onClick={() => {
          toggleRestTimer(exerciseId);
          setActiveExerciseMenu(null);
        }}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2"
      >
        <Clock size={16} className="text-blue-500" />
        <span>
          {restTimerEnabled[exerciseId] ? 'Disable Rest Timer' : 'Enable Rest Timer'}
        </span>
      </button>
      <button
        onClick={() => {
          handleSuperset(exerciseId);
        }}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2"
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
          onDeleteExercise(exerciseId);
          setActiveExerciseMenu(null);
        }}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-red-600"
      >
        <Trash2 size={16} className="mr-2" />
        <span>Remove Exercise</span>
      </button>
    </div>
  );

  const stats = getWorkoutStats();

  return (
    <div className="md:hidden min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-40">
        {/* First Row - Workout Name and Actions */}
        <div className="flex items-center justify-between p-4 gap-4">
          <input
            type="text"
            placeholder="Workout Name"
            className="flex-1 px-2 py-1 text-md font-medium bg-transparent rounded-lg border text-gray-800"
            value={workoutName}
            onChange={(e) => onNameChange(e.target.value)}
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMenuToggle}
              className="p-2.5 bg-blue-50 rounded-lg"
            >
              <MoreVertical size={16} className="text-blue-600"/>
            </button>
            <button
              onClick={() => setShowExerciseModal(true)}
              className="p-2.5 bg-blue-600 text-white rounded-lg"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Second Row - Stats */}
        <div className="flex items-center justify-between px-4 pt-2 pb-4">
          <div className="flex w-1/4 items-center space-x-1">
            <Timer size={18} className={isPaused ? "text-yellow-600" : "text-gray-500"} />
            <span className={`text-sm font-medium ${isPaused ? "text-yellow-600" : "text-gray-600"}`}>
              {formatTime(duration)}
            </span>
          </div>
          <div className="separator w-px h-4 bg-gray-200"/>
          <div className="flex items-center space-x-2">
            <CircularProgress 
              progress={stats.exercises.progress} 
              color={stats.exercises.color}
            />
            <span className="text-sm font-medium text-gray-600">
              {stats.exercises.completed}/{stats.exercises.total} exercises
            </span>
          </div>
          <div className="separator w-px h-4 bg-gray-200"/>
          <div className="flex items-center space-x-2">
            <CircularProgress 
              progress={stats.sets.progress} 
              color={stats.sets.color}
            />
            <span className="text-sm font-medium text-gray-600">
              {stats.sets.completed}/{stats.sets.total} sets
            </span>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="mt-32 px-4 space-y-6 pt-4 pb-32">
        {workout.exercises.map(({ exercise, sets, supersetWith }, index) => {
          const isBodyweight = exercise.name.includes('(Bodyweight)');
          const isCardio = exercise.muscleGroup === 'Cardio';
          const isTimeBasedCore = exercise.muscleGroup === 'Core' && exercise.metrics?.time;
          const supersetPartner = workout.exercises.find(ex => ex.exercise.id === supersetWith);

          if (supersetWith && workout.exercises.findIndex(ex => ex.exercise.id === supersetWith) < index) {
            return null;
          }

          return (
            <div key={exercise.id} className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold">{exercise.name}</h3>
                    {supersetPartner && (
                      <div className="mt-1 flex gap-2 items-center text-sm text-lime-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-lime-500" />
                        Superset w/ {supersetPartner.exercise.name}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleExerciseMenuToggle(exercise.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg ml-2"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                {activeExerciseMenu === exercise.id && renderExerciseMenu(exercise.id)}
              </div>



              
  <div className="p-4">
                {/* Column Headers */}
                <div className="grid grid-cols-[50px_1fr_1fr_1fr_32px] gap-2 mb-2 text-xs font-medium text-gray-500">
                  <div>SET</div>
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
                  <div></div>
                </div>
                {sets.map((set) => (
                  <MobileSetRow
                    key={set.id}
                    set={set}
                    exercise={exercise}
                    onUpdate={(field, value) => onUpdateSet(exercise.id, set.id, field, value)}
                    onDelete={() => onDeleteSet(exercise.id, set.id)}
                    onOpenNoteModal={() => setActiveNoteModal({
                      exerciseId: exercise.id,
                      setId: set.id,
                      exerciseName: exercise.name,
                      setNumber: set.setNumber
                    })}
                    onSetComplete={() => handleSetComplete(exercise.id)}
                  />
                ))}

                {!supersetPartner && (
                  <button
                    onClick={() => onAddSet(exercise.id)}
                    className="mt-3 flex items-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm justify-center"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Set
                  </button>
                )}

                {supersetPartner && (
                  <>
                    <button
                      onClick={() => onAddSet(exercise.id)}
                      className="mt-3 flex items-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm justify-center"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Set
                    </button>

                    <div className="my-4 border-t border-lime-500" />
                    <div className="mb-2">
                      <h4 className="text-sm font-medium text-gray-700">{supersetPartner.exercise.name}</h4>
                    </div>
                    {supersetPartner.sets.map((set) => (
                      <MobileSetRow
                        key={set.id}
                        set={set}
                        exercise={supersetPartner.exercise}
                        onUpdate={(field, value) => onUpdateSet(supersetPartner.exercise.id, set.id, field, value)}
                        onDelete={() => onDeleteSet(supersetPartner.exercise.id, set.id)}
                        onOpenNoteModal={() => setActiveNoteModal({
                          exerciseId: supersetPartner.exercise.id,
                          setId: set.id,
                          exerciseName: supersetPartner.exercise.name,
                          setNumber: set.setNumber
                        })}
                        onSetComplete={() => handleSetComplete(supersetPartner.exercise.id)}
                      />
                    ))}
                    <button
                      onClick={() => onAddSet(supersetPartner.exercise.id)}
                      className="mt-3 flex items-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm justify-center"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Set
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        <div className="space-y-3 mt-6">
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
      </div>

      {/* Modals */}
      {activeNoteModal && (
        <AddNoteModal
          exerciseName={activeNoteModal.exerciseName}
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
          onClose={() => setShowExerciseModal(false)}
          onAdd={(selectedExercises) => {
            onShowExerciseModal(selectedExercises);
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
        message={`You have ${stats.exercises.completed}/${stats.exercises.total} exercises and ${stats.sets.completed}/${stats.sets.total} sets completed. Are you sure you want to finish this workout?`}
        confirmText="Yes, Finish"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />

      <ConfirmationModal
        isOpen={showCancelConfirmation}
        onClose={() => setShowCancelConfirmation(false)}
        onConfirm={onCancelWorkout}
        title="Cancel Workout?"
        message={`You have ${stats.exercises.completed}/${stats.exercises.total} exercises and ${stats.sets.completed}/${stats.sets.total} sets that will be discarded. This action cannot be undone.`}
        confirmText="Yes, Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Rest Timer */}
      <RestTimer
        isOpen={showRestTimer}
        onClose={() => setShowRestTimer(false)}
        defaultDuration={120}
      />

      {/* Menu */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-50" 
            onClick={() => setShowMenu(false)}
          />
          <div 
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
              maxHeight: 'calc(100vh - 64px)',
              overflowY: 'auto'
            }}
            className="bg-white rounded-lg shadow-lg z-50 min-w-[200px] py-1"
          >
            <button
              onClick={() => {
                setShowMenu(false);
                setShowFinishConfirmation(true);
              }}
              className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
            >
              <CheckCheck size={18} className="mr-3 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Finish Workout</span>
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                onPauseResume();
              }}
              className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
            >
              {isPaused ? (
                <>
                  <PlayCircle size={18} className="mr-3 text-gray-600" />
                  <span className="text-sm font-medium">Resume Workout</span>
                </>
              ) : (
                <>
                  <PauseCircle size={18} className="mr-3 text-gray-600" />
                  <span className="text-sm font-medium">Pause Workout</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                setShowReorderModal(true);
              }}
              className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
            >
              <MoveVertical size={18} className="mr-3 text-gray-600" />
              <span className="text-sm font-medium">Reorder Exercises</span>
            </button>
            <div className="w-full h-px bg-gray-100"/>
            <button
              onClick={() => {
                setShowMenu(false);
                navigate('/logs');
              }}
              className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
            >
              <History size={18} className="mr-3 text-gray-600" />
              <span className="text-sm font-medium">Workout History</span>
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                navigate('/settings');
              }}
              className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
            >
              <Settings size={18} className="mr-3 text-gray-600" />
              <span className="text-sm font-medium">Settings</span>
            </button>
            <div className="w-full h-px bg-gray-100"/>
            <button
              onClick={() => {
                setShowMenu(false);
                window.location.reload();
              }}
              className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
            >
              <RefreshCw size={18} className="mr-3 text-gray-600" />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};