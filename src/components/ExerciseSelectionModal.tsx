import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { Exercise } from '../types/exercise';
import { exercises } from '../data/exercises';
import { ExerciseSelector } from './ExerciseSelector';
import { AddExerciseModal } from './AddExerciseModal';
import { useWorkout } from '../context/WorkoutContext';
import { RemoveScroll } from 'react-remove-scroll';

interface ExerciseSelectionModalProps {
  onClose: () => void;
  onAdd: (exercises: Exercise[]) => void;
  currentExercises: Exercise[];
}

export const ExerciseSelectionModal: React.FC<ExerciseSelectionModalProps> = ({
  onClose,
  onAdd,
  currentExercises,
}) => {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { customExercises, addCustomExercise } = useWorkout();

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercises(
      selectedExercises.find(e => e.id === exercise.id)
        ? selectedExercises.filter(e => e.id !== exercise.id)
        : [...selectedExercises, exercise]
    );
  };

  const groupedExercises = useMemo(() => {
    return exercises.reduce((groups, exercise) => {
      const letter = exercise.name[0].toUpperCase();
      return {
        ...groups,
        [letter]: [...(groups[letter] || []), exercise],
      };
    }, {} as { [key: string]: Exercise[] });
  }, []);

  return (
    <RemoveScroll>
      <div className="fixed inset-0 bg-black/50 flex items-center w-full justify-center z-50">
        <div className="relative w-full h-[70vh] max-w-md bg-white rounded-t-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Add Exercises</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="h-[calc(100vh-96px)] overflow-y-auto">
            <ExerciseSelector
              customExercises={customExercises}
              recentExercises={[]}
              allExercises={groupedExercises}
              selectedExercises={selectedExercises}
              onExerciseSelect={handleExerciseSelect}
              onAddCustomExercise={() => setIsAddModalOpen(true)}
              currentWorkout={false}
            />
          </div>

          <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-8 bg-white border-t">
            <button
              onClick={() => {
                onAdd(selectedExercises);
                onClose();
              }}
              disabled={selectedExercises.length === 0}
              className={`w-full py-3 px-4 rounded-xl text-white font-medium
                ${selectedExercises.length === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
            >
              Add Exercise{selectedExercises.length !== 1 ? 's' : ''} ({selectedExercises.length})
            </button>
          </div>

          <AddExerciseModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onExerciseAdded={(exercise) => {
              addCustomExercise(exercise);
              setIsAddModalOpen(false);
            }}
          />
        </div>
      </div>
    </RemoveScroll>
  );
};