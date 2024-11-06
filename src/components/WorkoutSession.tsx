import React, { useState, useEffect } from 'react';
import { Star, Timer, Plus, X, Trash2, Dumbbell } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { WorkoutSet, Exercise } from '../types/workout';
import { exercises } from '../data/exercises';
import { useNavigate } from 'react-router-dom';

export const WorkoutSession: React.FC = () => {
  const { 
    currentWorkout, 
    updateWorkoutExercise, 
    completeWorkout,
    deleteExercise 
  } = useWorkout();
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState(0);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentWorkout?.startTime) {
        const elapsed = Math.floor((Date.now() - new Date(currentWorkout.startTime).getTime()) / 1000);
        setDuration(elapsed);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentWorkout?.startTime]);

  if (!currentWorkout) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <Dumbbell className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No active workout</h3>
          <p className="text-gray-500 mb-6">Select exercises to start your workout session</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Select Exercises
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddSet = (exerciseId: string) => {
    const exercise = currentWorkout.exercises.find(e => e.exercise.id === exerciseId);
    if (exercise) {
      const newSet: WorkoutSet = {
        id: Date.now().toString(),
        setNumber: exercise.sets.length + 1,
        targetReps: 0,
        performedReps: '',
        weight: 0,
        comments: '',
        isPR: false
      };
      updateWorkoutExercise(exerciseId, {
        ...exercise,
        sets: [...exercise.sets, newSet]
      });
    }
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    const exercise = currentWorkout.exercises.find(e => e.exercise.id === exerciseId);
    if (exercise) {
      const updatedSets = exercise.sets.filter(set => set.id !== setId);
      const renumberedSets = updatedSets.map((set, index) => ({
        ...set,
        setNumber: index + 1
      }));
      updateWorkoutExercise(exerciseId, {
        ...exercise,
        sets: renumberedSets
      });
    }
  };

  const handleUpdateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => {
    if (!currentWorkout) return;
    const exercise = currentWorkout.exercises.find(e => e.exercise.id === exerciseId);
    if (exercise) {
      const updatedSets = exercise.sets.map(set =>
        set.id === setId ? { ...set, [field]: value } : set
      );
      updateWorkoutExercise(exerciseId, {
        ...exercise,
        sets: updatedSets
      });
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise = {
      exercise,
      sets: [{
        id: Date.now().toString(),
        setNumber: 1,
        targetReps: 0,
        performedReps: '',
        weight: 0,
        comments: '',
        isPR: false
      }]
    };
    updateWorkoutExercise(exercise.id, newExercise);
    setShowExerciseModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Timer size={24} className="text-gray-500" />
            <span className="text-2xl font-bold">{formatTime(duration)}</span>
          </div>
          <button
            onClick={() => setShowExerciseModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} className="mr-2" />
            Add Exercise
          </button>
        </div>
        <input
          type="text"
          placeholder="Workout Name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
        />
      </div>

      {currentWorkout.exercises.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="flex justify-center mb-4">
            <Dumbbell className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No exercises in your workout</h3>
          <p className="text-gray-500 mb-6">Add some exercises to continue your workout</p>
          <button
            onClick={() => setShowExerciseModal(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={20} className="mr-2" />
            Add Exercises
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {currentWorkout.exercises.map(({ exercise, sets }) => (
            <div key={exercise.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{exercise.name}</h3>
                <button
                  onClick={() => deleteExercise(exercise.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="space-y-4">
                {sets.map(set => (
                  <div key={set.id} className="grid grid-cols-6 gap-4 items-center">
                    <div className="text-gray-500">Set {set.setNumber}</div>
                    <input
                      type="number"
                      placeholder="Target"
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      value={set.targetReps || ''}
                      onChange={(e) => handleUpdateSet(exercise.id, set.id, 'targetReps', parseInt(e.target.value) || 0)}
                    />
                    <input
                      type="text"
                      placeholder="Actual"
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      value={set.performedReps}
                      onChange={(e) => handleUpdateSet(exercise.id, set.id, 'performedReps', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Weight (kg)"
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      value={set.weight || ''}
                      onChange={(e) => handleUpdateSet(exercise.id, set.id, 'weight', parseInt(e.target.value) || 0)}
                    />
                    <input
                      type="text"
                      placeholder="Comments"
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      value={set.comments}
                      onChange={(e) => handleUpdateSet(exercise.id, set.id, 'comments', e.target.value)}
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateSet(exercise.id, set.id, 'isPR', !set.isPR)}
                        className={`p-2 rounded-full ${set.isPR ? 'text-yellow-500' : 'text-gray-400'}`}
                      >
                        <Star size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteSet(exercise.id, set.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => handleAddSet(exercise.id)}
                  className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Plus size={20} className="mr-2" />
                  Add Set
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => completeWorkout(workoutName)}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Complete Workout
        </button>
      </div>

      {showExerciseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Add Exercise</h3>
                <button
                  onClick={() => setShowExerciseModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-2">
                {exercises
                  .filter(e => !currentWorkout.exercises.some(ce => ce.exercise.id === e.id))
                  .map(exercise => (
                    <button
                      key={exercise.id}
                      onClick={() => handleAddExercise(exercise)}
                      className="w-full p-4 text-left hover:bg-gray-50 rounded-lg"
                    >
                      <div className="font-medium">{exercise.name}</div>
                      <div className="text-sm text-gray-500">{exercise.muscleGroup}</div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};