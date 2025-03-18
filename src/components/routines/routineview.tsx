import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWorkout } from '../../context/WorkoutContext';
import { RoutineCreator } from './RoutineCreator';
import { FolderView } from './FolderView';
import { Plus } from 'lucide-react';
import { OngoingWorkoutMessage } from '../OngoingWorkoutMessage';
import { DeleteRoutinePopup } from '../ui/Popup';

// This key will be used to store in localStorage if we've shown the loading animation
const ROUTINES_LOADING_KEY = 'logday_routines_loaded';

/**
 * DeleteRoutineModal component - moved from separate file
 * Used in RoutinePreviewCard and RoutinePreviewSheet components
 */
interface DeleteRoutineModalProps {
  isOpen: boolean;
  routineName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const DeleteRoutineModal: React.FC<DeleteRoutineModalProps> = ({
  isOpen,
  routineName,
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  return (
    <DeleteRoutinePopup
      isOpen={isOpen}
      routineName={routineName}
      onConfirm={onConfirm}
      onClose={onClose}
      isLoading={isLoading}
    />
  );
};

/**
 * Main RoutineView component
 */
export const RoutineView = () => {
  const { currentWorkout } = useWorkout();
  const [showRoutineCreator, setShowRoutineCreator] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const handleCreateRoutine = (folderId?: string) => {
    setSelectedRoutine(null);
    setSelectedFolderId(folderId || null);
    setShowRoutineCreator(true);
  };

  useEffect(() => {
    // Check if this is a page load/refresh or navigation
    const navigationEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const isPageLoadOrRefresh = navigationEntries.length > 0 && 
      (navigationEntries[0].type === "reload" || navigationEntries[0].type === "navigate");
    
    // Only show loading on actual page load or refresh, not on navigation between pages
    const shouldShowLoading = isPageLoadOrRefresh && !localStorage.getItem(ROUTINES_LOADING_KEY);
    setShowSkeleton(shouldShowLoading);
    
    // Simulate loading for demonstration purposes
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Store that we've loaded the page
      if (shouldShowLoading) {
        localStorage.setItem(ROUTINES_LOADING_KEY, 'true');
      }
    }, 200);
    
    // Clear localStorage on page unload (refresh)
    const handleBeforeUnload = () => {
      localStorage.removeItem(ROUTINES_LOADING_KEY);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (isLoading && showSkeleton) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <div className="px-4 pb-20 max-w-2xl mx-auto">
            {currentWorkout && <OngoingWorkoutMessage />}
            
            <div className="heading-wrapper flex-col gap-y-2 py-4 pt-8">
              <div className="h-7 bg-gray-200 rounded w-1/3 animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
            
            <div className="sticky top-0 z-10 bg-slate-50 py-3 mb-4 mx-auto w-full">
              <div className="h-10 bg-gray-200 rounded-xl w-full animate-pulse"></div>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Remove the overflow-y-auto from this div to prevent nested scrolling */}
      <div className="flex-1">
        <div className="px-4 pb-20 max-w-2xl mx-auto">
          {currentWorkout && <OngoingWorkoutMessage />}
          <motion.div 
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`${currentWorkout ? 'opacity-50 pointer-events-none' : ''}`}>
            <motion.div 
              className="heading-wrapper flex-col gap-y-2 py-4 pt-8"
              initial={{ y: 5, opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}>
              <motion.h1 
                className="text-2xl font-semibold tracking-tight text-slate-800 flex items-center"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.12 }}>
                Routines
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Beta</span>
              </motion.h1>
              <motion.p 
                className="text-sm text-gray-500"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.15 }}>
                Create, view and manage your routines
              </motion.p>
            </motion.div>
          </motion.div>

          <motion.div 
            className="sticky top-0 z-10 bg-slate-50 py-3 mb-4 mx-auto w-full"
            initial={{ y: 10, opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.2 }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCreateRoutine()}
              className="flex flex-row items-center justify-center bg-blue-600 text-white w-full py-2 px-4 rounded-xl hover:bg-blue-700 transition-colors">
              <Plus size={20} className="mr-1" />
              New Routine
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ y: 15, opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.25 }}>
            <FolderView
              selectedFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId}
              onEditRoutine={(routine) => {
                setSelectedRoutine(routine);
                setShowRoutineCreator(true);
              }}
              onCreateRoutine={handleCreateRoutine}
              />
          </motion.div>
        </div>
      </div>

      {showRoutineCreator && (
        <RoutineCreator
          onClose={() => setShowRoutineCreator(false)}
          routine={selectedRoutine}
          folderId={selectedFolderId}
        />
      )}
    </div>
  );
};
