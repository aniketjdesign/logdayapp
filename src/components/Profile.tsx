import React, { useState, useRef, useEffect } from 'react';
import { X, LogOut, Bell, User, Share, RefreshCw, Settings, MessageSquare, Clock, BarChart, TrendingUp, Award, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useNavigate } from 'react-router-dom';
import { LogoutConfirmationModal } from './LogoutConfirmationModal';
import { LogDayLogo } from './others/LogDayLogo';
import { MuscleGroup, WorkoutLog } from '../types/workout';
import { PageHeader } from './ui/PageHeader';
import { OngoingWorkoutMessage } from './others/OngoingWorkoutMessage';
import { useOnboarding } from '../context/OnboardingContext';

declare global {
  interface Window {
    Canny: any;
  }
}

// Interface for workout insights
interface WorkoutInsights {
  weeklyWorkouts: number;
  muscleGroupSets: Record<MuscleGroup, number>;
  totalWorkouts: number;
}

// Date period options for filtering
type DatePeriod = 'week' | 'lastWeek' | 'month' | 'year' | 'all';

const PROFILE_LOADING_KEY = 'logday_profile_loaded';

export const Profile: React.FC = () => {
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCannyLoading, setIsCannyLoading] = useState(false);
  const [insights, setInsights] = useState<WorkoutInsights>({
    weeklyWorkouts: 0,
    muscleGroupSets: {} as Record<MuscleGroup, number>,
    totalWorkouts: 0
  });
  const [datePeriod, setDatePeriod] = useState<DatePeriod>('week');
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  
  const navigate = useNavigate();
  const { 
    currentWorkout,
    clearWorkoutState,
    workoutLogs
  } = useWorkout();
  const { user, signOut } = useAuth();
  const { isInstallable, isIOS } = useInstallPrompt();
  const { showWhatsNewManually } = useOnboarding();
  const cannyInitialized = useRef(false);
  const dateSelectorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close date selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateSelectorRef.current && !dateSelectorRef.current.contains(event.target as Node)) {
        setShowDateSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate workout insights when workout logs change or date period changes
  useEffect(() => {
    if (workoutLogs && workoutLogs.length > 0) {
      calculateInsights(workoutLogs);
    }
  }, [workoutLogs, datePeriod]);

  useEffect(() => {
    // Check if this is a page load/refresh or navigation
    const navigationEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const isPageLoadOrRefresh = navigationEntries.length > 0 && 
      (navigationEntries[0].type === "reload" || navigationEntries[0].type === "navigate");
    
    // Only show loading on actual page load or refresh, not on navigation between pages
    const shouldShowLoading = isPageLoadOrRefresh && !localStorage.getItem(PROFILE_LOADING_KEY);
    setShowSkeleton(shouldShowLoading);
    
    // Simulate loading for demonstration purposes
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Store that we've loaded the page
      if (shouldShowLoading) {
        localStorage.setItem(PROFILE_LOADING_KEY, 'true');
      }
    }, 200);
    
    // Clear localStorage on page unload (refresh)
    const handleBeforeUnload = () => {
      localStorage.removeItem(PROFILE_LOADING_KEY);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Calculate all workout insights
  const calculateInsights = (logs: WorkoutLog[]) => {
    const weeklyWorkouts = calculateWeeklyWorkouts(logs);
    const muscleGroupSets = calculateMuscleGroupSets(logs, datePeriod);
    
    setInsights({
      weeklyWorkouts,
      muscleGroupSets,
      totalWorkouts: logs.length
    });
  };

  // Calculate weekly workouts
  const calculateWeeklyWorkouts = (logs: WorkoutLog[]): number => {
    // Get the current date
    const today = new Date();
    
    // Calculate the start of the week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday (0) of current week
    startOfWeek.setHours(0, 0, 0, 0); // Start of the day
    
    // Calculate the end of the week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday (6) of current week
    endOfWeek.setHours(23, 59, 59, 999); // End of the day
    
    // Filter logs to only include those within the current week (Sunday to Saturday)
    const weeklyLogs = logs.filter(log => {
      const logDate = new Date(log.endTime);
      return logDate >= startOfWeek && logDate <= endOfWeek;
    });
    
    return weeklyLogs.length;
  };

  // Calculate sets per muscle group for the selected date period
  const calculateMuscleGroupSets = (logs: WorkoutLog[], period: DatePeriod): Record<MuscleGroup, number> => {
    // Get start date based on selected period
    const today = new Date();
    let startDate = new Date(today);
    let endDate: Date | null = null;
    
    switch (period) {
      case 'week':
        startDate.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        break;
      case 'lastWeek':
        // Last week: 7-13 days ago
        startDate.setDate(today.getDate() - today.getDay() - 7); // Start of last week (Sunday)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7); // End of last week (Saturday)
        break;
      case 'month':
        startDate.setDate(1); // Start of month
        break;
      case 'year':
        startDate.setMonth(0, 1); // Start of year (Jan 1)
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
    }
    
    startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);
    
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.endTime);
      if (endDate) {
        return logDate >= startDate && logDate < endDate;
      }
      return logDate >= startDate;
    });
    
    // Initialize muscle group sets counter
    const muscleGroupSets: Record<MuscleGroup, number> = {
      'Chest': 0,
      'Back': 0,
      'Shoulders': 0,
      'Quads': 0,
      'Hamstrings': 0,
      'Triceps': 0,
      'Biceps': 0,
      'Glutes': 0,
      'Calves': 0,
      'Core': 0,
      'Cardio': 0,
      'Forearms': 0,
      'Olympic Lifts': 0
    };
    
    // Count sets for each muscle group
    filteredLogs.forEach(log => {
      log.exercises.forEach(exercise => {
        const muscleGroup = exercise.exercise.muscleGroup;
        const setCount = exercise.sets.length;
        muscleGroupSets[muscleGroup] += setCount;
      });
    });
    
    return muscleGroupSets;
  };

  // Get all muscle groups that have been trained (sets > 0)
  const getTrainedMuscleGroups = (): { name: MuscleGroup; sets: number }[] => {
    return Object.entries(insights.muscleGroupSets)
      .filter(([_, sets]) => sets > 0)
      .sort(([_, setsA], [__, setsB]) => setsB - setsA)
      .map(([name, sets]) => ({ name: name as MuscleGroup, sets }));
  };

  // Get the maximum number of sets for any muscle group (for progress bar calculation)
  const getMaxSets = (): number => {
    const trainedGroups = getTrainedMuscleGroups();
    return trainedGroups.length > 0 ? Math.max(...trainedGroups.map(m => m.sets)) : 0;
  };

  // Get display text for the selected date period
  const getDatePeriodText = (): string => {
    switch (datePeriod) {
      case 'week':
        return 'This Week';
      case 'lastWeek':
        return 'Last Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      case 'all':
        return 'All Time';
      default:
        return 'This Week';
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Force a hard refresh by reloading without cache
    window.location.reload();
  };

  const handleLogoutClick = () => {
    if (currentWorkout) {
      setShowLogoutConfirmation(true);
    } else {
      handleLogout();
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      clearWorkoutState();
      await signOut();
      
      // Clear all localStorage data
      Object.keys(localStorage).forEach(key => {
        if (!key.startsWith('vite-')) {
          localStorage.removeItem(key);
        }
      });

      // Clear all sessionStorage data
      sessionStorage.clear();

      // Reset Canny
      cannyInitialized.current = false;

      // Force a hard reload and redirect
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, force logout
      window.location.href = '/login';
    }
  };

  const handleFinishWorkout = () => {
    setShowLogoutConfirmation(false);
    navigate('/workout');
  };

  const handleGoToWorkout = () => {
    setShowLogoutConfirmation(false);
    navigate('/workout');
  };

  const navigateToSettings = () => {
    navigate('/settings');
  };

  const navigateToContact = () => {
    navigate('/contact');
  };

  const showWhatsNew = () => {
    showWhatsNewManually();
  };

  return (
    <>
      {isLoading && showSkeleton ? (
        // Skeleton loading state
        <div className="px-4 pt-8 pb-32">
          {/* Skeleton for heading */}
          <div className="heading-wrapper flex-col gap-y-2 pb-3">
            <div className="h-7 bg-gray-200 rounded w-1/3 animate-pulse mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
          
          {/* Skeleton for user info card */}
          <div className="flex flex-row items-center p-5 bg-gray-100 mb-6 rounded-xl mt-4">
            <div className="bg-gray-200 rounded-full h-10 w-10 animate-pulse mr-4"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
          
          {/* Skeleton for workout insights */}
          <div className="mb-6">
            <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse mb-3"></div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Skeleton for total workouts */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
              
              {/* Skeleton for weekly workouts */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
            
            {/* Skeleton for muscle groups */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
              <div className="flex justify-between mb-3">
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              </div>
              
              {/* Skeleton for muscle group bars */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-10 animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Skeleton for menu items */}
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center">
                <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse mr-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="h-full flex flex-col">
          <div>
          {currentWorkout && <OngoingWorkoutMessage />}
        </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Scrollable content area */}
              <div 
                ref={scrollContainerRef} 
                className="flex-1 overflow-y-auto pb-20"
                style={{ WebkitOverflowScrolling: 'touch' }}>
                
                <div className="max-w-2xl mx-auto">
                  <PageHeader
                    title="Profile"
                    subtitle="Configure settings, view your profile and more."
                    scrollContainerRef={scrollContainerRef}
                  />
                  
                  <div className="pt-4 pb-32 px-4">
                    {/* User Info Card */}
                    <motion.div 
                      className="flex flex-row items-center p-5 bg-gradient-to-r from-blue-50 to-indigo-50 mb-6 rounded-xl shadow-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 }}>
                      <div className="bg-blue-100 rounded-full p-3 mr-4">
                        <User size={24} strokeWidth={2} className="text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-gray-800">{user?.email?.split('@')[0] || 'User'}</h2>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </motion.div>

                    {/* Workout Insights */}
                    <motion.div 
                      className="mb-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}>
                      <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                        <BarChart size={16} className="mr-2 text-blue-500" />
                        Workout Insights
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Total Workouts */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                          <div className="flex items-center mb-2">
                            <TrendingUp size={16} className="text-blue-500 mr-2" />
                            <span className="text-xs font-medium text-gray-500">Total Workouts</span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="text-2xl font-bold text-gray-800 mr-1">{insights.totalWorkouts}</span>
                            <span className="text-xs text-gray-500">completed</span>
                          </div>
                        </div>
                        
                        {/* Weekly Workouts */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                          <div className="flex items-center mb-2">
                            <Clock size={16} className="text-green-500 mr-2" />
                            <span className="text-xs font-medium text-gray-500">This Week</span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="text-2xl font-bold text-gray-800 mr-1">{insights.weeklyWorkouts}</span>
                            <span className="text-xs text-gray-500">workouts</span>
                          </div>
                        </div>
                      </div>

                      {/* All Muscle Groups with Date Selector */}
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Award size={16} className="text-amber-500 mr-2" />
                            <span className="text-xs font-medium text-gray-500">Muscle Groups</span>
                          </div>
                          
                          {/* Date Period Selector */}
                          <div className="relative" ref={dateSelectorRef}>
                            <button 
                              onClick={() => setShowDateSelector(!showDateSelector)}
                              className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                            >
                              {getDatePeriodText()}
                              <ChevronDown size={14} className="ml-1" />
                            </button>
                            
                            {showDateSelector && (
                              <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-md border border-gray-100 z-10 w-32 py-1">
                                <button 
                                  className={`w-full text-left px-3 py-1.5 text-xs ${datePeriod === 'week' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                  onClick={() => {
                                    setDatePeriod('week');
                                    setShowDateSelector(false);
                                  }}
                                >
                                  This Week
                                </button>
                                <button 
                                  className={`w-full text-left px-3 py-1.5 text-xs ${datePeriod === 'lastWeek' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                  onClick={() => {
                                    setDatePeriod('lastWeek');
                                    setShowDateSelector(false);
                                  }}
                                >
                                  Last Week
                                </button>
                                <button 
                                  className={`w-full text-left px-3 py-1.5 text-xs ${datePeriod === 'month' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                  onClick={() => {
                                    setDatePeriod('month');
                                    setShowDateSelector(false);
                                  }}
                                >
                                  This Month
                                </button>
                                <button 
                                  className={`w-full text-left px-3 py-1.5 text-xs ${datePeriod === 'year' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                  onClick={() => {
                                    setDatePeriod('year');
                                    setShowDateSelector(false);
                                  }}
                                >
                                  This Year
                                </button>
                                <button 
                                  className={`w-full text-left px-3 py-1.5 text-xs ${datePeriod === 'all' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                  onClick={() => {
                                    setDatePeriod('all');
                                    setShowDateSelector(false);
                                  }}
                                >
                                  All Time
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {getTrainedMuscleGroups().length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {getTrainedMuscleGroups().map((muscle, index) => (
                              <div key={muscle.name} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-medium text-gray-700">{muscle.name}</span>
                                  <span className="text-gray-500">{muscle.sets} sets</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      index % 3 === 0 ? 'bg-blue-500' : 
                                      index % 3 === 1 ? 'bg-indigo-500' : 'bg-purple-500'
                                    }`}
                                    style={{ 
                                      width: `${Math.min(100, (muscle.sets / getMaxSets()) * 100)}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No workouts recorded {datePeriod === 'all' ? 'yet' : `this ${datePeriod}`}</p>
                        )}
                      </div>

                    </motion.div>

                    {/* Settings and Actions */}
                    <motion.div
                      className="rounded-xl overflow-hidden shadow-sm border border-gray-100 mb-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}>
                      <button
                        onClick={showWhatsNew}
                        className="w-full px-4 py-3.5 text-left text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-medium text-sm flex items-center"
                      >
                        <Bell size={18} strokeWidth={2} className="mr-3 text-gray-500" />
                        What's New
                      </button>
                      <button
                        onClick={navigateToSettings}
                        className="w-full px-4 py-3.5 text-left text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-medium text-sm flex items-center"
                      >
                        <Settings size={18} strokeWidth={2} className="mr-3 text-gray-500" />
                        Settings
                      </button>
                      <button
                        onClick={navigateToContact}
                        className="w-full px-4 py-3.5 text-left text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-medium text-sm flex items-center"
                      >
                        <MessageSquare size={18} className="mr-3 text-gray-500" />
                        <span>Contact</span>
                      </button>
                      <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="w-full px-4 py-3.5 text-left text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-medium text-sm flex items-center"
                      >
                        <RefreshCw size={18} strokeWidth={2} className={`mr-3 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>{isRefreshing ? 'Refreshing...' : 'Refresh App'}</span>
                      </button>
                      {/* <button
                        onClick={() => {
                          if (!cannyInitialized.current) {
                            setIsCannyLoading(true);
                            if (window.Canny && user?.email) {
                              cannyInitialized.current = true;
                              window.Canny('identify', {
                                appID: '672e7aa3fb3f5695ec02ebee',
                                user: {
                                  email: `${user.id}@logday.app`,
                                  id: user.id,
                                  name: `User_${user.id.slice(0, 8)}`,
                                },
                              });
                              window.Canny('initChangelog', {
                                appID: '672e7aa3fb3f5695ec02ebee',
                                position: 'bottom',
                                align: 'right',
                                theme: 'light',
                                onLoad: () => setIsCannyLoading(false)
                              });
                            } else {
                              setTimeout(() => setIsCannyLoading(false), 3000);
                            }
                          }
                        }}
                        data-canny-changelog
                        className="w-full px-4 py-3.5 text-left text-gray-700 hover:bg-gray-50 font-medium text-sm flex items-center"
                        disabled={isCannyLoading}
                      >
                        <Bell size={18} strokeWidth={2} className="mr-3 text-gray-500" />
                        <span>{isCannyLoading ? 'Loading...' : 'What\'s New'}</span>
                      </button> */}
                    </motion.div>

                    {isInstallable && (
                      <motion.div 
                        className="p-4 bg-blue-50 rounded-xl mt-6 mb-4 shadow-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}>
                        <div className="flex items-center text-blue-800 mb-1.5">
                          <Share size={16} strokeWidth={2} className="mr-2 flex-shrink-0" />
                          <span className="text-sm font-medium">Install Logday App</span>
                        </div>
                        <p className="text-xs text-blue-600 leading-relaxed">
                          {isIOS ? 
                            "Tap the share button in your browser and select 'Add to Home Screen'" :
                            "Click the install button in your browser's address bar"}
                        </p>
                      </motion.div>
                    )}

                    <motion.div 
                      className="mt-6 space-y-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}>
                      <button
                        onClick={handleLogoutClick}
                        disabled={isLoggingOut}
                        className="w-full py-3 text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                      >
                        <LogOut size={16} strokeWidth={2} />
                        <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                      </button>
                    </motion.div>

                    <div className="flex justify-center mt-10">
                      <LogDayLogo />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <LogoutConfirmationModal 
            isOpen={showLogoutConfirmation}
            onClose={() => setShowLogoutConfirmation(false)}
            onLogout={handleLogout}
            onFinishWorkout={handleFinishWorkout}
            onGoToWorkout={handleGoToWorkout}
          />
        </>
      )}
    </>
  );
};
