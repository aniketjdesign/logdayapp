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
    return data;
  },

  async getUserExercises(): Promise<CustomExercise[]> {
    const { data, error } = await supabase
      .from('custom_exercises')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateExercise(id: string, exercise: Partial<NewCustomExercise>): Promise<CustomExercise> {
    const { data, error } = await supabase
      .from('custom_exercises')
      .update(exercise)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from('custom_exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};