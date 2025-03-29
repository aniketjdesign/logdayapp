// No-op analytics implementation
// This file provides a placeholder for analytics that can be implemented later if needed

// No initialization needed
let isInitialized = false;

export const Analytics = {
  identify: (_userId: string, _traits?: Record<string, any>) => {
    // No-op implementation
  },

  track: (_event: string, _properties?: Record<string, any>) => {
    // No-op implementation
  },

  page: (_name: string, _properties?: Record<string, any>) => {
    // No-op implementation
  },

  reset: () => {
    // No-op implementation
  },

  // Workout Events
  workoutStarted: (_properties: { exercises: number; name?: string }) => {
    // No-op implementation
  },

  workoutCompleted: (_properties: { 
    duration: number;
    exercises: number;
    sets: number;
    volume: number;
    prs: number;
  }) => {
    // No-op implementation
  },

  workoutCancelled: (_properties: {
    duration: number;
    exercises: number;
    completedSets: number;
  }) => {
    // No-op implementation
  },

  exerciseAdded: (_properties: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
  }) => {
    // No-op implementation
  },

  exerciseRemoved: (_properties: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
  }) => {
    // No-op implementation
  },

  setCompleted: (_properties: {
    exerciseId: string;
    exerciseName: string;
    weight?: number;
    reps?: number;
    isPR: boolean;
  }) => {
    // No-op implementation
  },

  // User Events
  userSignedUp: (_properties: {
    userId: string;
    email: string;
    createdAt: string;
  }) => {
    // No-op implementation
  },

  userSignedIn: (_properties: {
    userId: string;
    email: string;
  }) => {
    // No-op implementation
  },

  userSignedOut: () => {
    // No-op implementation
  },

  // Settings Events
  settingsChanged: (_properties: {
    setting: string;
    value: any;
    previousValue?: any;
  }) => {
    // No-op implementation
  },

  // App Events
  appInstalled: () => {
    // No-op implementation
  },

  appUpdated: (_properties: {
    fromVersion: string;
    toVersion: string;
  }) => {
    // No-op implementation
  },

  error: (_properties: {
    error: string;
    context?: string;
    metadata?: Record<string, any>;
  }) => {
    // No-op implementation
  }
};