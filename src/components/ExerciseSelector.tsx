import React, { useRef, useState, useCallback, memo } from 'react';
import { Plus, Check, ChevronLeft, ChevronRight, SearchIcon } from 'lucide-react';
import { Exercise } from '../types/exercise';

interface ExerciseSelectorProps {
  customExercises: Exercise[];
  recentExercises: Exercise[];
  allExercises: { [key: string]: Exercise[] };
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
  onAddCustomExercise?: () => void;
  currentWorkout?: boolean;
  onSelect?: (exercises: Exercise[]) => void;
  stickyTopPosition?: string;
}

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
] as const;

// Memoized muscle group button component to prevent unnecessary re-renders
const MuscleGroupButton = memo(({ 
  group, 
  isSelected, 
  onClick 
}: { 
  group: string; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-normal transition-colors duration-150 whitespace-nowrap
        ${isSelected
          ? 'bg-gray-700 text-white'
          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
    >
      {group}
    </button>
  );
});

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  customExercises,
  recentExercises,
  allExercises,
  selectedExercises,
  onExerciseSelect,
  onAddCustomExercise,
  currentWorkout,
  onSelect,
  stickyTopPosition = 'top-[36px]',
}) => {
  const [search, setSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('All');
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollMuscleGroups = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Memoized handler for muscle group selection
  const handleMuscleGroupSelect = useCallback((group: string) => {
    if (group !== selectedMuscleGroup) {
      setSelectedMuscleGroup(group);
    }
  }, [selectedMuscleGroup]);

  const filteredCustomExercises = customExercises.filter(exercise => {
    const matchesSearch = !search || exercise.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscle_group === selectedMuscleGroup;
    return matchesSearch && matchesMuscleGroup;
  });

  const filteredRecentExercises = recentExercises
    .filter(exercise => {
      // Check if exercise still exists in either custom or default exercises
      const existsInCustom = customExercises.some(e => e.id === exercise.id);
      const existsInDefault = Object.values(allExercises).some(
        exercises => exercises.some(e => e.id === exercise.id)
      );
      const matchesSearch = !search || exercise.name.toLowerCase().includes(search.toLowerCase());
      const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup;
      return (existsInCustom || existsInDefault) && matchesSearch && matchesMuscleGroup;
    })
    .slice(0, 8); // Limit to 8 most recent exercises

  const getFilteredExercises = () => {
    const defaultExercises = Object.entries(allExercises)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((acc, [letter, exercises]) => {
        const filtered = exercises.filter(exercise => {
          const matchesSearch = !search || exercise.name.toLowerCase().includes(search.toLowerCase());
          const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup;
          return matchesSearch && matchesMuscleGroup;
        });
        if (filtered.length > 0) {
          acc[letter] = filtered;
        }
        return acc;
      }, {} as typeof allExercises);

    return defaultExercises;
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50 pb-24">
      <div className="flex-1 bg-white">
        <div className={`px-4 pt-3 pb-4 bg-gray-50 sticky ${stickyTopPosition}`}>
          <div className="relative mb-5 flex gap-x-2">
            <input
              type="text"
              placeholder="Search exercises"
              className="w-full pl-7 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}  
            />
            <button 
              className="absolute left-1 top-[1.15rem] -translate-y-1/2 p-1"
            >
              <SearchIcon size={16} className="text-gray-400" />
            </button>
            {onAddCustomExercise && (
              <button 
                className="py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded-lg" 
                onClick={onAddCustomExercise}
              >
                <Plus size={16} className="text-gray-900" />
              </button>
            )}
          </div>

          <div className="relative flex justify-evenly space-x-2">
            {showLeftScroll && (
              <button 
                onClick={() => scrollCategories('left')}
                className="bg-gray-100 rounded-full p-1.5 hover:bg-gray-100 transition-colors h-[32px]"
              >
                <ChevronLeft size={16} className="text-gray-900" />
              </button>
            )}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScrollMuscleGroups}
              className="flex gap-2 overflow-x-auto scrollbar-none pb-3"
            >
              {muscleGroups.map(group => (
                <MuscleGroupButton
                  key={group}
                  group={group}
                  isSelected={selectedMuscleGroup === group}
                  onClick={() => handleMuscleGroupSelect(group)}
                />
              ))}
            </div>
            {showRightScroll && (
              <button 
                onClick={() => scrollCategories('right')}
                className="bg-gray-100 rounded-full p-1 hover:bg-gray-100 transition-colors h-[32px]"
              >
                <ChevronRight size={16} className="text-gray-900" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Exercises Section */}
        {filteredCustomExercises.length > 0 && (
          <div className="bg-white">
            <h2 className="text-xs font-medium px-4 py-2 bg-gray-100 text-gray-500">
              Your Exercises
            </h2>
            <div className="space-y-0">
              {filteredCustomExercises.map(exercise => (
                <div
                  key={exercise.id}
                  onClick={() => !currentWorkout && onExerciseSelect(exercise)}
                  className={`flex items-center justify-between cursor-pointer border-b px-4 py-2.5 
                    ${selectedExercises.find(e => e.id === exercise.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'border-gray-100 hover:bg-gray-50'
                    }`}
                >
                  <div>
                    <h3 className="text-sm font-medium">{exercise.name}</h3>
                    <p className="text-xs text-gray-500">{exercise.muscle_group}</p>
                  </div>
                  <div className={`${selectedExercises.find(e => e.id === exercise.id) ? 'text-blue-600' : 'text-gray-500'}`}>
                    {selectedExercises.find(e => e.id === exercise.id) ? (
                      <Check size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Exercises Section */}
        {filteredRecentExercises.length > 0 && (
          <div className="bg-white">
            <h2 className="text-xs font-medium px-4 py-2 bg-gray-100 text-gray-500">
              Recent
            </h2>
            <div className="space-y-0">
              {filteredRecentExercises.map(exercise => (
                <div
                  key={exercise.id}
                  onClick={() => !currentWorkout && onExerciseSelect(exercise)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b
                    ${selectedExercises.find(e => e.id === exercise.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'border-gray-100 hover:bg-gray-50'
                    }`}
                >
                  <div>
                    <h3 className="text-sm font-medium">{exercise.name}</h3>
                    <p className="text-xs text-gray-500">{exercise.muscleGroup}</p>
                  </div>
                  <div className={`${selectedExercises.find(e => e.id === exercise.id) ? 'text-blue-600' : 'text-gray-500'}`}>
                    {selectedExercises.find(e => e.id === exercise.id) ? (
                      <Check size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Default Exercises Section */}
        {Object.entries(getFilteredExercises()).map(([letter, exercises], index) => (
          <div key={letter} className="bg-white">
            <h2 className="text-xs font-medium px-4 py-2 bg-gray-100 text-gray-500">
              {letter}
            </h2>
            <div className="space-y-0">
              {exercises.map(exercise => (
                <div
                  key={exercise.id}
                  onClick={() => !currentWorkout && onExerciseSelect(exercise)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b
                    ${selectedExercises.find(e => e.id === exercise.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'border-gray-100 hover:bg-gray-50'
                    }`}
                >
                  <div>
                    <h3 className="text-sm font-medium">{exercise.name}</h3>
                    <p className="text-xs text-gray-500">{exercise.muscleGroup}</p>
                  </div>
                  <div className={`${selectedExercises.find(e => e.id === exercise.id) ? 'text-blue-600' : 'text-gray-500'}`}>
                    {selectedExercises.find(e => e.id === exercise.id) ? (
                      <Check size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Button */}
      {onSelect && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <button
            onClick={() => onSelect(selectedExercises)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            Add exercises ({selectedExercises.length})
          </button>
        </div>
      )}
    </div>
  );
};