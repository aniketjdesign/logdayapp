import { supabase } from '../config/supabase';
import { WorkoutLog, WorkoutPreferences, Routine } from '../types/workout';
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
        .select('id, name, exercises, start_time, end_time, duration, created_at, user_id')
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
        .select('id, name, exercises, start_time, end_time, duration')
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
      return { data: [], error };
    }
  },

  async getUserSettings() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_settings')
        .select('weight_unit, disable_rest_timer, default_home_page')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      return { 
        weightUnit: (data?.weight_unit || 'lbs') as WeightUnit, 
        disableRestTimer: data?.disable_rest_timer || false,
        defaultHomePage: (data?.default_home_page || 'exercises') as 'routines' | 'exercises',
        error: null 
      };
    } catch (error) {
      return { 
        weightUnit: 'lbs' as WeightUnit, 
        disableRestTimer: false,
        defaultHomePage: 'exercises' as 'routines' | 'exercises',
        error 
      };
    }
  },

  async saveUserSettings({ weightUnit, disableRestTimer, defaultHomePage }: { 
    weightUnit: WeightUnit, 
    disableRestTimer: boolean,
    defaultHomePage: 'routines' | 'exercises'
  }) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { error } = await supabase
      .from('user_settings')
        .upsert({
          user_id: session.user.id,
          weight_unit: weightUnit,
          disable_rest_timer: disableRestTimer,
          default_home_page: defaultHomePage,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      return { error: null };
    } catch (error) {
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
        return DEFAULT_HISTORY_PERIOD;
      }

      return data?.history_period_days || DEFAULT_HISTORY_PERIOD;
    } catch (error) {
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
          // Silently handle parse errors
        }
      }

      if (weightUnit) {
        if (weightUnit === 'kgs' || weightUnit === 'lbs') {
          migrationPromises.push(
            this.saveUserSettings({ weightUnit: weightUnit as WeightUnit, disableRestTimer: false, defaultHomePage: 'exercises' })
          );
        }
      }

      await Promise.all(migrationPromises);

      // Clear migrated data
      localStorage.removeItem(`${STORAGE_PREFIX}workoutLogs`);
      localStorage.removeItem(`${STORAGE_PREFIX}weightUnit`);

      return { error: null };
    } catch (error) {
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
      return [];
    }
  },

  async getLastWorkoutForExercise(exerciseId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('workout_logs')
        .select('id, name, exercises, start_time, end_time, duration, created_at, user_id')
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
      return { data: null, error };
    }
  },

  async getFolders() {
    return await supabase
      .from('folders')
      .select('id, name, created_at, updated_at')
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
      return { error };
    }
  },

  async getRoutines() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('routines')
        .select('id, name, description, exercises, folder_id, total_exercises, total_sets, created_at, updated_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  async addRoutine(routine: Omit<Routine, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Ensure user_id is set to the authenticated user
      const routineData = {
        ...routine,
        user_id: session.user.id,
      };

      const { data, error } = await supabase
        .from('routines')
        .insert([routineData]);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async updateRoutine(id: string, updates: Partial<Omit<Routine, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Validate UUID format
      if (!isValidUUID(id)) {
        throw new Error('Invalid UUID format');
      }

      // Validate folder_id if present
      if (updates.folder_id && updates.folder_id !== null && !isValidUUID(updates.folder_id)) {
        throw new Error('Invalid folder UUID format');
      }

      const { data, error } = await supabase
        .from('routines')
        .update(updates)
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
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
      return { error };
    }
  },

  async getLogdayRoutines() {
    try {
      // Fetch folders (type = 'folder')
      const { data: folders, error: foldersError } = await supabase
        .from('logday_routines')
        .select('id, name, description, type, parent_id, created_at, updated_at')
        .eq('type', 'folder')
        .order('created_at', { ascending: false });

      if (foldersError) throw foldersError;

      // Fetch routines (type = 'routine')
      const { data: routines, error: routinesError } = await supabase
        .from('logday_routines')
        .select('id, name, description, type, parent_id, exercises, total_exercises, total_sets, created_at, updated_at')
        .eq('type', 'routine')
        .order('created_at', { ascending: false });

      if (routinesError) throw routinesError;

      return { 
        folders: folders || [], 
        routines: routines || [], 
        error: null 
      };
    } catch (error) {
      return { folders: [], routines: [], error };
    }
  },

  async getLogdayRoutineById(id: string) {
    try {
      // Validate UUID format
      if (!isValidUUID(id)) {
        throw new Error('Invalid UUID format');
      }

      const { data, error } = await supabase
        .from('logday_routines')
        .select('id, name, description, type, parent_id, exercises, total_exercises, total_sets, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Get all workout logs for the current user without any date filtering
   * Used for AI Coach to analyze complete workout history
   */
  async getAllWorkoutLogs() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('workout_logs')
        .select('id, name, exercises, start_time, end_time, duration, created_at, user_id')
        .eq('user_id', session.user.id)
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
      return { data: [], error };
    }
  },

  /**
   * Get all exercises (both default and user-created)
   * Used for AI Coach to provide comprehensive exercise recommendations
   */
  async getAllExercises() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // First get user's custom exercises
      const { data: userExercises, error: userError } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', session.user.id);

      if (userError) throw userError;

      // Then get default exercises
      const { data: defaultExercises, error: defaultError } = await supabase
        .from('default_exercises')
        .select('*');

      if (defaultError) throw defaultError;

      // Combine both sets of exercises
      const allExercises = [
        ...(userExercises || []),
        ...(defaultExercises || [])
      ];

      return { data: allExercises, error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  /**
   * Save AI Coach conversation to Supabase
   * @param conversationData The conversation data to save
   */
  async saveAICoachConversation(conversationData: {
    title: string;
    messages: any[];
    last_message_at: string;
  }) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      console.log('Saving conversation to Supabase:', {
        title: conversationData.title,
        messageCount: conversationData.messages.length
      });

      // Ensure messages are properly serialized for JSONB column
      const messagesJson = JSON.parse(JSON.stringify(conversationData.messages));

      const { data, error } = await supabase
        .from('ai_coach_conversations')
        .insert({
          user_id: session.user.id,
          title: conversationData.title,
          messages: messagesJson,
          last_message_at: conversationData.last_message_at,
          created_at: new Date().toISOString()
        })
        .select('id');

      if (error) {
        console.error('Supabase error saving conversation:', error);
        throw error;
      }
      
      console.log('Conversation saved successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Error in saveAICoachConversation:', error);
      return { data: null, error };
    }
  },

  /**
   * Update an existing AI Coach conversation
   * @param id The conversation ID
   * @param updates The updates to apply
   */
  async updateAICoachConversation(id: string, updates: {
    title?: string;
    messages?: any[];
    last_message_at?: string;
  }) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Validate UUID format
      if (!isValidUUID(id)) {
        throw new Error('Invalid UUID format');
      }

      // Process messages if present
      const processedUpdates = { ...updates };
      if (updates.messages) {
        // Ensure messages are properly serialized for JSONB column
        processedUpdates.messages = JSON.parse(JSON.stringify(updates.messages));
      }

      console.log('Updating conversation in Supabase:', {
        id,
        messageCount: updates.messages?.length
      });

      const { data, error } = await supabase
        .from('ai_coach_conversations')
        .update({
          ...processedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select('id');

      if (error) {
        console.error('Supabase error updating conversation:', error);
        throw error;
      }
      
      console.log('Conversation updated successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Error in updateAICoachConversation:', error);
      return { data: null, error };
    }
  },

  /**
   * Get all AI Coach conversations for the current user
   */
  async getAICoachConversations() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('ai_coach_conversations')
        .select('id, title, last_message_at, created_at')
        .eq('user_id', session.user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  /**
   * Get a specific AI Coach conversation by ID
   * @param id The conversation ID
   */
  async getAICoachConversationById(id: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Validate UUID format
      if (!isValidUUID(id)) {
        throw new Error('Invalid UUID format');
      }

      const { data, error } = await supabase
        .from('ai_coach_conversations')
        .select('id, title, messages, last_message_at, created_at')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Delete an AI Coach conversation
   * @param id The conversation ID
   */
  async deleteAICoachConversation(id: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Validate UUID format
      if (!isValidUUID(id)) {
        throw new Error('Invalid UUID format');
      }

      const { error } = await supabase
        .from('ai_coach_conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },
};