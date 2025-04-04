import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Clock, Dumbbell, MoreVertical, Trash2, ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from './ConfirmationModal';
import { OngoingWorkoutMessage } from './OngoingWorkoutMessage';
import { WorkoutLogCard } from './WorkoutLogCard';
import { EmptyState } from './EmptyState';
import { PageHeader } from './ui/PageHeader';

// This key will be used to store in localStorage if we've shown the loading animation
const LOGS_LOADING_KEY = 'logday_logs_loaded';

export const WorkoutLogs: React.FC = () => {
  const { workoutLogs, searchLogs, deleteLog, currentWorkout } = useWorkout();
  const [search, setSearch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is a page load/refresh or navigation
    const navigationEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const isPageLoadOrRefresh = navigationEntries.length > 0 && 
      (navigationEntries[0].type === "reload" || navigationEntries[0].type === "navigate");
    
    // Only show loading on actual page load or refresh, not on navigation between pages
    const shouldShowLoading = isPageLoadOrRefresh && !localStorage.getItem(LOGS_LOADING_KEY);
    setShowSkeleton(shouldShowLoading);
    
    const loadLogs = async () => {
      await searchLogs(search);
      setIsLoading(false);
      
      // Store that we've loaded the page
      if (shouldShowLoading) {
        localStorage.setItem(LOGS_LOADING_KEY, 'true');
      }
    };
    
    loadLogs();
    
    // Clear localStorage on page unload (refresh)
    const handleBeforeUnload = () => {
      localStorage.removeItem(LOGS_LOADING_KEY);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [search, searchLogs]);

  const handleDeleteClick = (logId: string) => {
    setSelectedLogId(logId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedLogId) {
      await deleteLog(selectedLogId);
      setShowDeleteModal(false);
      setSelectedLogId(null);
    }
  };

  if (isLoading && showSkeleton) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-32">
          <div className="mb-1 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="mb-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (workoutLogs.length === 0 && !search) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-32">
          <motion.h1 
            className="text-2xl font-semibold tracking-tight text-slate-800"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}>
            Workout History
          </motion.h1>
          <motion.p 
            className="text-sm text-gray-500"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}>
            View, analyze or repeat your past workouts
          </motion.p>

        {currentWorkout && <OngoingWorkoutMessage />}
        <motion.div
          initial={{ opacity: 0.5, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}>
          <EmptyState
            currentWorkout={currentWorkout}
            onNavigate={() => navigate(currentWorkout ? '/workout' : '/')}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div>
      {currentWorkout && <OngoingWorkoutMessage />}
    </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Fixed header section */}

        {/* Scrollable content area */}
        <div 
          ref={scrollContainerRef} 
          className="flex-1 overflow-y-auto pb-32"
          style={{ WebkitOverflowScrolling: 'touch' }}>
          
          <PageHeader
            title="Workout History"
            subtitle="View, analyze or repeat your past workouts"
            scrollContainerRef={scrollContainerRef}
          >
            
          </PageHeader>
          <motion.div 
              className="px-4 py-3 bg-slate-50 sm:px-6 rounded-lg sticky top-[35px] z-20"
              initial={{ y: 10, opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.2 }}>
              <motion.div 
                className="relative"
                initial={{ y: 10, opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.2 }}>
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search workouts..."
                  className="w-full pl-7 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base rounded-lg"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </motion.div>
            </motion.div>

          <div className="px-4 sm:px-6">
            {workoutLogs.length === 0 && search ? (
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0.5, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}>
                <motion.p 
                  className="text-gray-500 text-sm"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}>
                  No workouts found matching "{search}"
                </motion.p>
                <motion.button
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSearch('')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear search
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                className="space-y-4 sm:space-y-6 mt-4"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}>
                {workoutLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0.5, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 + index * 0.03 }}
                  >
                    <WorkoutLogCard
                      log={log}
                      onDelete={() => handleDeleteClick(log.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Workout Log?"
            message="This action cannot be undone. Are you sure you want to delete this workout log?"
            confirmText="Delete Log"
            confirmButtonClass="bg-red-600 hover:bg-red-700"
          />
        )}
      </AnimatePresence>
    </div>
  );
};