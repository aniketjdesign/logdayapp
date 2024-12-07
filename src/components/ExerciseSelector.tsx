import React, { useRef, useState } from 'react';
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

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  customExercises,
  recentExercises,
  allExercises,
  selectedExercises,
  onExerciseSelect,
  onAddCustomExercise,
  currentWorkout,
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

  const filteredCustomExercises = customExercises.filter(exercise => {
    const matchesSearch = !search || exercise.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup;
    return matchesSearch && matchesMuscleGroup;
  });

  const filteredRecentExercises = recentExercises.filter(exercise => {
    const matchesSearch = !search || exercise.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup;
    return matchesSearch && matchesMuscleGroup;
  });

  return (
    <div className="pb-4">
      <div className="px-4">
        <div className="relative mb-5 flex gap-x-2">
          <input
            type="text"
            placeholder="Search exercises"
            className="w-full pl-7 pr-10 py-2 border border-gray-200 rounded-lg text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="absolute left-1 top-1/2 -translate-y-1/2 p-1">
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

        <div className="relative flex justify-evenly pb-2 mb-2 space-x-2">
          {showLeftScroll && (
            <button 
              onClick={() => scrollCategories('left')}
              className="bg-gray-100 rounded-full p-1.5 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-900" />
            </button>
          )}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScrollMuscleGroups}
            className="flex gap-2 overflow-x-auto scrollbar-none"
          >
            {muscleGroups.map(group => (
              <button
                key={group}
                onClick={() => setSelectedMuscleGroup(group)}
                className={`px-3 py-1.5 rounded-full text-sm font-normal transition-all whitespace-nowrap
                  ${selectedMuscleGroup === group
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-100'
                  }`}
              >
                {group}
              </button>
            ))}
          </div>
          {showRightScroll && (
            <button 
              onClick={() => scrollCategories('right')}
              className="bg-gray-100 rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-900" />
            </button>
          )}
        </div>
      </div>

      {/* Custom Exercises Section */}
      {filteredCustomExercises.length > 0 && (
        <div className="bg-white">
          <h2 className="text-xs font-medium px-4 py-2 bg-gray-100 text-gray-500">Your Exercises</h2>
          <div className="space-y-0">
            {filteredCustomExercises.map(exercise => (
              <div
                key={exercise.id}
                onClick={() => !currentWorkout && onExerciseSelect(exercise)}
                className={`flex items-center justify-between px-4 py-2 cursor-pointer border-b
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
                    <Plus size={0} />
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
          <h2 className="text-xs font-medium px-4 py-2 bg-gray-100 text-gray-500">Recent</h2>
          <div className="space-y-0">
            {filteredRecentExercises.map(exercise => (
              <div
                key={exercise.id}
                onClick={() => !currentWorkout && onExerciseSelect(exercise)}
                className={`flex items-center justify-between px-4 py-2 cursor-pointer border-b
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
                    <Plus size={0} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Exercises Section */}
      <div className="bg-white">
        <h2 className="text-xs font-medium px-4 py-2 bg-gray-100 text-gray-500">All Exercises</h2>
        <div className="space-y-0">
          {Object.entries(allExercises)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, exercises]) => {
              const filteredExercises = exercises.filter(exercise => {
                const matchesSearch = !search || exercise.name.toLowerCase().includes(search.toLowerCase());
                const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup;
                return matchesSearch && matchesMuscleGroup;
              });
              
              if (filteredExercises.length === 0) return null;
              
              return (
                <div key={letter}>
                  <div className="px-4 py-1 border-b border-gray-100 bg-gray-50">
                    <span className="text-xs font-medium text-gray-400">{letter}</span>
                  </div>
                  {filteredExercises.map(exercise => (
                    <div
                      key={exercise.id}
                      onClick={() => !currentWorkout && onExerciseSelect(exercise)}
                      className={`flex items-center justify-between px-4 py-2 cursor-pointer border-b
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
                          <Plus size={0} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};