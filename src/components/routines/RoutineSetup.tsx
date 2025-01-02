import React, { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { ExerciseSelector } from '../ExerciseSelector';
import { Plus, X, Trash } from 'lucide-react';
import { Exercise } from '../../types/exercise';
import { exercises as defaultExercises } from '../../data/exercises';
import { Dropdown } from '../ui/Dropdown';
import { LoadingButton } from '../ui/LoadingButton';
import { FolderModal } from './FolderModal';

interface RoutineSetupProps {
  onClose: () => void;
  onSave: (data: any) => void;
  routine?: any;
  folderId?: string | null;
}

export const RoutineSetup: React.FC<RoutineSetupProps> = ({
  onClose,
  onSave,
  routine,
  folderId,
}) => {
  const { folders, customExercises, addFolder, moveRoutine } = useWorkout();
  const [name, setName] = useState(routine?.name || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [exerciseData, setExerciseData] = useState<any[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderId || routine?.folder_id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [pendingFolderName, setPendingFolderName] = useState<string | null>(null);

  // Initialize exercise data with initial values if provided
  useEffect(() => {
    if (routine?.exercises) {
      const initializedData = routine.exercises.map((data: any) => ({
        exercise: data.exercise,
        sets: data.sets.map((set: any) => ({
          weight: set.weight || '',
          goal: set.goal || '',
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

  // Group exercises by first letter for ExerciseSelector
  const groupedExercises = defaultExercises.reduce((acc, exercise) => {
    const firstLetter = exercise.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(exercise);
    return acc;
  }, {} as { [key: string]: Exercise[] });

  const handleAddSet = (exerciseIndex: number) => {
    const newSet = { weight: '', goal: '' };
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
        sets: updated[exerciseIndex].sets.filter((_, i) => i !== setIndex)
      };
      return updated;
    });
  };

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: 'weight' | 'goal',
    value: string
  ) => {
    setExerciseData(prev => {
      const updated = [...prev];
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: updated[exerciseIndex].sets.map((set, i) => 
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
        sets: [{ weight: '', goal: '' }],
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

  const handleCreateFolder = async (name: string) => {
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
            <h1 className="text-lg font-semibold">
              {routine ? 'Edit Routine' : 'Create Routine'}
            </h1>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-100 rounded-xl text-gray-600 text-sm hover:bg-gray-100 rounded-lg disabled:opacity-50"
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
                  className="w-full px-3 py-2  text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
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
                    { value: 'new', label: '+ New Folder', className: 'border-t text-blue-600 sticky bottom-0 bg-white hover:bg-blue-50' }
                  ]}
                  placeholder="Select a folder"
                  className="w-full text-sm"
                  showIcon
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-md font-medium">Exercises</h2>
                <button
                  onClick={() => setShowExerciseSelector(true)}
                  className="flex items-center text-blue-600 text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Add Exercise
                </button>
              </div>

              <div className="space-y-2">
                {exerciseData.map((data, exerciseIndex) => (
                  <div key={data.exercise.id} className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm">{data.exercise.name}</h3>
                      <button
                        onClick={() => setExerciseData(prev => prev.filter((_, i) => i !== exerciseIndex))}
                        className="text-red-400 bg-red-50 hover:text-red-600 p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {data.sets.map((set: any, setIndex: number) => (
                        <div
                          key={setIndex}
                          className="flex items-center space-x-3"
                        >
                          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500 flex-shrink-0">
                            {setIndex + 1}
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
                              className="w-full p-2 border rounded-lg"
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
                              className="w-full p-2 border rounded-lg"
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
              className="text-sm font-medium w-full"
            >
              {routine ? 'Update' : 'Create'} Routine
            </LoadingButton>
        </div>
      </div>

      

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowExerciseSelector(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl overflow-auto"
               style={{ height: '90vh' }}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Add Exercises</h2>
            <button onClick={() => setShowExerciseSelector(false)} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <ExerciseSelector
            customExercises={customExercises}
            recentExercises={[]}
            allExercises={groupedExercises}
            selectedExercises={exerciseData.map(data => data.exercise)}
            onExerciseSelect={handleExerciseSelect}
            onSelect={() => setShowExerciseSelector(false)}
          />

        </div>
        </>
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
    </div>
  );
};
