import React, { useState } from 'react';
import { Plus, SearchIcon } from 'lucide-react';
import { Exercise } from '../../types/exercise';
import { useWorkout } from '../../context/WorkoutContext';

interface ExerciseSelectorProps {
  selectedExercises: Exercise[];
  onExercisesChange: (exercises: Exercise[]) => void;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  selectedExercises,
  onExercisesChange,
}) => {
  const { customExercises } = useWorkout();
  const [search, setSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('All');

  const muscleGroups = [
    'All',
    'Chest',
    'Back',
    'Shoulders',
    'Quads',
    'Hamstrings',
    'Triceps',
    'Biceps',
    'Forearms',
    'Glutes',
    'Calves',
    'Core',
    'Cardio',
    'Olympic Lifts',
  ];

  const allExercises = [...customExercises];

  const filteredExercises = allExercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscleGroup =
      selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup;
    return matchesSearch && matchesMuscleGroup;
  });

  const handleExerciseSelect = (exercise: Exercise) => {
    const isSelected = selectedExercises.some((e) => e.id === exercise.id);
    if (isSelected) {
      onExercisesChange(selectedExercises.filter((e) => e.id !== exercise.id));
    } else {
      onExercisesChange([...selectedExercises, exercise]);
    }
  };

  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <SearchIcon
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex p-2 space-x-2">
          {muscleGroups.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedMuscleGroup(group)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedMuscleGroup === group
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto">
        <div className="p-2 space-y-1">
          {filteredExercises.map((exercise) => {
            const isSelected = selectedExercises.some((e) => e.id === exercise.id);
            return (
              <button
                key={exercise.id}
                onClick={() => handleExerciseSelect(exercise)}
                className={`w-full px-3 py-2 rounded-lg text-left flex items-center justify-between ${
                  isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="font-medium">{exercise.name}</div>
                  <div className="text-sm text-gray-500">{exercise.muscleGroup}</div>
                </div>
                {isSelected ? (
                  <Plus size={20} className="transform rotate-45" />
                ) : (
                  <Plus size={20} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
