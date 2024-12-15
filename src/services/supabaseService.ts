import { supabase } from '../config/supabase';
import { WorkoutLog } from '../types/workout';
import { WeightUnit } from '../db/database';
import { isValidUUID } from '../utils/uuid';

const ITEMS_PER_PAGE = 10;

export const supabaseService = {
  async getWorkoutLogs() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('start_time', thirtyDaysAgo.toISOString())
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Transform and validate the data
      const transformedData = data?.map(log => ({
        id: log.id,
        name: log.name,
        exercises: log.exercises,
        startTime: log.start_time,
        endTime: log.end_time,
        duration: log.duration
      })) || [];

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error fetching workout logs:', error);
      return { data: [], error };
    }
  },

  async saveWorkoutLog(workout: WorkoutLog) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Validate UUID format
      if (!isValidUUID(workout.id)) {
        throw new Error('Invalid UUID format');
      }

      const workoutData = {
        id: workout.id,
        user_id: session.user.id,
        name: workout.name || 'Untitled Workout',
        exercises: workout.exercises,
        start_time: workout.startTime,
        end_time: workout.endTime,
        duration: workout.duration,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('workout_logs')
        .upsert([workoutData]);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error saving workout log:', error);
      return { error };
    }
  },

  async deleteWorkoutLog(logId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Validate UUID format
      if (!isValidUUID(logId)) {
        throw new Error('Invalid UUID format');
      }

      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting workout log:', error);
      return { error };
    }
  },

  async searchWorkoutLogs(query: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const queryBuilder = supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('start_time', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (query) {
        queryBuilder.filter('name', 'ilike', `%${query}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      // Transform and validate the data
      const transformedData = data?.map(log => ({
        id: log.id,
        name: log.name,
        exercises: log.exercises,
        startTime: log.start_time,
        endTime: log.end_time,
        duration: log.duration
      })) || [];

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error searching workout logs:', error);
      return { data: [], error };
    }
  },

  async getUserSettings() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_settings')
        .select('weight_unit')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      return { weightUnit: (data?.weight_unit || 'lbs') as WeightUnit, error: null };
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return { weightUnit: 'lbs' as WeightUnit, error };
    }
  },

  async saveUserSettings(weightUnit: WeightUnit) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: session.user.id,
          weight_unit: weightUnit,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error saving user settings:', error);
      return { error };
    }
  },

  async migrateLocalStorage() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Get data from localStorage
      const STORAGE_PREFIX = 'logday_';
      const workoutLogs = localStorage.getItem(`${STORAGE_PREFIX}workoutLogs`);
      const weightUnit = localStorage.getItem(`${STORAGE_PREFIX}weightUnit`);

      const migrationPromises = [];

      if (workoutLogs) {
        try {
          const logs = JSON.parse(workoutLogs);
          if (Array.isArray(logs)) {
            migrationPromises.push(
              ...logs.map(log => {
                // Ensure valid UUID for migrated logs
                const validLog = {
                  ...log,
                  id: isValidUUID(log.id) ? log.id : crypto.randomUUID()
                };
                return this.saveWorkoutLog(validLog);
              })
            );
          }
        } catch (e) {
          console.error('Error parsing workout logs:', e);
        }
      }

      if (weightUnit) {
        if (weightUnit === 'kgs' || weightUnit === 'lbs') {
          migrationPromises.push(
            this.saveUserSettings(weightUnit as WeightUnit)
          );
        }
      }

      await Promise.all(migrationPromises);

      // Clear migrated data
      localStorage.removeItem(`${STORAGE_PREFIX}workoutLogs`);
      localStorage.removeItem(`${STORAGE_PREFIX}weightUnit`);

      return { error: null };
    } catch (error) {
      console.error('Error migrating localStorage data:', error);
      return { error };
    }
  },

  async getRecentExercises(limit: number = 10) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('workout_logs')
        .select('exercises')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Extract unique exercises from recent workouts
      const recentExercises = new Map();
      data?.forEach(log => {
        log.exercises.forEach(({ exercise }) => {
          if (!recentExercises.has(exercise.id)) {
            recentExercises.set(exercise.id, exercise);
          }
        });
      });

      return Array.from(recentExercises.values()).slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent exercises:', error);
      return [];
    }
  },

  async getLastWorkoutForExercise(exerciseId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .contains('exercises', [{ exercise: { id: exerciseId } }])
        .order('start_time', { ascending: false })
        .limit(1);

      if (error) throw error;

      // Return the last performed set for this exercise
      if (data && data.length > 0) {
        const lastWorkout = data[0];
        const exerciseData = lastWorkout.exercises.find(
          (e: any) => e.exercise.id === exerciseId
        );
        if (exerciseData && exerciseData.sets && exerciseData.sets.length > 0) {
          // Return the last non-warmup set
          const lastSet = [...exerciseData.sets]
            .reverse()
            .find((set: any) => !set.isWarmup);
          return { data: lastSet, error: null };
        }
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Error fetching last workout for exercise:', error);
      return { data: null, error };
    }
  },
};