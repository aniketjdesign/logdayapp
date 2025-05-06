import { MuscleGroup } from './workout';

export interface CustomExercise {
  id: string;
  user_id: string;
  name: string;
  muscle_group: MuscleGroup;
  instruction?: string;
  category?: string;
  aliases?: string[]; // Array of alternative names for the exercise
  is_custom: boolean;
  created_at: string;
}

export type NewCustomExercise = Omit<CustomExercise, 'id' | 'user_id' | 'created_at' | 'is_custom'>;