import React, { useState, useEffect } from 'react';
import { Timer, Plus, X, Trash2, Dumbbell, Medal } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { ExerciseSelectionModal } from './ExerciseSelectionModal';
import { WorkoutReview } from './WorkoutReview';
import { WorkoutLog } from '../types/workout';

export const WorkoutSession: React.FC = () => {
  const { 
    currentWorkout, 
    updateWorkoutExercise, 
    completeWorkout,
    deleteExercise,
    addExercisesToWorkout 
  } = useWorkout();
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState(0);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [completedWorkout, setCompletedWorkout] = useState<WorkoutLog | null>(null);
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

  const handleCompleteWorkout = async () => {
    if (currentWorkout) {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(currentWorkout.startTime).getTime();
      const completed = {
        ...currentWorkout,
        name: workoutName,
        endTime,
        duration
      };
      await completeWorkout(workoutName);
      setCompletedWorkout(completed);
    }
  };

  if (!currentWorkout && !completedWorkout) {
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

  if (completedWorkout) {
    return (
      <WorkoutReview
        workout={completedWorkout}
        onClose={() => {
          setCompletedWorkout(null);
          navigate('/');
        }}
      />
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
      const newSet = {
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

  const handleUpdateSet = (exerciseId: string, setId: string, field: string, value: any) => {
    if (!currentWorkout) return;
    const exercise = currentWorkout.exercises.find(e => e.exercise.id === exerciseId);
    if (exercise) {
      let processedValue = value;
      
      if (field === 'weight' || field === 'targetReps') {
        processedValue = Math.max(0, value); // Prevent negative numbers
        if (field === 'weight') {
          processedValue = Math.round(parseFloat(processedValue) * 4) / 4; // Round to nearest 0.25
        }
        if (isNaN(processedValue)) processedValue = 0;
      }

      const updatedSets = exercise.sets.map(set =>
        set.id === setId ? { ...set, [field]: processedValue } : set
      );
      updateWorkoutExercise(exerciseId, {
        ...exercise,
        sets: updatedSets
      });
    }
  };

  const handleAddExercises = (selectedExercises: Exercise[]) => {
    addExercisesToWorkout(selectedExercises);
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
            <div key={exercise.id} className="bg-white rounded-lg shadow-md p-4">
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
                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-5 gap-4 mb-2 text-sm font-medium text-gray-500">
                  <div>Weight (kg)</div>
                  <div>Goal Reps</div>
                  <div>Performed Reps</div>
                  <div>Comments</div>
                  <div>Actions</div>
                </div>

                {sets.map(set => (
                  <div key={set.id}>
                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-5 gap-4 items-center">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        placeholder="Weight"
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        value={set.weight || ''}
                        onChange={(e) => handleUpdateSet(exercise.id, set.id, 'weight', e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Goal Reps"
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        value={set.targetReps || ''}
                        onChange={(e) => handleUpdateSet(exercise.id, set.id, 'targetReps', parseInt(e.target.value))}
                      />
                      <input
                        type="text"
                        placeholder="Performed Reps"
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        value={set.performedReps}
                        onChange={(e) => handleUpdateSet(exercise.id, set.id, 'performedReps', e.target.value)}
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
                          className={`px-3 py-1.5 rounded-md flex items-center space-x-1 transition-all ${
                            set.isPR 
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' 
                              : 'border border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                          }`}
                        >
                          <Medal size={16} />
                          <span>PR</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSet(exercise.id, set.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="text-gray-500">Set {set.setNumber}</div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateSet(exercise.id, set.id, 'isPR', !set.isPR)}
                            className={`px-3 py-1.5 rounded-md flex items-center space-x-1 transition-all ${
                              set.isPR 
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' 
                                : 'border border-yellow-400 text-yellow-600'
                            }`}
                          >
                            <Medal size={16} />
                            <span>PR</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSet(exercise.id, set.id)}
                            className="p-2 text-red-600 rounded-full"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          placeholder="Weight"
                          className="px-3 py-2 border border-gray-300 rounded-md"
                          value={set.weight || ''}
                          onChange={(e) => handleUpdateSet(exercise.id, set.id, 'weight', e.target.value)}
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Goal reps"
                          className="px-3 py-2 border border-gray-300 rounded-md"
                          value={set.targetReps || ''}
                          onChange={(e) => handleUpdateSet(exercise.id, set.id, 'targetReps', parseInt(e.target.value))}
                        />
                        <input
                          type="text"
                          placeholder="Actual reps"
                          className="px-3 py-2 border border-gray-300 rounded-md"
                          value={set.performedReps}
                          onChange={(e) => handleUpdateSet(exercise.id, set.id, 'performedReps', e.target.value)}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Comments"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={set.comments}
                        onChange={(e) => handleUpdateSet(exercise.id, set.id, 'comments', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => handleAddSet(exercise.id)}
                  className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Plus size={20} className="mr-2" />
                  Add Set
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 sticky bottom-4">
        <button
          onClick={handleCompleteWorkout}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-lg"
        >
          Complete Workout
        </button>
      </div>

      {showExerciseModal && (
        <ExerciseSelectionModal
          onClose={() => setShowExerciseModal(false)}
          onAdd={handleAddExercises}
          currentExercises={currentWorkout.exercises.map(e => e.exercise)}
        />
      )}
    </div>
  );
};