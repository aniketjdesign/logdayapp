import { supabase } from '../lib/supabase';
import { CustomExercise, NewCustomExercise } from '../types/exercise';
import { MuscleGroup } from '../types/workout';
import { isValidUUID } from '../utils/uuid';

export const exerciseService = {
  async createExercise(exercise: NewCustomExercise): Promise<CustomExercise> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('custom_exercises')
        .insert([{
          ...exercise,
          user_id: user.id,
          is_custom: true
        }])
        .select('id, name, muscle_group, category, instruction, is_custom, created_at')
        .single();

      if (error) throw error;
      // Map database fields to frontend fields
      return {
        ...data,
        muscleGroup: data.muscle_group
      };
    } catch (error) {
      throw error;
    }
  },

  async getUserExercises(): Promise<CustomExercise[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('custom_exercises')
        .select('id, name, muscle_group, category, instruction, is_custom, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map database fields to frontend fields for each exercise
      return data.map(exercise => ({
        ...exercise,
        muscleGroup: exercise.muscle_group
      }));
    } catch (error) {
      throw error;
    }
  },

  async updateExercise(id: string, exercise: Partial<NewCustomExercise>): Promise<CustomExercise> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      // Validate UUID format
      if (!isValidUUID(id)) {
        throw new Error('Invalid UUID format');
      }

      const { data, error } = await supabase
        .from('custom_exercises')
        .update(exercise)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, name, muscle_group, category, instruction, is_custom, created_at')
        .single();

      if (error) throw error;
      // Map database fields to frontend fields
      return {
        ...data,
        muscleGroup: data.muscle_group
      };
    } catch (error) {
      throw error;
    }
  },

  async deleteExercise(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      // Validate UUID format
      if (!isValidUUID(id)) {
        throw new Error('Invalid UUID format');
      }

      const { error } = await supabase
        .from('custom_exercises')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }
};