import React, { useState, useEffect } from 'react';
import { X, Medal, Link2, Target, MoreVertical, Play, Trash2 } from 'lucide-react';
import { WorkoutLog } from '../types/workout';
import { ExerciseSetList } from './ExerciseSetList';
import { useSettings } from '../context/SettingsContext';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { generateUUID } from '../utils/uuid';
import { disableScroll, enableScroll } from '../utils/scrollLock';

interface WorkoutDetailsModalProps {
  log: WorkoutLog;
  onClose: () => void;
  onDelete: () => void;
}

export const WorkoutDetailsModal: React.FC<WorkoutDetailsModalProps> = ({ log, onClose, onDelete }) => {
  const { weightUnit } = useSettings();
  const [showMenu, setShowMenu] = useState(false);
  const { startWorkout } = useWorkout();
  const navigate = useNavigate();

  useEffect(() => {
    disableScroll();
    return () => enableScroll();
  }, []);

  const exercisesByMuscle = log.exercises.reduce((groups, exercise, index) => {
    // Skip if this exercise is the second part of a superset that's already been processed
    if (exercise.supersetWith && log.exercises.findIndex(ex => ex.exercise.id === exercise.supersetWith) < index) {
      return groups;
    }

    const muscleGroup = exercise.exercise.muscleGroup;
    if (!groups[muscleGroup]) {
      groups[muscleGroup] = [];
    }

    if (exercise.supersetWith) {
      const supersetPartner = log.exercises.find(ex => ex.exercise.id === exercise.supersetWith);
      if (supersetPartner) {
        groups[muscleGroup].push({ mainExercise: exercise, supersetPartner });
      }
    } else if (!log.exercises.some(ex => ex.supersetWith === exercise.exercise.id)) {
      groups[muscleGroup].push({ mainExercise: exercise });
    }

    return groups;
  }, {} as Record<string, Array<{ mainExercise: typeof log.exercises[0], supersetPartner?: typeof log.exercises[0] }>>);

  const handleRestartWorkout = () => {
    const exercises = log.exercises.map(({ exercise, sets, supersetWith }) => ({
      exercise,
      supersetWith,
      sets: sets.map(set => ({
        ...set,
        id: generateUUID(),
        performedReps: '',
        comments: '',
        isPR: false
      }))
    }));

    startWorkout(exercises.map(e => e.exercise), log.name, exercises);
    onClose();
    navigate('/workout');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 md:hidden">
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-xl h-[90vh] flex flex-col animate-slide-up overflow-auto ">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex-1">
            <h2 className="text-lg font-bold">{log.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <MoreVertical size={20} className="text-gray-600" />
              </button>
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-20"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-30 border">
                    <button
                      onClick={() => {
                        handleRestartWorkout();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 flex items-center"
                    >
                      <Play size={16} className="mr-2" />
                      Repeat Workout
                    </button>
                    <button
                      onClick={() => {
                        onDelete();
                        setShowMenu(false);
                        onClose();
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Log
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pb-safe pb-8">
          {Object.entries(exercisesByMuscle).map(([muscleGroup, exercises]) => (
            <div key={muscleGroup} className="border-b last:border-b-0">
              <div className="px-4 py-2 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-600">{muscleGroup}</h3>
              </div>
              <div className="divide-y">
                {exercises.map(({ mainExercise, supersetPartner }) => (
                  <div key={mainExercise.exercise.id} className="px-4 py-3">
                    {supersetPartner ? (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-lime-700 mb-2">
                          <div className="flex items-center px-2 py-1 bg-lime-100 rounded-lg gap-2">
                            <div className="w-2 h-2 rounded-full bg-lime-500" />
                            <span className="text-xs font-medium">Superset</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {/* First Exercise */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              {mainExercise.exercise.name}
                            </h4>
                            <div className="space-y-2">
                              {mainExercise.sets.map((set, index) => (
                                <div 
                                  key={set.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 text-gray-500">{index + 1}</span>
                                    <span className="font-medium">
                                      <div className="flex items-center gap-2">
                                        <span>
                                          {mainExercise.exercise.name.includes('(Bodyweight)') 
                                            ? 'BW'
                                            : `${set.weight || 0} ${weightUnit}`} × {set.performedReps || '-'}
                                        </span>
                                        {set.targetReps && (
                                          <div className="flex items-center text-gray-500 text-xs">
                                            <Target size={12} className="mr-0.5" />
                                            {set.targetReps}
                                          </div>
                                        )}
                                      </div>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {set.isPR && (
                                      <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                                        PR
                                      </span>
                                    )}
                                    <div className="flex -space-x-1">
                                      {set.isWarmup && (
                                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                          W
                                        </span>
                                      )}
                                      {set.isDropset && (
                                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                          D
                                        </span>
                                      )}
                                      {set.isFailure && (
                                        <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                          F
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Second Exercise */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              {supersetPartner.exercise.name}
                            </h4>
                            <div className="space-y-2">
                              {supersetPartner.sets.map((set, index) => (
                                <div 
                                  key={set.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 text-gray-500">{index + 1}</span>
                                    <span className="font-medium">
                                      <div className="flex items-center gap-2">
                                        <span>
                                          {supersetPartner.exercise.name.includes('(Bodyweight)') 
                                            ? 'BW'
                                            : `${set.weight || 0} ${weightUnit}`} × {set.performedReps || '-'}
                                        </span>
                                        {set.targetReps && (
                                          <div className="flex items-center text-gray-500 text-xs">
                                            <Target size={12} className="mr-0.5" />
                                            {set.targetReps}
                                          </div>
                                        )}
                                      </div>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {set.isPR && (
                                      <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                                        PR
                                      </span>
                                    )}
                                    <div className="flex -space-x-1">
                                      {set.isWarmup && (
                                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                          W
                                        </span>
                                      )}
                                      {set.isDropset && (
                                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                          D
                                        </span>
                                      )}
                                      {set.isFailure && (
                                        <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                          F
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-medium text-gray-900 mb-2">
                          {mainExercise.exercise.name}
                        </h4>
                        <div className="space-y-2">
                          {mainExercise.sets.map((set, index) => (
                        <div 
                          key={set.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 text-gray-500">{index + 1}</span>
                            <span className="font-medium">
                              <div className="flex items-center gap-2">
                                <span>
                                  {mainExercise.exercise.name.includes('(Bodyweight)') 
                                    ? 'BW'
                                    : `${set.weight || 0} ${weightUnit}`} × {set.performedReps || '-'}
                                </span>
                                {set.targetReps && (
                                  <div className="flex items-center text-gray-500 text-xs">
                                    <Target size={12} className="mr-0.5" />
                                    {set.targetReps}
                                  </div>
                                )}
                              </div>
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {set.isPR && (
                              <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                                PR
                              </span>
                            )}
                            <div className="flex -space-x-1">
                              {set.isWarmup && (
                                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                  W
                                </span>
                              )}
                              {set.isDropset && (
                                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                  D
                                </span>
                              )}
                              {set.isFailure && (
                                <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                  F
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};