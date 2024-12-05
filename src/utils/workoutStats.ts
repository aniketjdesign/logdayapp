import { WorkoutLog } from '../types/workout';

export const calculateWorkoutStats = (workout: WorkoutLog) => {
  let totalVolume = 0;
  let totalSets = 0;
  let totalPRs = 0;

  workout.exercises.forEach(({ exercise, sets }) => {
    const isBodyweight = exercise.name.includes('(Bodyweight)');
    const isCardio = exercise.muscleGroup === 'Cardio';

    sets.forEach(set => {
      // Count total sets
      totalSets++;

      // Count PRs
      if (set.isPR) {
        totalPRs++;
      }

      // Calculate volume for non-cardio, non-bodyweight exercises
      if (!isCardio && !isBodyweight && set.weight && set.performedReps) {
        const reps = parseInt(set.performedReps);
        if (!isNaN(reps)) {
          totalVolume += set.weight * reps;
        }
      }
    });
  });

  return {
    totalVolume: Math.round(totalVolume),
    totalSets,
    totalPRs
  };
};