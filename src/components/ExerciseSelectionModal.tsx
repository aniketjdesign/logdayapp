import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Exercise, MuscleGroup } from '../types/workout';
import { exercises } from '../data/exercises';

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
  const [search, setSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const muscleGroups: ('All' | MuscleGroup)[] = [
    'All',
    'Shoulders',
    'Chest',
    'Back',
    'Quads',
    'Hamstrings',
    'Triceps',
    'Biceps',
    'Forearms',
    'Glutes',
    'Calves',
    'Core',
    'Cardio',
    'Olympic Lifts'
  ];

  const categories = useMemo(() => {
    const cats = new Set<string>();
    exercises.forEach(exercise => {
      if (exercise.category) {
        cats.add(exercise.category);
      }
    });
    return ['All', ...Array.from(cats)].sort();
  }, []);

  const toggleExerciseSelection = (exercise: Exercise) => {
    setSelectedExercises(prev => 
      prev.find(e => e.id === exercise.id)
        ? prev.filter(e => e.id !== exercise.id)
        : [...prev, exercise]
    );
  };

  const handleAddExercises = () => {
    onAdd(selectedExercises);
    setSelectedExercises([]);
  };

  const filteredExercises = exercises
    .filter(e => !currentExercises.some(ce => ce.id === e.id))
    .filter(exercise => {
      const searchTerms = search.toLowerCase().split(' ').filter(term => term.length > 0);
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term =>
        exercise.name.toLowerCase().includes(term) ||
        exercise.muscleGroup.toLowerCase().includes(term) ||
        exercise.category?.toLowerCase().includes(term) ||
        exercise.instruction?.toLowerCase().includes(term)
      );
      const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup;
      const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
      return matchesSearch && matchesMuscleGroup && matchesCategory;
    });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50">
      {/* Desktop View */}
      <div className="hidden md:block max-w-lg w-full bg-white rounded-lg overflow-auto m-4 max-h-[80vh]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Add Exercises</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search exercises (e.g. 'dumbbell chest press')"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-4">
              {/* Muscle Groups Filter */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
                {muscleGroups.map(group => (
                  <button
                    key={group}
                    onClick={() => setSelectedMuscleGroup(group)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors
                      ${selectedMuscleGroup === group
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {group}
                  </button>
                ))}
              </div>

              {/* Categories Filter */}
              {categories.length > 1 && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors
                        ${selectedCategory === category
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                onClick={() => toggleExerciseSelection(exercise)}
                className={`p-4 rounded-lg cursor-pointer transition-all
                  ${selectedExercises.find(e => e.id === exercise.id)
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                <div className="font-medium">{exercise.name}</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-sm text-gray-600">
                    {exercise.instruction || exercise.muscleGroup}
                  </span>
                  {exercise.category && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                      {exercise.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t bg-white">
          <button
            onClick={handleAddExercises}
            disabled={selectedExercises.length === 0}
            className={`w-full py-3 rounded-lg font-medium transition-colors
              ${selectedExercises.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
          >
            Add Selected ({selectedExercises.length})
          </button>
        </div>
      </div>

      {/* Mobile View - Curtain Style */}
      <div className="md:hidden w-full h-[85vh] bg-white rounded-t-xl fixed bottom-0 flex flex-col animate-slide-up">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold">Add Exercises</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search exercises..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-4">
            {/* Muscle Groups Filter */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
              {muscleGroups.map(group => (
                <button
                  key={group}
                  onClick={() => setSelectedMuscleGroup(group)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors
                    ${selectedMuscleGroup === group
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {group}
                </button>
              ))}
            </div>


          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-2">
            {filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                onClick={() => toggleExerciseSelection(exercise)}
                className={`p-4 rounded-lg cursor-pointer transition-all
                  ${selectedExercises.find(e => e.id === exercise.id)
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                <div className="font-medium">{exercise.name}</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-sm text-gray-600">
                    {exercise.instruction || exercise.muscleGroup}
                  </span>
                  {exercise.category && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                      {exercise.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t bg-white">
          <button
            onClick={handleAddExercises}
            disabled={selectedExercises.length === 0}
            className={`w-full py-3 rounded-lg font-medium transition-colors
              ${selectedExercises.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
          >
            Add Selected ({selectedExercises.length})
          </button>
        </div>
      </div>
    </div>
  );
};