import React, { useState, useMemo, useRef } from 'react';
import { Search, Plus, ChevronUp } from 'lucide-react';
import { Exercise, MuscleGroup } from '../types/workout';
import { exercises } from '../data/exercises';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { generateWorkoutName } from '../utils/workoutNameGenerator';
import { OngoingWorkoutMessage } from './OngoingWorkoutMessage';
import { InstallAppToast } from './InstallAppToast';

export const ExerciseList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const exerciseListRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { selectedExercises, setSelectedExercises, currentWorkout, startWorkout } = useWorkout();

  // Scroll to top button visibility
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 300);
  };

  const scrollToTop = () => {
    exerciseListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const muscleGroups: ('All' | MuscleGroup)[] = [
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

  const filteredExercises = useMemo(() => {
    const searchTerms = search.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return exercises
    .filter(exercise => {
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term =>
        exercise.name.toLowerCase().includes(term) ||
        exercise.muscleGroup.toLowerCase().includes(term) ||
        exercise.category?.toLowerCase().includes(term) ||
        exercise.instruction?.toLowerCase().includes(term)
      );
      const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup;
      const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
      return matchesSearch && matchesMuscleGroup && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  }, [search, selectedMuscleGroup, selectedCategory]);

  // Group exercises by first letter
  const groupedExercises = useMemo(() => {
    const groups: { [key: string]: Exercise[] } = {};
    filteredExercises.forEach(exercise => {
      const firstLetter = exercise.name[0].toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(exercise);
    });
    return groups;
  }, [filteredExercises]);

  const handleStartWorkout = () => {
    if (selectedExercises.length > 0 && !currentWorkout) {
      const workoutName = generateWorkoutName(selectedExercises);
      startWorkout(selectedExercises, workoutName);
      navigate('/workout');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 ">
      {currentWorkout && <OngoingWorkoutMessage />}
      <InstallAppToast />

      <div className="sticky top-0 bg-gray-50 z-10 mb-6 pt-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Quick Start</h1>
        <p className="text-sm text-gray-600 mb-4">Select or search exercises and click Start Workout</p>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search exercises..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={handleStartWorkout}
            disabled={selectedExercises.length === 0 || currentWorkout}
            className={`inline-flex items-center px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap justify-center sm:justify-start ${
              selectedExercises.length === 0 || currentWorkout
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Plus size={20} className="mr-1.5" />
            <span className="text-sm">
              Start Workout ({selectedExercises.length})
            </span>
          </button>
        </div>
        
        <div className="flex flex-col gap-4 mt-4">
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

      <div 
        className="overflow-y-auto max-h-[calc(100vh-16rem)]"
        onScroll={handleScroll}
        ref={exerciseListRef}
      >
        {Object.entries(groupedExercises).map(([letter, exercises]) => (
          <div key={letter} className="mb-6">
            <div className="sticky top-0 bg-gray-100 px-4 py-2 rounded-lg mb-2 z-10">
              <h2 className="text-lg font-semibold text-gray-700">{letter}</h2>
            </div>
            <div className="space-y-2">
              {exercises.map(exercise => (
                <div
                  key={exercise.id}
                  onClick={() => {
                    if (!currentWorkout) {
                      setSelectedExercises(
                        selectedExercises.find(e => e.id === exercise.id)
                          ? selectedExercises.filter(e => e.id !== exercise.id)
                          : [...selectedExercises, exercise]
                      );
                    }
                  }}
                  className={`p-4 rounded-lg transition-all ${
                    currentWorkout 
                      ? 'opacity-50 cursor-not-allowed'
                      : selectedExercises.find(e => e.id === exercise.id)
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-white border border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">{exercise.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs sm:text-sm text-gray-500">
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
        ))}

        {/* Scroll to top button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-20 z-50 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <ChevronUp size={24} />
          </button>
        )}
      </div>
    </div>
  );
};