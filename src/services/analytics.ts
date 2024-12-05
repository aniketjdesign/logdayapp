import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = '672e7aa3fb3f5695ec02ebee';

let isInitialized = false;

const initMixpanel = () => {
  if (!isInitialized && MIXPANEL_TOKEN) {
    try {
      mixpanel.init(MIXPANEL_TOKEN, {
        debug: import.meta.env.DEV,
        track_pageview: true,
        persistence: 'localStorage'
      });
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Mixpanel:', error);
    }
  }
};

export const Analytics = {
  identify: (userId: string, traits?: Record<string, any>) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.identify(userId);
        if (traits) {
          mixpanel.people.set(traits);
        }
      }
    } catch (error) {
      console.error('Analytics identify error:', error);
    }
  },

  track: (event: string, properties?: Record<string, any>) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track(event, properties);
      }
    } catch (error) {
      console.error('Analytics track error:', error);
    }
  },

  page: (name: string, properties?: Record<string, any>) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('Page View', {
          page: name,
          ...properties
        });
      }
    } catch (error) {
      console.error('Analytics page error:', error);
    }
  },

  reset: () => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.reset();
      }
    } catch (error) {
      console.error('Analytics reset error:', error);
    }
  },

  // Workout Events
  workoutStarted: (properties: { exercises: number; name?: string }) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('Workout Started', properties);
      }
    } catch (error) {
      console.error('Analytics workoutStarted error:', error);
    }
  },

  workoutCompleted: (properties: { 
    duration: number;
    exercises: number;
    sets: number;
    volume: number;
    prs: number;
  }) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('Workout Completed', properties);
      }
    } catch (error) {
      console.error('Analytics workoutCompleted error:', error);
    }
  },

  workoutCancelled: (properties: {
    duration: number;
    exercises: number;
    completedSets: number;
  }) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('Workout Cancelled', properties);
      }
    } catch (error) {
      console.error('Analytics workoutCancelled error:', error);
    }
  },

  exerciseAdded: (properties: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
  }) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('Exercise Added', properties);
      }
    } catch (error) {
      console.error('Analytics exerciseAdded error:', error);
    }
  },

  exerciseRemoved: (properties: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
  }) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('Exercise Removed', properties);
      }
    } catch (error) {
      console.error('Analytics exerciseRemoved error:', error);
    }
  },

  setCompleted: (properties: {
    exerciseId: string;
    exerciseName: string;
    weight?: number;
    reps?: number;
    isPR: boolean;
  }) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('Set Completed', properties);
      }
    } catch (error) {
      console.error('Analytics setCompleted error:', error);
    }
  },

  // User Events
  userSignedUp: (properties: {
    userId: string;
    email: string;
    createdAt: string;
  }) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('User Signed Up', properties);
      }
    } catch (error) {
      console.error('Analytics userSignedUp error:', error);
    }
  },

  userSignedIn: (properties: {
    userId: string;
    email: string;
  }) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('User Signed In', properties);
      }
    } catch (error) {
      console.error('Analytics userSignedIn error:', error);
    }
  },

  userSignedOut: () => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('User Signed Out');
      }
    } catch (error) {
      console.error('Analytics userSignedOut error:', error);
    }
  },

  // Settings Events
  settingsChanged: (properties: {
    setting: string;
    value: any;
    previousValue?: any;
  }) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('Settings Changed', properties);
      }
    } catch (error) {
      console.error('Analytics settingsChanged error:', error);
    }
  },

  // App Events
  appInstalled: () => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('App Installed');
      }
    } catch (error) {
      console.error('Analytics appInstalled error:', error);
    }
  },

  appUpdated: (properties: {
    fromVersion: string;
    toVersion: string;
  }) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('App Updated', properties);
      }
    } catch (error) {
      console.error('Analytics appUpdated error:', error);
    }
  },

  error: (properties: {
    error: string;
    context?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      initMixpanel();
      if (isInitialized) {
        mixpanel.track('Error Occurred', properties);
      }
    } catch (error) {
      console.error('Analytics error track error:', error);
    }
  }
};