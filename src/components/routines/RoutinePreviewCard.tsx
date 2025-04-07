import React, { useState, useRef, useEffect } from 'react';
import { Edit2, PlayCircle, Eye, MoreVertical, Trash2, FolderSymlink, Copy } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { RoutinePreviewSheet } from './RoutinePreviewSheet';
import { DeleteRoutineModal } from './routineview';
import { generateUUID } from '../../utils/uuid';
import { MoveRoutineModal } from './MoveRoutineModal';
import { motion, AnimatePresence } from 'framer-motion';

interface RoutinePreviewCardProps {
  routine: any;
  onEdit: () => void;
  onDelete?: (routineId: string) => void;
  onMove?: () => void;
  isLogdayRoutine?: boolean;
}

interface MuscleGroupSummary {
  exerciseCount: number;
  totalSets: number;
}

export const RoutinePreviewCard: React.FC<RoutinePreviewCardProps> = ({
  routine,
  onEdit,
  onDelete,
  onMove,
  isLogdayRoutine = false,
}) => {
  const { startWorkout, addRoutine } = useWorkout();
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getMuscleGroupSummary = () => {
    const summary: Record<string, MuscleGroupSummary> = {};
    
    routine.exercises.forEach((config: any) => {
      const muscleGroup = config.exercise.muscleGroup;
      if (!summary[muscleGroup]) {
        summary[muscleGroup] = { exerciseCount: 0, totalSets: 0 };
      }
      summary[muscleGroup].exerciseCount += 1;
      summary[muscleGroup].totalSets += config.sets.length;
    });

    return Object.entries(summary);
  };

  const handleStartWorkout = async () => {
    try {
      const exercises = routine.exercises.map((config: any) => config.exercise);
      const workoutExercises = routine.exercises.map((config: any) => ({
        exercise: config.exercise,
        sets: config.sets.map((set: any, index: number) => ({
          id: generateUUID(),
          setNumber: index + 1,
          targetReps: set.goal || 0,
          performedReps: '',
          weight: set.weight || 0,
          comments: set.comments || '',
          isPR: set.isPR || false,
          isWarmup: set.isWarmup || false,
          isDropset: set.isDropset || false,
          isFailure: set.isFailure || false
        }))
      }));
      console.log('Starting workout with routine name:', routine.name);
      await startWorkout(exercises, routine.name, workoutExercises);
      navigate('/workout');
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow px-1 py-2">
        <div className="flex items-start justify-between mb-1 px-1">
          <div className="flex-1 pr-2">
            <h2 className="text-sm font-semibold">{routine.name}</h2>
            {routine.description && (
              <p className="text-gray-600 text-xs">{routine.description}</p>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded-md"
            >
              <MoreVertical size={14} className="text-gray-500" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg z-50 py-1 border border-gray-100"
                >
                  {!isLogdayRoutine && (
                    <div
                      onClick={() => {
                        onEdit();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-gray-900 hover:bg-gray-50 flex items-center cursor-pointer text-sm"
                    >
                      <Edit2 size={14} className="mr-2" />
                      Edit
                    </div>
                  )}
                  <div
                    onClick={async () => {
                      try {
                        setShowMenu(false);
                        const routineCopy = {
                          ...routine,
                          name: `${routine.name} (Copy)`,
                          id: undefined,
                          created_at: undefined,
                          updated_at: undefined
                        };
                        await addRoutine(routineCopy);
                        setShowMenu(false);
                      } catch (error) {
                        console.error('Error duplicating routine:', error);
                        alert('Failed to duplicate routine. Please try again.');
                      }
                    }}
                    className="w-full px-3 py-1.5 text-left text-gray-900 hover:bg-gray-50 flex items-center cursor-pointer text-sm"
                  >
                    <Copy size={14} className="mr-2" />
                    Duplicate
                  </div>
                  {onMove && !isLogdayRoutine && (
                    <div
                      onClick={() => {
                        setShowMoveModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-gray-900 hover:bg-gray-50 flex items-center cursor-pointer text-sm"
                    >
                      <FolderSymlink size={14} className="mr-2" />
                      Move
                    </div>
                  )}
                  {onDelete && !isLogdayRoutine && (
                    <div
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center cursor-pointer text-sm"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 py-3 border-y border-gray-100">
          {getMuscleGroupSummary().map(([muscleGroup, summary]) => (
            <div key={muscleGroup} className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-gray-50">
              <span className="text-gray-500">{muscleGroup}:</span>
              <span className="ml-1 text-gray-500">
              {summary.totalSets} sets
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2 flex justify-end gap-x-2 text-sm px-1">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center text-gray-600 hover:text-gray-700 px-1.5 py-1 bg-gray-100 rounded-md"
          >
            <Eye size={14} className="mr-1" />
            Preview
          </button>
          <button
            onClick={handleStartWorkout}
            className="flex items-center text-blue-600 hover:text-blue-700 px-1.5 py-1 bg-blue-50 rounded-md"
          >
            <PlayCircle size={14} className="mr-1" />
            Start
          </button>
        </div>
      </div>

      <RoutinePreviewSheet 
        routine={routine}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onEdit={onEdit}
        onDelete={isLogdayRoutine ? undefined : onDelete}
        onMove={isLogdayRoutine ? undefined : onMove}
        isLogdayRoutine={isLogdayRoutine}
      />

      <DeleteRoutineModal
        isOpen={showDeleteModal}
        routineName={routine.name}
        onConfirm={async () => {
          if (isDeleting) return;
          setIsDeleting(true);
          try {
            await onDelete?.(routine.id);
            setShowDeleteModal(false);
          } catch (error) {
            console.error('Error deleting routine:', error);
          } finally {
            setIsDeleting(false);
          }
        }}
        onClose={() => setShowDeleteModal(false)}
        isLoading={isDeleting}
      />

      {showMoveModal && (
        <MoveRoutineModal
          isOpen={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          routineId={routine.id}
          currentFolderId={routine.folder_id}
        />
      )}
    </>
  );
};
