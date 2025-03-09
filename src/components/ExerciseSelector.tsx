import React, { useRef, useState } from 'react';
import { Plus, Check, ChevronLeft, ChevronRight, SearchIcon } from 'lucide-react';
import { motion } from 'framer-motion';
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
  onSelect,
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

  // Staggered animation for list items - optimized for faster transitions
  const containerVariants = {
    hidden: { opacity: 0.9 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.005 // Minimal stagger time for faster transitions
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0.9, y: 2 }, // Minimal initial offset
    visible: { opacity: 1, y: 0, transition: { duration: 0.08 } } // Very fast animation
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto pb-80 bg-white ">
        <motion.div className="px-4 bg-gray-50">
          <motion.div 
            initial={{ opacity: 0.9, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.1 }}
            className="relative mb-5 flex gap-x-2 pt-3">
            <input
              type="text"
              placeholder="Search exercises"
              className="w-full pl-7 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}  
            />
            <motion.button 
              className="absolute left-1 top-[1.9rem] -translate-y-1/2 p-1"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <SearchIcon size={16} className="text-gray-400" />
            </motion.button>
            {onAddCustomExercise && (
              <motion.button 
                className="py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded-lg" 
                onClick={onAddCustomExercise}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={16} className="text-gray-900" />
              </motion.button>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0.9, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.1, delay: 0.02 }}
            className="relative flex justify-evenly pb-4 space-x-2">
            {showLeftScroll && (
              <motion.button 
                onClick={() => scrollCategories('left')}
                className="bg-gray-100 rounded-full p-1.5 hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft size={16} className="text-gray-900" />
              </motion.button>
            )}
            <motion.div 
              ref={scrollContainerRef}
              onScroll={handleScrollMuscleGroups}
              className="flex gap-2 overflow-x-auto scrollbar-none pb-3"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1, delay: 0.03 }}
            >
              {muscleGroups.map(group => (
                <motion.button
                  key={group}
                  onClick={() => setSelectedMuscleGroup(group)}
                  className={`px-3 py-1.5 rounded-full text-sm font-normal transition-all whitespace-nowrap
                    ${selectedMuscleGroup === group
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-100'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={selectedMuscleGroup === group ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.2 }}
                >
                  {group}
                </motion.button>
              ))}
            </motion.div>
            {showRightScroll && (
              <motion.button 
                onClick={() => scrollCategories('right')}
                className="bg-gray-100 rounded-full p-1 hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight size={16} className="text-gray-900" />
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* Custom Exercises Section */}
        {filteredCustomExercises.length > 0 && (
          <motion.div 
            className="bg-white"
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.08, delay: 0.02 }}
          >
            <motion.h2 
              className="text-xs font-medium px-4 py-2 bg-gray-100 text-gray-500"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              Your Exercises
            </motion.h2>
            <motion.div 
              className="space-y-0"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredCustomExercises.map(exercise => (
                <motion.div
                  key={exercise.id}
                  onClick={() => !currentWorkout && onExerciseSelect(exercise)}
                  className={`flex items-center justify-between cursor-pointer border-b px-4 py-2.5 
                    ${selectedExercises.find(e => e.id === exercise.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  variants={itemVariants}
                  whileHover={{ backgroundColor: selectedExercises.find(e => e.id === exercise.id) ? '#e6f0ff' : '#f9fafb' }}
                  whileTap={{ scale: 0.98 }}
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
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Recent Exercises Section */}
        {filteredRecentExercises.length > 0 && (
          <motion.div 
            className="bg-white"
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.08, delay: 0.02 }}
          >
            <motion.h2 
              className="text-xs font-medium px-4 py-2 bg-gray-100 text-gray-500"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              Recent
            </motion.h2>
            <motion.div 
              className="space-y-0"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredRecentExercises.map(exercise => (
                <motion.div
                  key={exercise.id}
                  onClick={() => !currentWorkout && onExerciseSelect(exercise)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b
                    ${selectedExercises.find(e => e.id === exercise.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  variants={itemVariants}
                  whileHover={{ backgroundColor: selectedExercises.find(e => e.id === exercise.id) ? '#e6f0ff' : '#f9fafb' }}
                  whileTap={{ scale: 0.98 }}
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
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Default Exercises Section */}
        {Object.entries(getFilteredExercises()).map(([letter, exercises], index) => (
          <motion.div 
            key={letter} 
            className="bg-white"
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.08, delay: 0.02 + (index * 0.005) }}
          >
            <motion.h2 
              className="text-xs font-medium px-4 py-2 bg-gray-100 text-gray-500"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              {letter}
            </motion.h2>
            <motion.div 
              className="space-y-0"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {exercises.map(exercise => (
                <motion.div
                  key={exercise.id}
                  onClick={() => !currentWorkout && onExerciseSelect(exercise)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b
                    ${selectedExercises.find(e => e.id === exercise.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  variants={itemVariants}
                  whileHover={{ backgroundColor: selectedExercises.find(e => e.id === exercise.id) ? '#e6f0ff' : '#f9fafb' }}
                  whileTap={{ scale: 0.98 }}
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
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Button */}
      {onSelect && (
        <motion.div 
          className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t"
          initial={{ y: 10, opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.15, delay: 0.1 }}
        >
          <motion.button
            onClick={() => onSelect(selectedExercises)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add exercises ({selectedExercises.length})
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};