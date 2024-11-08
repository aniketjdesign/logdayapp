// Utility to prevent app reload during idle periods
export const setupKeepAlive = () => {
    // Store timestamp of last activity
    let lastActivity = Date.now();
    
    // Update last activity on user interactions
    const updateLastActivity = () => {
      lastActivity = Date.now();
      localStorage.setItem('lastActivity', lastActivity.toString());
    };
  
    // Check if we're resuming from idle
    const checkResume = () => {
      const stored = localStorage.getItem('lastActivity');
      if (stored) {
        const lastStored = parseInt(stored, 10);
        const timeDiff = Date.now() - lastStored;
        
        // If less than 2 hours have passed, prevent reload
        if (timeDiff < 2 * 60 * 60 * 1000) {
          // Prevent the default reload behavior
          window.stop();
        }
      }
    };
  
    // Setup event listeners for user activity
    const events = [
      'mousedown', 'mousemove', 'keydown',
      'scroll', 'touchstart', 'click', 'keypress'
    ];
  
    // Add listeners for all events
    events.forEach(event => {
      document.addEventListener(event, updateLastActivity, true);
    });
  
    // Check on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkResume();
      }
    });
  
    // Initial setup
    updateLastActivity();
  };