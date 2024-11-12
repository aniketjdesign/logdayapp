import { supabaseService } from './supabaseService';
import { WorkoutLog } from '../types/workout';
import { generateUUID } from '../utils/uuid';

const MIGRATION_VERSION_KEY = 'logday_migration_version';
const CURRENT_MIGRATION_VERSION = 1;
const STORAGE_PREFIX = 'logday_';

export const migrationService = {
  async shouldMigrate(): Promise<boolean> {
    try {
      // Check if there's any data to migrate
      const hasWorkoutLogs = localStorage.getItem(`${STORAGE_PREFIX}workoutLogs`);
      const hasWeightUnit = localStorage.getItem(`${STORAGE_PREFIX}weightUnit`);
      const lastMigration = localStorage.getItem(MIGRATION_VERSION_KEY);

      console.log('Migration check:', {
        hasWorkoutLogs: !!hasWorkoutLogs,
        hasWeightUnit: !!hasWeightUnit,
        lastMigration
      });

      return (!!hasWorkoutLogs || !!hasWeightUnit) && 
             (!lastMigration || parseInt(lastMigration) < CURRENT_MIGRATION_VERSION);
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  },

  async migrateData(): Promise<{ success: boolean; error?: Error }> {
    try {
      console.log('Starting migration...');
      
      // Get all local storage data
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(STORAGE_PREFIX) && 
        key !== MIGRATION_VERSION_KEY
      );

      console.log('Found localStorage keys:', keys);

      // Migrate workout logs
      const workoutLogsKey = `${STORAGE_PREFIX}workoutLogs`;
      const workoutLogsData = localStorage.getItem(workoutLogsKey);
      
      if (workoutLogsData) {
        try {
          console.log('Found workout logs to migrate');
          const logs: WorkoutLog[] = JSON.parse(workoutLogsData);
          
          console.log(`Migrating ${logs.length} workout logs...`);
          
          // Process each log sequentially to maintain order
          for (const log of logs) {
            const validLog = {
              ...log,
              id: generateUUID(),
              exercises: log.exercises.map(ex => ({
                ...ex,
                sets: ex.sets.map(set => ({
                  ...set,
                  id: generateUUID()
                }))
              }))
            };

            const result = await supabaseService.saveWorkoutLog(validLog);
            if (result.error) {
              console.error('Error saving workout log during migration:', result.error);
            } else {
              console.log('Successfully migrated workout log:', validLog.id);
            }
          }
        } catch (e) {
          console.error('Error parsing workout logs:', e);
        }
      }

      // Migrate user settings
      const weightUnitKey = `${STORAGE_PREFIX}weightUnit`;
      const weightUnit = localStorage.getItem(weightUnitKey);
      if (weightUnit && (weightUnit === 'kgs' || weightUnit === 'lbs')) {
        console.log('Migrating weight unit setting:', weightUnit);
        const result = await supabaseService.saveUserSettings(weightUnit);
        if (result.error) {
          console.error('Error saving weight unit during migration:', result.error);
        } else {
          console.log('Successfully migrated weight unit setting');
        }
      }

      // Mark migration as complete
      localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION.toString());
      
      // Only remove migrated data after successful migration
      keys.forEach(key => {
        console.log('Removing migrated data:', key);
        localStorage.removeItem(key);
      });

      console.log('Migration completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Migration failed:', error);
      return { success: false, error: error as Error };
    }
  }
};