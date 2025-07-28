import { WorkoutLog } from '../types/workout';

export const calculateWorkoutStats = (workout: WorkoutLog, weightUnit: 'lbs' | 'kgs' = 'lbs', convertWeight?: (weight: number, from: 'lbs' | 'kgs', to: 'lbs' | 'kgs') => number) => {
  let totalVolume = 0;
  let totalSets = 0;
  let totalPRs = 0;
  let totalDistance = 0;
  let totalTime = 0;

  workout.exercises.forEach(({ exercise, sets }) => {
    const isBodyweight = exercise.name.includes('(Bodyweight)');
    const isCardio = exercise.muscleGroup === 'Cardio';
    const isDumbbell = exercise.name.toLowerCase().includes('dumbbell');
    
    // Exceptions to the dumbbell multiplication rule
    const isDumbbellException = 
      exercise.name.includes('Weight Lying Raises') || 
      exercise.name.includes('Sumo Dumbbell Squats');

    sets.forEach(set => {
      if (isCardio) {
        if (set.distance) totalDistance += set.distance;
        if (set.time) {
          const [minutes = 0, seconds = 0] = set.time.split(':').map(Number);
          totalTime += minutes * 60 + seconds;
        }
      } else if (!isBodyweight && set.weight && set.performedReps) {
        // All weights are stored in kgs, so convert if user's preference is lbs
        const weight = weightUnit === 'lbs' && convertWeight ? convertWeight(set.weight, 'kgs', 'lbs') : set.weight;
        const reps = parseInt(set.performedReps) || 0;
        
        // Multiply by 2 for dumbbell exercises (except exceptions)
        if (isDumbbell && !isDumbbellException) {
          totalVolume += weight * reps * 2; // Multiply by 2 for dumbbells (both arms)
        } else {
          totalVolume += weight * reps;
        }
      }
      totalSets++;
      if (set.isPR) totalPRs++;
    });
  });

  return {
    totalVolume: Math.round(totalVolume),
    totalSets,
    totalPRs,
    totalDistance,
    totalTime
  };
};