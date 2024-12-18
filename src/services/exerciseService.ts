import { supabase } from '../lib/supabase';
import { CustomExercise, NewCustomExercise } from '../types/exercise';

export const exerciseService = {
  async createExercise(exercise: NewCustomExercise): Promise<CustomExercise> {
    const { data, error } = await supabase
      .from('custom_exercises')
      .insert([{
        ...exercise,
        user_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    // Map database fields to frontend fields
    return {
      ...data,
      muscleGroup: data.muscle_group
    };
  },

  async getUserExercises(): Promise<CustomExercise[]> {
    const { data, error } = await supabase
      .from('custom_exercises')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Map database fields to frontend fields for each exercise
    return data.map(exercise => ({
      ...exercise,
      muscleGroup: exercise.muscle_group
    }));
  },

  async updateExercise(id: string, exercise: Partial<NewCustomExercise>): Promise<CustomExercise> {
    const { data, error } = await supabase
      .from('custom_exercises')
      .update(exercise)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    // Map database fields to frontend fields
    return {
      ...data,
      muscleGroup: data.muscle_group
    };
  },

  async deleteExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from('custom_exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};