export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  targetReps: number;
  performedReps: string;
  weight: number;
  comments: string;
  isPR: boolean;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface WorkoutLog {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  startTime: string;
  endTime: string;
  duration: number;
}

export type MuscleGroup = 
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Quads'
  | 'Hamstrings'
  | 'Triceps'
  | 'Biceps'
  | 'Glutes'
  | 'Calves'
  | 'Core';