import React, { useRef, useState, useCallback, memo, useMemo } from 'react';
import { Plus, Check, ChevronLeft, ChevronRight, SearchIcon } from 'lucide-react';
import { Exercise } from '../types/exercise';
import Fuse from 'fuse.js';

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

  // Configure Fuse.js options
  const fuseOptions = useMemo(() => ({
    includeScore: true,
    threshold: 0.4, // Lower threshold means more strict matching
    keys: ['name', 'aliases'],
    isCaseSensitive: false
  }), []);

  // Create Fuse instances for different exercise collections
  const customExercisesFuse = useMemo(() => 
    new Fuse(customExercises, fuseOptions),
    [customExercises, fuseOptions]
  );

  const recentExercisesFuse = useMemo(() => 
    new Fuse(recentExercises, fuseOptions),
    [recentExercises, fuseOptions]
  );

  const allExercisesFuse = useMemo(() => {
    // Create a flat array of all exercises for fuzzy search
    const allExercisesFlat = Object.values(allExercises).flat();
    return new Fuse(allExercisesFlat, fuseOptions);
  }, [allExercises, fuseOptions]);

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

  const filteredCustomExercises = useMemo(() => {
    if (!search) {
      return customExercises.filter(exercise => 
        selectedMuscleGroup === 'All' || exercise.muscle_group === selectedMuscleGroup
      );
    }
    
    return customExercisesFuse.search(search)
      .map(result => result.item)
      .filter(exercise => 
        selectedMuscleGroup === 'All' || exercise.muscle_group === selectedMuscleGroup
      );
  }, [search, customExercises, customExercisesFuse, selectedMuscleGroup]);

  const filteredRecentExercises = useMemo(() => {
    // First filter exercises that still exist
    const existingExercises = recentExercises.filter(exercise => {
      const existsInCustom = customExercises.some(e => e.id === exercise.id);
      const existsInDefault = Object.values(allExercises).some(
        exercises => exercises.some(e => e.id === exercise.id)
      );
      return existsInCustom || existsInDefault;
    });
    
    // Then apply search and muscle group filters
    let filtered = existingExercises;
    
    // Apply muscle group filter
    filtered = filtered.filter(exercise => 
      selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup
    );
    
    // Apply fuzzy search if there's a search term
    if (search) {
      const fuseResults = recentExercisesFuse.search(search);
      const matchedIds = new Set(fuseResults.map(result => result.item.id));
      filtered = filtered.filter(exercise => matchedIds.has(exercise.id));
    }
    
    return filtered.slice(0, 8); // Limit to 8 most recent exercises
  }, [search, recentExercises, recentExercisesFuse, selectedMuscleGroup, customExercises, allExercises]);

  const getFilteredExercises = useCallback(() => {
    // If no search, just filter by muscle group
    if (!search) {
      return Object.entries(allExercises)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce((acc, [letter, exercises]) => {
          const filtered = exercises.filter(exercise => 
            selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup
          );
          if (filtered.length > 0) {
            acc[letter] = filtered;
          }
          return acc;
        }, {} as typeof allExercises);
    }
    
    // With search, use fuzzy search and then organize by first letter
    const searchResults = allExercisesFuse.search(search)
      .map(result => result.item)
      .filter(exercise => 
        selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup
      );
    
    // Group results by first letter of name
    return searchResults.reduce((acc, exercise) => {
      const letter = exercise.name[0].toUpperCase();
      if (!acc[letter]) {
        acc[letter] = [];
      }
      acc[letter].push(exercise);
      return acc;
    }, {} as Record<string, Exercise[]>);
  }, [search, allExercises, allExercisesFuse, selectedMuscleGroup]);

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
                  onClick={() => onExerciseSelect(exercise)}
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
                  onClick={() => onExerciseSelect(exercise)}
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
        {Object.entries(getFilteredExercises()).map(entry => {
          const letter = entry[0];
          const exercises = entry[1] as Exercise[];
          return (
            <div key={letter} className="bg-white">
              <h2 className="text-xs font-medium px-4 py-2 bg-gray-100 text-gray-500">
                {letter}
              </h2>
              <div className="space-y-0">
                {exercises.map((exercise: Exercise) => (
                  <div
                    key={exercise.id}
                    onClick={() => onExerciseSelect(exercise)}
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
          );
        })}
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