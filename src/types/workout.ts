export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  category?: string;
  instruction?: string;
  aliases?: string[]; // Array of alternative names for the exercise
  metrics?: ExerciseMetrics;
  restTimer?: {
    enabled: boolean;
    duration: number;
  };
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  targetReps?: number;
  performedReps?: string;
  weight?: number;
  comments: string;
  isPR: boolean;
  // New set type flags
  isWarmup: boolean;
  isDropset: boolean;
  isFailure: boolean;
  // Cardio specific metrics
  time?: string;
  distance?: number;
  difficulty?: number;
  incline?: number;
  pace?: string;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: WorkoutSet[];
  supersetWith?: string; // ID of the exercise this is supersetted with
}

export interface WorkoutLog {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  startTime: string;
  endTime: string;
  duration: number;
  restTimerSettings?: { [key: string]: boolean };
  workoutRestTimer?: boolean;
  workoutRestTimerOverride?: boolean;
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
  | 'Core'
  | 'Cardio'
  | 'Forearms'
  | 'Olympic Lifts';

export interface ExerciseMetrics {
  time: boolean;
  distance?: boolean;
  difficulty?: boolean;
  incline?: boolean;
  pace?: boolean;
  reps?: boolean;
}

export interface WorkoutPreferences {
  id: string;
  user_id: string;
  history_period_days: number;
  disable_rest_timer?: boolean;
  default_home_page?: 'routines' | 'exercises';
  created_at?: string;
  updated_at?: string;
}

export interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at?: string;
}

export interface Routine {
  id?: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  user_id?: string;
  folder_id: string | null;
  total_exercises?: number;
  total_sets?: number;
  created_at?: string;
  updated_at?: string;
}

export interface RoutineExercise {
  exercise: Exercise;
  sets: RoutineSet[];
}

export interface RoutineSet {
  id: string;
  setNumber: number;
  targetReps: number;
  weight: number;
  isWarmup?: boolean;
  isDropset?: boolean;
}