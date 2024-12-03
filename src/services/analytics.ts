import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN, {
  debug: import.meta.env.DEV,
  track_pageview: true,
  persistence: 'localStorage'
});

export const Analytics = {
  identify: (userId: string, traits?: Record<string, any>) => {
    mixpanel.identify(userId);
    if (traits) {
      mixpanel.people.set(traits);
    }
  },

  track: (event: string, properties?: Record<string, any>) => {
    mixpanel.track(event, properties);
  },

  page: (name: string, properties?: Record<string, any>) => {
    mixpanel.track('Page View', {
      page: name,
      ...properties
    });
  },

  reset: () => {
    mixpanel.reset();
  },

  // Workout Events
  workoutStarted: (properties: { exercises: number; name?: string }) => {
    mixpanel.track('Workout Started', properties);
  },

  workoutCompleted: (properties: { 
    duration: number;
    exercises: number;
    sets: number;
    volume: number;
    prs: number;
  }) => {
    mixpanel.track('Workout Completed', properties);
  },

  workoutCancelled: (properties: {
    duration: number;
    exercises: number;
    completedSets: number;
  }) => {
    mixpanel.track('Workout Cancelled', properties);
  },

  exerciseAdded: (properties: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
  }) => {
    mixpanel.track('Exercise Added', properties);
  },

  exerciseRemoved: (properties: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
  }) => {
    mixpanel.track('Exercise Removed', properties);
  },

  setCompleted: (properties: {
    exerciseId: string;
    exerciseName: string;
    weight?: number;
    reps?: number;
    isPR: boolean;
  }) => {
    mixpanel.track('Set Completed', properties);
  },

  // User Events
  userSignedUp: (properties: {
    userId: string;
    email: string;
    createdAt: string;
  }) => {
    mixpanel.track('User Signed Up', properties);
  },

  userSignedIn: (properties: {
    userId: string;
    email: string;
  }) => {
    mixpanel.track('User Signed In', properties);
  },

  userSignedOut: () => {
    mixpanel.track('User Signed Out');
  },

  // Settings Events
  settingsChanged: (properties: {
    setting: string;
    value: any;
    previousValue?: any;
  }) => {
    mixpanel.track('Settings Changed', properties);
  },

  // App Events
  appInstalled: () => {
    mixpanel.track('App Installed');
  },

  appUpdated: (properties: {
    fromVersion: string;
    toVersion: string;
  }) => {
    mixpanel.track('App Updated', properties);
  },

  error: (properties: {
    error: string;
    context?: string;
    metadata?: Record<string, any>;
  }) => {
    mixpanel.track('Error Occurred', properties);
  }
};