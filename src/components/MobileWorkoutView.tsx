import React, { useState } from 'react';
import { Plus, Timer, Trash2, Dumbbell, CheckCheck, X } from 'lucide-react';
import { WorkoutLog, Exercise } from '../types/workout';
import { MobileSetRow } from './MobileSetRow';
import { AddNoteModal } from './AddNoteModal';
import { ConfirmationModal } from './ConfirmationModal';
import { ExerciseSelectionModal } from './ExerciseSelectionModal';
import { WorkoutReview } from './WorkoutReview';
import { useWorkout } from '../context/WorkoutContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

interface MobileWorkoutViewProps {
  workout: WorkoutLog;
  duration: number;
  workoutName: string;
  onNameChange: (name: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, field: string, value: any) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onShowExerciseModal: (exercises: Exercise[]) => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
}

export const MobileWorkoutView: React.FC<MobileWorkoutViewProps> = ({
  workout,
  duration,
  workoutName,
  onNameChange,
  onUpdateSet,
  onDeleteSet,
  onAddSet,
  onDeleteExercise,
  onShowExerciseModal,
  onCompleteWorkout,
  onCancelWorkout,
}) => {
  const [activeNoteModal, setActiveNoteModal] = useState<{
    exerciseId: string;
    setId: string;
    exerciseName: string;
    setNumber: number;
  } | null>(null);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showWorkoutReview, setShowWorkoutReview] = useState(false);
  const [completedWorkout, setCompletedWorkout] = useState<WorkoutLog | null>(null);
  const { clearWorkoutState, searchLogs } = useWorkout();
  const { weightUnit } = useSettings();
  const navigate = useNavigate();

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getIncompleteStats = () => {
    let incompleteSets = 0;
    workout.exercises.forEach(({ exercise, sets }) => {
      const isBodyweight = exercise.name.includes('(Bodyweight)');
      sets.forEach(set => {
        if (!set.performedReps || (!isBodyweight && !set.weight)) {
          incompleteSets++;
        }
      });
    });

    return {
      exercises: workout.exercises.length,
      sets: incompleteSets
    };
  };

  const handleAddExercises = (selectedExercises: Exercise[]) => {
    onShowExerciseModal(selectedExercises);
    setShowExerciseModal(false);
  };

  const handleCompleteWorkout = () => {
    setShowFinishConfirmation(false);
    const endTime = new Date().toISOString();
    const completedWorkoutData = {
      ...workout,
      name: workoutName,
      endTime,
      duration: new Date(endTime).getTime() - new Date(workout.startTime).getTime()
    };
    setCompletedWorkout(completedWorkoutData);
    setShowWorkoutReview(true);
  };

  const handleCloseReview = async () => {
    setShowWorkoutReview(false);
    setCompletedWorkout(null);
    clearWorkoutState();
    await searchLogs(''); // Refresh logs before navigating
    onCompleteWorkout();
  };

  const handleCancelWorkout = () => {
    setShowCancelConfirmation(false);
    clearWorkoutState();
    onCancelWorkout();
  };

  if (showWorkoutReview && completedWorkout) {
    return (
      <WorkoutReview
        workout={completedWorkout}
        onClose={handleCloseReview}
      />
    );
  }

  return (
    <div className="md:hidden min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-16 left-0 right-0 bg-white border-b z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <Timer size={20} className="text-gray-500" />
            <span className="text-xl font-semibold">{formatTime(duration)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowExerciseModal(true)}
              className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm"
            >
              <Plus size={16} className="mr-1.5" />
              Add Exercise
            </button>
            <button
              onClick={() => setShowFinishConfirmation(true)}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <CheckCheck size={16} />
            </button>
          </div>
        </div>
        <div className="px-4 pb-4">
          <input
            type="text"
            placeholder="Workout Name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={workoutName}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
      </div>

      {/* Exercise List */}
      <div className="mt-36 px-4 space-y-6 pb-32">
        {workout.exercises.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="flex justify-center mb-4">
              <Dumbbell className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No exercises in your workout</h3>
            <p className="text-gray-500 mb-6">Add some exercises to continue your workout</p>
            <button
              onClick={() => setShowExerciseModal(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={20} className="mr-2" />
              Add Exercises
            </button>
          </div>
        ) : (
          <>
            {workout.exercises.map(({ exercise, sets }) => {
              const isCardio = exercise.muscleGroup === 'Cardio';
              const isTimeBasedCore = exercise.muscleGroup === 'Core' && exercise.metrics?.time;
              const isBodyweight = exercise.name.includes('(Bodyweight)');

              return (
                <div key={exercise.id} className="bg-white rounded-xl shadow-sm">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold">{exercise.name}</h3>
                    <button
                      onClick={() => onDeleteExercise(exercise.id)}
                      className="text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-[50px_1fr_1fr_1fr_32px] gap-2 text-xs font-medium text-gray-500 mb-2">
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
                      />
                    ))}
                    <button
                      onClick={() => onAddSet(exercise.id)}
                      className="mt-3 flex items-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Set
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="space-y-3 mb-6">
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
      </div>

      {/* Add Note Modal */}
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

      {/* Exercise Selection Modal */}
      {showExerciseModal && (
        <ExerciseSelectionModal
          onClose={() => setShowExerciseModal(false)}
          onAdd={handleAddExercises}
          currentExercises={workout.exercises.map(e => e.exercise)}
        />
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showFinishConfirmation}
        onClose={() => setShowFinishConfirmation(false)}
        onConfirm={handleCompleteWorkout}
        title="Finish Workout?"
        message={`You have ${getIncompleteStats().exercises} exercises with ${getIncompleteStats().sets} incomplete sets. Are you sure you want to finish this workout?`}
        confirmText="Yes, Finish"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />

      <ConfirmationModal
        isOpen={showCancelConfirmation}
        onClose={() => setShowCancelConfirmation(false)}
        onConfirm={handleCancelWorkout}
        title="Cancel Workout?"
        message={`You have ${getIncompleteStats().exercises} exercises with ${getIncompleteStats().sets} sets that will be discarded. This action cannot be undone.`}
        confirmText="Yes, Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};