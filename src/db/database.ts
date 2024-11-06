import { openDB } from 'idb';
import { WorkoutLog } from '../types/workout';

const dbName = 'ssl-workout-tracker';
const dbVersion = 1;

const initDB = async () => {
  const db = await openDB(dbName, dbVersion, {
    upgrade(db) {
      // Workouts store
      if (!db.objectStoreNames.contains('workouts')) {
        db.createObjectStore('workouts', { keyPath: 'id' });
      }
    },
  });
  return db;
};

export const saveWorkout = async (workout: WorkoutLog) => {
  const db = await initDB();
  await db.put('workouts', workout);
};

export const getWorkouts = async (): Promise<WorkoutLog[]> => {
  const db = await initDB();
  const workouts = await db.getAll('workouts');
  return workouts.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
};

export const searchWorkouts = async (query: string): Promise<WorkoutLog[]> => {
  const db = await initDB();
  const workouts = await db.getAll('workouts');
  const searchTerm = query.toLowerCase();
  
  return workouts
    .filter(workout => 
      workout.name.toLowerCase().includes(searchTerm) ||
      workout.exercises.some(({ exercise }) => 
        exercise.name.toLowerCase().includes(searchTerm)
      )
    )
    .sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
};