import { supabase } from '../config/supabase';
import { WorkoutLog, WorkoutPreferences } from '../types/workout';
import { WeightUnit } from '../db/database';
import { isValidUUID } from '../utils/uuid';

const ITEMS_PER_PAGE = 10;

// Default history period in days if not set
const DEFAULT_HISTORY_PERIOD = 30;

export const supabaseService = {
  async getWorkoutLogs() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const historyPeriod = await this.getUserHistoryPeriod();
      
      // Calculate date based on user's history period setting
      const historyDate = new Date();
      historyDate.setDate(historyDate.getDate() - historyPeriod);

      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('start_time', historyDate.toISOString())
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

      const historyPeriod = await this.getUserHistoryPeriod();
      
      // Calculate date based on user's history period setting
      const historyDate = new Date();
      historyDate.setDate(historyDate.getDate() - historyPeriod);

      const queryBuilder = supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('start_time', historyDate.toISOString())
        .order('created_at', { ascending: false });

      if (query) {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        // Get all workouts and filter in memory for complex searches
        const { data, error } = await queryBuilder;
        if (error) throw error;

        // Transform the data first
        const transformedData = data?.map(log => ({
          id: log.id,
          name: log.name,
          exercises: log.exercises,
          startTime: log.start_time,
          endTime: log.end_time,
          duration: log.duration
        })) || [];

        // Filter the transformed data
        const filteredData = transformedData.filter(log => {
          const searchableText = [
            log.name || '',
            ...log.exercises.map(ex => ex.exercise.name),
            ...log.exercises.flatMap(ex => ex.sets.map(set => set.comments || ''))
          ].join(' ').toLowerCase();
          
          return searchTerms.every(term => searchableText.includes(term));
        });

        return { data: filteredData, error: null };
      }

      // If no query, return all data
      const { data, error } = await queryBuilder;
      if (error) throw error;

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

  async getUserHistoryPeriod() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('workout_preferences')
        .select('history_period_days')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching workout preferences:', error);
        return DEFAULT_HISTORY_PERIOD;
      }

      return data?.history_period_days || DEFAULT_HISTORY_PERIOD;
    } catch (error) {
      console.error('Error in getUserHistoryPeriod:', error);
      return DEFAULT_HISTORY_PERIOD;
    }
  },

  async updateUserHistoryPeriod(days: number) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      if (days < 1) throw new Error('History period must be at least 1 day');
      if (days > 365) throw new Error('History period cannot exceed 365 days');

      const { error } = await supabase
        .from('workout_preferences')
        .upsert({
          user_id: session.user.id,
          history_period_days: days,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error updating history period:', error);
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

  async getFolders() {
    return await supabase
      .from('folders')
      .select('*')
      .order('name');
  },

  async addFolder(folder: { name: string; user_id: string }) {
    return await supabase
      .from('folders')
      .insert([folder]);
  },

  async updateFolder(id: string, updates: { name: string }) {
    return await supabase
      .from('folders')
      .update(updates)
      .eq('id', id);
  },

  async deleteFolder(id: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // First, delete all routines in the folder
      const { error: routinesError } = await supabase
        .from('routines')
        .delete()
        .eq('folder_id', id)
        .eq('user_id', session.user.id);

      if (routinesError) throw routinesError;

      // Then delete the folder itself
      const { error: folderError } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (folderError) throw folderError;

      return { error: null };
    } catch (error) {
      console.error('Error deleting folder:', error);
      return { error };
    }
  },

  async getRoutines() {
    return await supabase
      .from('routines')
      .select('*')
      .order('created_at', { ascending: false });
  },

  async addRoutine(routine: any) {
    return await supabase
      .from('routines')
      .insert([routine]);
  },

  async updateRoutine(id: string, updates: any) {
    return await supabase
      .from('routines')
      .update(updates)
      .eq('id', id);
  },

  async deleteRoutine(id: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Validate UUID format
      if (!isValidUUID(id)) {
        throw new Error('Invalid UUID format');
      }

      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting routine:', error);
      return { error };
    }
  },

  async moveRoutine(routineId: string, folderId: string | null) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Validate UUID format
      if (!isValidUUID(routineId)) {
        throw new Error('Invalid UUID format');
      }

      if (folderId && !isValidUUID(folderId)) {
        throw new Error('Invalid folder UUID format');
      }

      const { error } = await supabase
        .from('routines')
        .update({ folder_id: folderId })
        .eq('id', routineId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error moving routine:', error);
      return { error };
    }
  },
};