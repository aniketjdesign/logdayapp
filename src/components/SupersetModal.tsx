import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Exercise, WorkoutExercise } from '../types/workout';

interface SupersetModalProps {
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
  exercises: WorkoutExercise[];
  currentExerciseId: string;
}

export const SupersetModal: React.FC<SupersetModalProps> = ({
  onClose,
  onSelect,
  exercises,
  currentExerciseId
}) => {
  const [search, setSearch] = useState('');

  const filteredExercises = exercises.filter(({ exercise, supersetWith }) => {
    // Don't show current exercise or exercises already in superset
    if (exercise.id === currentExerciseId || supersetWith) {
      return false;
    }

    const searchTerm = search.toLowerCase();
    return exercise.name.toLowerCase().includes(searchTerm) ||
           exercise.muscleGroup.toLowerCase().includes(searchTerm);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl animate-slide-up h-[75vh] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">Select Exercise for Superset</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search exercises..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No available exercises for superset
            </div>
          ) : (
            <div className="divide-y">
              {filteredExercises.map(({ exercise }) => (
                <button
                  key={exercise.id}
                  onClick={() => onSelect(exercise.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex flex-col"
                >
                  <span className="font-medium">{exercise.name}</span>
                  <span className="text-sm text-gray-500">{exercise.muscleGroup}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};