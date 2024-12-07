import React, { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { Exercise } from '../types/exercise';
import { exercises } from '../data/exercises';
import { ExerciseSelector } from './ExerciseSelector';
import { AddExerciseModal } from './AddExerciseModal';
import { exerciseService } from '../services/exerciseService';

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
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomExercises = async () => {
      try {
        const exercises = await exerciseService.getUserExercises();
        setCustomExercises(exercises);
      } catch (error) {
        console.error('Failed to fetch custom exercises:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomExercises();
  }, []);

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercises(
      selectedExercises.find(e => e.id === exercise.id)
        ? selectedExercises.filter(e => e.id !== exercise.id)
        : [...selectedExercises, exercise]
    );
  };

  const handleCustomExerciseAdded = async (exercise: Exercise) => {
    setCustomExercises(prev => [exercise, ...prev]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full h-[70vh] max-w-md bg-white">
        <div className="flex items-center justify-between p-4 border-b mb-6">
          <h2 className="text-lg font-semibold">Add Exercises</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="h-[calc(100vh-180px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <ExerciseSelector
              customExercises={customExercises}
              recentExercises={[]}
              allExercises={groupedExercises}
              selectedExercises={selectedExercises}
              onExerciseSelect={handleExerciseSelect}
              onAddCustomExercise={() => setIsAddModalOpen(true)}
              currentWorkout={false}
            />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <button
            onClick={() => {
              onAdd(selectedExercises);
              onClose();
            }}
            disabled={selectedExercises.length === 0}
            className={`w-full py-3 px-4 rounded-lg font-medium text-sm
              ${selectedExercises.length === 0
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-600 text-white'
              }`}
          >
            Add {selectedExercises.length} Exercise{selectedExercises.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onExerciseAdded={handleCustomExerciseAdded}
      />
    </div>
  );
};