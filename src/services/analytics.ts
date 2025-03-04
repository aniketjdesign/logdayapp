// No-op analytics implementation
// This file provides a placeholder for analytics that can be implemented later if needed

// No initialization needed
let isInitialized = false;

export const Analytics = {
  identify: (userId: string, traits?: Record<string, any>) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.identify called', { userId, traits });
    }
  },

  track: (event: string, properties?: Record<string, any>) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.track called', { event, properties });
    }
  },

  page: (name: string, properties?: Record<string, any>) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.page called', { name, properties });
    }
  },

  reset: () => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.reset called');
    }
  },

  // Workout Events
  workoutStarted: (properties: { exercises: number; name?: string }) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.workoutStarted called', properties);
    }
  },

  workoutCompleted: (properties: { 
    duration: number;
    exercises: number;
    sets: number;
    volume: number;
    prs: number;
  }) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.workoutCompleted called', properties);
    }
  },

  workoutCancelled: (properties: {
    duration: number;
    exercises: number;
    completedSets: number;
  }) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.workoutCancelled called', properties);
    }
  },

  exerciseAdded: (properties: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
  }) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.exerciseAdded called', properties);
    }
  },

  exerciseRemoved: (properties: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
  }) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.exerciseRemoved called', properties);
    }
  },

  setCompleted: (properties: {
    exerciseId: string;
    exerciseName: string;
    weight?: number;
    reps?: number;
    isPR: boolean;
  }) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.setCompleted called', properties);
    }
  },

  // User Events
  userSignedUp: (properties: {
    userId: string;
    email: string;
    createdAt: string;
  }) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.userSignedUp called', properties);
    }
  },

  userSignedIn: (properties: {
    userId: string;
    email: string;
  }) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.userSignedIn called', properties);
    }
  },

  userSignedOut: () => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.userSignedOut called');
    }
  },

  // Settings Events
  settingsChanged: (properties: {
    setting: string;
    value: any;
    previousValue?: any;
  }) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.settingsChanged called', properties);
    }
  },

  // App Events
  appInstalled: () => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.appInstalled called');
    }
  },

  appUpdated: (properties: {
    fromVersion: string;
    toVersion: string;
  }) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.appUpdated called', properties);
    }
  },

  error: (properties: {
    error: string;
    context?: string;
    metadata?: Record<string, any>;
  }) => {
    // No-op implementation
    if (import.meta.env.DEV) {
      console.log('Analytics.error called', properties);
    }
  }
};