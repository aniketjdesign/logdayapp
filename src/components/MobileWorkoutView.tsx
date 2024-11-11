// ... previous imports remain the same

export const MobileWorkoutView: React.FC<MobileWorkoutViewProps> = ({
  workout,
  duration,
  workoutName,
  onNameChange,
  onUpdateSet,
  onDeleteSet,
  onAddSet: parentOnAddSet,
  onDeleteExercise,
  onShowExerciseModal,
  onCompleteWorkout,
  onCancelWorkout,
}) => {
  // ... previous state declarations remain the same

  const handleAddSet = (exerciseId: string) => {
    const exercise = workout.exercises.find(e => e.exercise.id === exerciseId);
    if (exercise) {
      // Get the last set's values or use defaults if no sets exist
      const lastSet = exercise.sets.length > 0 
        ? exercise.sets[exercise.sets.length - 1]
        : { targetReps: 0, weight: 0 };

      const newSet = {
        id: Date.now().toString(),
        setNumber: exercise.sets.length + 1,
        targetReps: lastSet.targetReps,
        performedReps: '',
        weight: lastSet.weight,
        comments: '',
        isPR: false
      };
      parentOnAddSet(exerciseId);
    }
  };

  // ... rest of the component remains the same
};

export default MobileWorkoutView;