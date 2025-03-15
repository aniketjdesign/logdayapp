import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkout } from '../../context/WorkoutContext';
import { RoutineCreator } from './RoutineCreator';
import { FolderView } from './FolderView';
import { Plus } from 'lucide-react';
import { OngoingWorkoutMessage } from '../OngoingWorkoutMessage';
import { DeleteRoutinePopup } from '../ui/Popup';

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

  const handleCreateRoutine = (folderId?: string) => {
    setSelectedRoutine(null);
    setSelectedFolderId(folderId || null);
    setShowRoutineCreator(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
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
                className="text-lg font-bold flex items-center"
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

            <motion.div 
              className="flex items-center justify-between mb-6 max-w-md mx-auto w-full"
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
