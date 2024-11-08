import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertCircle, Plus } from 'lucide-react';
import { Exercise, MuscleGroup } from '../types/workout';
import { exercises } from '../data/exercises';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';

export const ExerciseList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'All'>('All');
  const [showTooltip, setShowTooltip] = useState(false);
  const { selectedExercises, setSelectedExercises, currentWorkout, startWorkout } = useWorkout();
  const navigate = useNavigate();

  const muscleGroups: ('All' | MuscleGroup)[] = [
    'All',
    'Chest',
    'Back',
    'Shoulders',
    'Quads',
    'Hamstrings',
    'Triceps',
    'Biceps',
    'Glutes',
    'Calves',
    'Core'
  ];

  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
      const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscleGroup === selectedMuscleGroup;
      return matchesSearch && matchesMuscleGroup;
    });
  }, [search, selectedMuscleGroup]);

  const toggleExercise = (exercise: Exercise) => {
    if (currentWorkout) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }

    setSelectedExercises(
      selectedExercises.find(e => e.id === exercise.id)
        ? selectedExercises.filter(e => e.id !== exercise.id)
        : [...selectedExercises, exercise]
    );
  };

  const handleStartWorkout = () => {
    if (selectedExercises.length > 0 && !currentWorkout) {
      startWorkout(selectedExercises);
      navigate('/workout');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {showTooltip && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-fade-in">
          <AlertCircle size={20} />
          <span>Workout in progress. Please finish current workout first.</span>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search exercises..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={handleStartWorkout}
            disabled={selectedExercises.length === 0 || currentWorkout}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              selectedExercises.length === 0 || currentWorkout
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Plus size={20} className="mr-1" />
            Start Workout {selectedExercises.length > 0 && `(${selectedExercises.length})`}
          </button>
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter size={20} className="text-gray-500 flex-shrink-0" />
          {muscleGroups.map(group => (
            <button
              key={group}
              onClick={() => setSelectedMuscleGroup(group)}
              className={`px-4 py-2 rounded-3xl text-sm font-medium whitespace-nowrap flex-shrink-0
                ${selectedMuscleGroup === group
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredExercises.map(exercise => (
          <div
            key={exercise.id}
            onClick={() => toggleExercise(exercise)}
            className={`p-4 rounded-lg cursor-pointer transition-all ${
              currentWorkout 
                ? 'opacity-50 cursor-not-allowed'
                : selectedExercises.find(e => e.id === exercise.id)
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-white border border-gray-200 hover:border-blue-300'
            }`}
          >
            <h3 className="font-medium text-gray-900">{exercise.name}</h3>
            <span className="text-sm text-gray-500">{exercise.muscleGroup}</span>
          </div>
        ))}
      </div>
    </div>
  );
};