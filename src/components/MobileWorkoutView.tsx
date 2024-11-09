import React, { useState } from 'react';
import { Plus, Timer, Trash2, Dumbbell } from 'lucide-react';
import { WorkoutLog, Exercise } from '../types/workout';
import { MobileSetRow } from './MobileSetRow';
import { AddNoteModal } from './AddNoteModal';
import { ConfirmationModal } from './ConfirmationModal';
import { ExerciseSelectionModal } from './ExerciseSelectionModal';
import { WorkoutReview } from './WorkoutReview';
import { useWorkout } from '../context/WorkoutContext';

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
  const { clearWorkoutState } = useWorkout();

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getIncompleteStats = () => {
    let incompleteSets = 0;
    workout.exercises.forEach(({ sets }) => {
      sets.forEach(set => {
        if (!set.performedReps || !set.weight) {
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

  const handleCloseReview = () => {
    setShowWorkoutReview(false);
    setCompletedWorkout(null);
    clearWorkoutState();
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
    <div className="md:hidden min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="fixed top-16 left-0 right-0 bg-white border-b z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <Timer size={20} className="text-gray-500" />
            <span className="text-xl font-semibold">{formatTime(duration)}</span>
          </div>
          <button
            onClick={() => setShowExerciseModal(true)}
            className="flex items-center px-4 py-2 border-2 border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Add Exercise
          </button>
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
      <div className="mt-36 px-4 space-y-6">
        {workout.exercises.map(({ exercise, sets }) => (
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
                <div>KGs</div>
                <div>GOAL</div>
                <div>DONE</div>
                <div></div>
              </div>
              {sets.map((set) => (
                <MobileSetRow
                  key={set.id}
                  set={set}
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
                className="mt-3 text-blue-600 text-sm font-medium flex items-center"
              >
                <Plus size={16} className="mr-1" /> Add Set
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t space-y-2">
        <button
          onClick={() => setShowFinishConfirmation(true)}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg transition-colors"
        >
          Finish Workout
        </button>
        <button
          onClick={() => setShowCancelConfirmation(true)}
          className="w-full py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors"
        >
          Cancel Workout
        </button>
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