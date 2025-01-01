import React, { useState, useRef, useEffect } from 'react';
import { Edit2, PlayCircle, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { RoutinePreviewSheet } from './RoutinePreviewSheet';
import { DeleteRoutineModal } from './DeleteRoutineModal';
import { LoadingButton } from '../ui/LoadingButton';
import { generateUUID } from '../../utils/uuid';

interface RoutinePreviewProps {
  routine: any;
  onEdit: () => void;
  onDelete?: (routineId: string) => void;
}

interface MuscleGroupSummary {
  exerciseCount: number;
  totalSets: number;
}

export const RoutinePreview: React.FC<RoutinePreviewProps> = ({
  routine,
  onEdit,
  onDelete,
}) => {
  const { startWorkout } = useWorkout();
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
        sets: config.sets.map((set: any) => ({
          id: generateUUID(),
          setNumber: 1,
          targetReps: set.goal || 0,
          performedReps: '',
          weight: set.weight || 0,
          comments: '',
          isPR: false,
          isWarmup: false,
          isDropset: false,
          isFailure: false
        }))
      }));
      await startWorkout(exercises, routine.name, workoutExercises);
      navigate('/workout');
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-2.5">
        <div className="flex items-start justify-between mb-1 border-b border-gray-100">
          <div className="flex flex-col">
            <h2 className="text-md font-semibold">{routine.name}</h2>
            {routine.description && (
              <p className="text-gray-600 text-xs mb-2">{routine.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <MoreHorizontal size={16} className="text-gray-500" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-gray-700"
                  >
                    <Edit2 size={14} className="mr-2" />
                    Edit Routine
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-red-600"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete Routine
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          {getMuscleGroupSummary().map(([muscleGroup, summary]) => (
            <div key={muscleGroup} className="flex items-center gap-x-2">
              <span className="text-gray-600 font-semibold text-xs">
                {muscleGroup}:
              </span>
              <span className="text-xs text-gray-600">
                {summary.exerciseCount} {summary.exerciseCount === 1 ? 'exercise' : 'exercises'},
                {' '}{summary.totalSets} {summary.totalSets === 1 ? 'set' : 'sets'}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-x-2 text-sm border-t border-gray-100 pt-2">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center text-gray-600 hover:text-gray-700 px-2 py-1.5 bg-gray-100 rounded-lg">
            <Eye size={16} className="mr-1" />
            Preview
          </button>
          <button
            onClick={handleStartWorkout}
            className="flex items-center text-blue-600 hover:text-blue-700 px-2 py-1.5 bg-blue-50 rounded-lg"
          >
            <PlayCircle size={16} className="mr-1" />
            Start Workout
          </button>
        </div>
      </div>

      <RoutinePreviewSheet
        routine={routine}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
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
    </>
  );
};