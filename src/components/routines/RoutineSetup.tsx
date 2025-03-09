import React, { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { ExerciseSelectionModal } from '../ExerciseSelectionModal';
import { Plus, X, Trash, MoveVertical, GripVertical, MoreVertical, RefreshCw } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { LoadingButton } from '../ui/LoadingButton';
import { FolderModal } from './FolderModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../SortableItem';
import { RemoveScroll } from 'react-remove-scroll';
import { SetIndicatorPopover } from '../mobile/SetIndicatorPopover';
import { Exercise } from '../../types/workout';

interface RoutineSetupProps {
  onClose: () => void;
  onSave: (data: any) => void;
  routine?: any;
  folderId?: string | null;
}

interface RoutineSet {
  weight: string;
  goal: string;
  isWarmup?: boolean;
  isDropset?: boolean;
  isFailure?: boolean;
  isPR?: boolean;
  comments?: string;
}

interface RoutineExerciseData {
  exercise: Exercise;
  sets: RoutineSet[];
  setRefs?: (HTMLDivElement | null)[];
  showSetTypeMenu?: number | null;
}

// Exercise Reorder Modal Component
interface ExerciseReorderModalProps {
  exercises: any[];
  onClose: () => void;
  onReorder: (exercises: any[]) => void;
}

const ExerciseReorderModal: React.FC<ExerciseReorderModalProps> = ({
  exercises,
  onClose,
  onReorder,
}) => {
  const [items, setItems] = React.useState(exercises);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.exercise.id === active.id);
        const newIndex = items.findIndex(item => item.exercise.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    onReorder(items);
    onClose();
  };

  return (
    <RemoveScroll>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
      >
        <div className="fixed bottom-0 left-0 right-0 h-[80vh] bg-white rounded-t-xl flex flex-col animate-slide-up overflow-auto">
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <h2 className="text-lg font-bold select-none">Reorder Exercises</h2>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              Done
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(item => item.exercise.id)}
                strategy={verticalListSortingStrategy}
              >
                <div>
                  {items.map(({ exercise, sets }) => (
                    <SortableItem key={exercise.id} id={exercise.id}>
                      <div className="flex items-center px-4 py-3 border-b">
                        <div className="touch-none select-none cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                        </div>
                        <span className="text-gray-900 select-none">{exercise.name}</span>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </RemoveScroll>
  );
};

export const RoutineSetup: React.FC<RoutineSetupProps> = ({
  onClose,
  onSave,
  routine,
  folderId,
}) => {
  const { folders, addFolder, moveRoutine } = useWorkout();
  const [name, setName] = useState(routine?.name || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [exerciseData, setExerciseData] = useState<RoutineExerciseData[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderId || routine?.folder_id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [pendingFolderName, setPendingFolderName] = useState<string | null>(null);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [activeExerciseMenu, setActiveExerciseMenu] = useState<string | null>(null);
  const [replaceExerciseId, setReplaceExerciseId] = useState<string | null>(null);

  // Initialize exercise data with initial values if provided
  useEffect(() => {
    if (routine?.exercises) {
      const initializedData = routine.exercises.map((data: any) => ({
        exercise: data.exercise,
        sets: data.sets.map((set: any) => ({
          weight: set.weight || '',
          goal: set.goal || '',
          isWarmup: set.isWarmup || false,
          isDropset: set.isDropset || false,
          isFailure: set.isFailure || false,
          isPR: set.isPR || false,
          comments: set.comments || ''
        })),
      }));
      setExerciseData(initializedData);
    }
  }, [routine]);

  // Watch for folder changes to select newly created folder
  useEffect(() => {
    if (pendingFolderName) {
      const newFolder = folders.find(f => f.name === pendingFolderName);
      if (newFolder) {
        setSelectedFolderId(newFolder.id);
        setPendingFolderName(null);
      }
    }
  }, [folders, pendingFolderName]);

  // Group exercises by first letter for ExerciseSelector (not used directly in this component)
  /* const groupedExercises = defaultExercises.reduce((acc, exercise) => {
    const firstLetter = exercise.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(exercise);
    return acc;
  }, {} as { [key: string]: Exercise[] }); */

  const handleAddSet = (exerciseIndex: number) => {
    const newSet = { 
      weight: '', 
      goal: '', 
      isWarmup: false, 
      isDropset: false, 
      isFailure: false, 
      isPR: false,
      comments: ''
    };
    setExerciseData(prev => {
      const updated = [...prev];
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: [...updated[exerciseIndex].sets, newSet]
      };
      return updated;
    });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExerciseData(prev => {
      const updated = [...prev];
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: updated[exerciseIndex].sets.filter((_, i: number) => i !== setIndex)
      };
      return updated;
    });
  };

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: 'weight' | 'goal' | 'isWarmup' | 'isDropset' | 'isFailure' | 'isPR' | 'comments',
    value: string | boolean
  ) => {
    setExerciseData(prev => {
      const updated = [...prev];
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: updated[exerciseIndex].sets.map((set, i: number) => 
          i === setIndex ? { ...set, [field]: value } : set
        )
      };
      return updated;
    });
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    const isSelected = exerciseData.some(data => data.exercise.id === exercise.id);
    if (isSelected) {
      setExerciseData(prev => prev.filter(data => data.exercise.id !== exercise.id));
    } else {
      setExerciseData(prev => [...prev, {
        exercise,
        sets: [{ 
          weight: '', 
          goal: '', 
          isWarmup: false, 
          isDropset: false, 
          isFailure: false, 
          isPR: false,
          comments: ''
        }],
      }]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a routine name');
      return;
    }

    if (isSaving) return;

    setIsSaving(true);
    try {
      // If this is an update and the folder has changed, move the routine first
      if (routine?.id && selectedFolderId !== routine.folder_id) {
        console.log('Moving routine to new folder:', {
          routineId: routine.id,
          oldFolder: routine.folder_id,
          newFolder: selectedFolderId
        });
        await moveRoutine(routine.id, selectedFolderId);
      }

      const routineData = {
        name,
        description,
        exercises: exerciseData,
        folder_id: selectedFolderId,
      };

      console.log('Saving routine:', routineData);
      await onSave(routineData);
    } catch (error) {
      console.error('Error saving routine:', error);
      alert('Failed to save routine. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFolderSelect = async (value: string) => {
    if (value === 'new') {
      setShowNewFolderModal(true);
    } else {
      setSelectedFolderId(value || null);
    }
  };

  const handleCreateFolder = async (name: string | undefined) => {
    if (!name) return;
    
    try {
      setPendingFolderName(name);
      await addFolder({ name });
      setShowNewFolderModal(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder. Please try again.');
      setPendingFolderName(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50">
      <div className="flex flex-col h-full">
        <div className="border-b">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-lg font-bold">
              {routine ? 'Edit Routine' : 'Create Routine'}
            </h1>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-6 pb-20 max-w-2xl mx-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name*
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter routine name"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter routine description"
                  className="w-full px-3 py-2  text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-12 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Folder
                </label>
                <Dropdown
                  value={selectedFolderId || ''}
                  onChange={handleFolderSelect}
                  options={[
                    { value: '', label: 'No folder' },
                    ...folders.map((folder) => ({
                      value: folder.id,
                      label: folder.name
                    })),
                    { value: 'new', label: '+ New Folder' }
                  ]}
                  placeholder="Select a folder"
                  className="w-full text-sm"
                  showIcon
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm text-gray-700 font-medium">Exercises</h2>
                <div className="flex space-x-3">
                  {exerciseData.length > 1 && (
                    <button
                      onClick={() => setShowReorderModal(true)}
                      className="flex items-center text-blue-600 text-sm"
                    >
                      <MoveVertical size={16} className="mr-1" />
                      Reorder
                    </button>
                  )}
                  <button
                    onClick={() => setShowExerciseSelector(true)}
                    className="flex items-center text-blue-600 text-sm"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Exercise
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {exerciseData.map((data, exerciseIndex) => (
                  <div key={data.exercise.id} className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm">{data.exercise.name}</h3>
                      <div className="relative">
                        <button
                          onClick={() => setActiveExerciseMenu(activeExerciseMenu === data.exercise.id ? null : data.exercise.id)}
                          className="p-2 rounded-lg hover:bg-gray-100"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeExerciseMenu === data.exercise.id && (
                          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border z-10">
                            <button
                              onClick={() => {
                                setReplaceExerciseId(data.exercise.id);
                                setShowExerciseSelector(true);
                                setActiveExerciseMenu(null);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2"
                            >
                              <RefreshCw size={16} />
                              <span>Replace Exercise</span>
                            </button>
                            <button
                              onClick={() => {
                                setExerciseData(prev => prev.filter((_, i) => i !== exerciseIndex));
                                setActiveExerciseMenu(null);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center text-red-600"
                            >
                              <Trash size={16} className="mr-2" />
                              <span>Remove Exercise</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {data.sets.map((set: any, setIndex: number) => (
                        <div
                          key={setIndex}
                          className="flex items-center space-x-3"
                        >
                          {/* Set Indicator */}
                          <div className="flex-shrink-0" ref={el => {
                            // Create a ref for each set number element
                            if (!data.setRefs) data.setRefs = [];
                            data.setRefs[setIndex] = el;
                          }}>
                            <SetIndicatorPopover
                              set={{
                                ...set,
                                id: `${data.exercise.id}-${setIndex}`,
                                setNumber: setIndex + 1,
                                performedReps: '',
                                comments: set.comments || '',
                                isWarmup: set.isWarmup || false,
                                isDropset: set.isDropset || false,
                                isFailure: set.isFailure || false,
                                isPR: set.isPR || false
                              }}
                              showSetTypeMenu={data.showSetTypeMenu === setIndex}
                              setShowSetTypeMenu={(show) => {
                                setExerciseData(prev => {
                                  const updated = [...prev];
                                  // Close any other open menus first
                                  updated.forEach(ex => ex.showSetTypeMenu = null);
                                  // Set the current menu state
                                  updated[exerciseIndex].showSetTypeMenu = show ? setIndex : null;
                                  return updated;
                                });
                              }}
                              setNumberRef={{ current: data.setRefs?.[setIndex] || null }}
                              handleSetTypeUpdate={(type, value) => {
                                handleSetChange(exerciseIndex, setIndex, type, value);
                              }}
                              hasNonWarmupType={set.isDropset || set.isFailure}
                              hidePROption={true}
                            />
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                            <input
                              type="number"
                              value={set.weight}
                              onChange={(e) =>
                                handleSetChange(
                                  exerciseIndex,
                                  setIndex,
                                  'weight',
                                  e.target.value
                                )
                              }
                              className="w-full p-2 border rounded-lg  focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Weight (kg)"
                            />
                            <input
                              type="number"
                              value={set.goal}
                              onChange={(e) =>
                                handleSetChange(
                                  exerciseIndex,
                                  setIndex,
                                  'goal',
                                  e.target.value
                                )
                              }
                              className="w-full p-2 border rounded-lg  focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Goal (reps)"
                            />
                          </div>
                          {data.sets.length > 1 && (
                            <button
                              onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                            >
                              <X size={14} className=" " />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddSet(exerciseIndex)}
                        className="flex items-center text-blue-600 mt-2 text-sm py-1 px-2 bg-blue-50 rounded-lg"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Set
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center p-4">
        <LoadingButton
              onClick={handleSave}
              isLoading={isSaving}
              className="text-md font-medium w-full py-3"
            >
              {routine ? 'Update' : 'Create'} Routine
            </LoadingButton>
        </div>
      </div>

      

      {/* Exercise Selection Modal */}
      {showExerciseSelector && (
        <ExerciseSelectionModal
          isReplacing={replaceExerciseId !== null}
          onClose={() => {
            setShowExerciseSelector(false);
            setReplaceExerciseId(null);
          }}
          onAdd={(selectedExercises) => {
            if (replaceExerciseId) {
              // Handle replacing an exercise
              const exerciseToReplace = exerciseData.find(data => data.exercise.id === replaceExerciseId);
              if (exerciseToReplace && selectedExercises.length === 1) {
                // Create a new exercise with the same number of sets but with empty values
                const newExerciseData = {
                  exercise: selectedExercises[0],
                  sets: exerciseToReplace.sets.map(set => ({
                    weight: '',
                    goal: '',
                    isWarmup: set.isWarmup || false,
                    isDropset: set.isDropset || false,
                    isFailure: set.isFailure || false,
                    isPR: set.isPR || false,
                    comments: set.comments || ''
                  }))
                };
                
                // Replace the exercise in the exerciseData
                setExerciseData(prev => 
                  prev.map(data => data.exercise.id === replaceExerciseId ? newExerciseData : data)
                );
              }
              setReplaceExerciseId(null);
            } else {
              // Normal add exercise flow
              selectedExercises.forEach(exercise => handleExerciseSelect(exercise));
            }
            setShowExerciseSelector(false);
          }}
          currentExercises={exerciseData.map(data => data.exercise)}
        />
      )}
      {showNewFolderModal && (
        <FolderModal
          isOpen={showNewFolderModal}
          onClose={() => setShowNewFolderModal(false)}
          onConfirm={handleCreateFolder}
          title="Create New Folder"
          message="Enter a name for the new folder"
          confirmText="Create"
          mode="rename"
          initialValue=""
        />
      )}

      {/* Exercise Reorder Modal */}
      {showReorderModal && (
        <ExerciseReorderModal
          exercises={exerciseData}
          onClose={() => setShowReorderModal(false)}
          onReorder={(reorderedExercises) => {
            setExerciseData(reorderedExercises);
            setShowReorderModal(false);
          }}
        />
      )}
    </div>
  );
};
