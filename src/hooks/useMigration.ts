import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { migrationService } from '../services/migrationService';

export const useMigration = () => {
  const { user } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<Error | null>(null);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    const checkAndMigrate = async () => {
      if (!user) return;

      try {
        const shouldMigrate = await migrationService.shouldMigrate();
        console.log('Should migrate?', shouldMigrate);
        
        if (shouldMigrate) {
          setIsMigrating(true);
          const { success, error } = await migrationService.migrateData();
          
          if (!success && error) {
            console.error('Migration failed:', error);
            setMigrationError(error);
          } else {
            console.log('Migration completed successfully');
            setMigrationComplete(true);
          }
        }
      } catch (error) {
        console.error('Migration check failed:', error);
        setMigrationError(error as Error);
      } finally {
        setIsMigrating(false);
      }
    };

    checkAndMigrate();
  }, [user]);

  return { isMigrating, migrationError, migrationComplete };
};