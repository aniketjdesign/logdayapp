import React, { useState, useRef, useEffect } from 'react';
import { X, PlayCircle, MoreVertical, Edit2, Trash2, FolderSymlink } from 'lucide-react';
import { RemoveScroll } from 'react-remove-scroll';
import { useWorkout } from '../../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { generateUUID } from '../../utils/uuid';
import { DeleteRoutineModal } from './routineview';

interface RoutinePreviewSheetProps {
  routine: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: (routineId: string) => void;
  onMove?: () => void;
}

export const RoutinePreviewSheet: React.FC<RoutinePreviewSheetProps> = ({
  routine,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onMove,
}) => {
  const { startWorkout } = useWorkout();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
          comments: '',
          isPR: false,
          isWarmup: false,
          isDropset: false,
          isFailure: false
        }))
      }));
      await startWorkout(exercises, routine.name, workoutExercises);
      onClose();
      navigate('/workout');
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <RemoveScroll>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
        <div 
          className="fixed inset-x-0 bottom-0 transform transition-transform duration-300 ease-in-out"
          style={{ height: '90vh' }}
        >
          <div className="bg-white h-full rounded-t-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b">
              <div>
                <h2 className="text-base font-semibold">{routine.name}</h2>
                {routine.description && (
                  <p className="text-sm text-gray-600 mt-0.5">{routine.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
              
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <MoreVertical size={20} className="text-gray-500" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                      <button
                        onClick={handleStartWorkout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <PlayCircle size={16} />
                        Start Workout
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onClose();
                          onEdit();
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit2 size={16} />
                        Edit Routine
                      </button>
                      {onMove && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onMove();
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FolderSymlink size={16} />
                          Move Routine
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowDeleteModal(true);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          <Trash2 size={16} />
                          Delete Routine
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
              <div className="space-y-4">
                {routine.exercises.map((config: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-sm">{config.exercise.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs py-1 px-2 bg-gray-100 rounded-lg text-gray-600">
                            {config.exercise.muscleGroup}
                          </span>
                          <span className="text-xs py-1 px-2 bg-gray-100 rounded-lg text-gray-600">
                            {config.sets.length} {config.sets.length === 1 ? 'set' : 'sets'}
                          </span>
                        </div>
                        
                      </div>
                      
                    </div>
                    

                    {/* Sets */}
                    <div className="space-y-2">
                      {config.sets.map((set: any, setIndex: number) => (
                        <div 
                          key={setIndex}
                          className="flex justify-between items-center gap-2 text-sm py-1 px-2 bg-gray-50 border border-gray-100 rounded-lg"
                        >
                          <span className="text-gray-500 text-sm">Set {setIndex + 1}</span>
                          <div className="text-gray-500 text-sm">
                          {set.weight && (
                            <span>{set.weight} kg x </span>
                          )}
                          {set.goal && (
                            <span>{set.goal} reps</span>
                          )}
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                              <button
                  onClick={handleStartWorkout}
                  className="flex items-center w-full gap-2 px-2 py-2 bg-blue-600 justify-center text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <PlayCircle size={20} />
                  <span>Start Workout</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
      <DeleteRoutineModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          if (onDelete) {
            onDelete(routine.id);
            setShowDeleteModal(false);
            onClose();
          }
        }}
        routineName={routine.name}
      />
    </RemoveScroll>
  );
};
