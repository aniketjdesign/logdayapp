import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { RoutineCreator } from './RoutineCreator';
import { FolderView } from './FolderView';
import { Plus } from 'lucide-react';

export const RoutineView = () => {
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
        <div className="px-4 h-[100vh] max-w-2xl mx-auto">

        <div className="heading-wrapper flex-col gap-y-2 py-4">
          <h1 className="text-lg font-bold">Routines</h1>
          <p className="text-sm text-gray-500">Create, view and manage your routines</p>
        </div>

          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => handleCreateRoutine()}
              className="flex flex-row items-center justify-center bg-blue-600 text-white w-full py-2 px-4 rounded-xl hover:bg-blue-700 transition-colors">
              <Plus size={20} className="mr-1" />
              New Routine 
            </button>
          </div>

          <FolderView
            selectedFolderId={selectedFolderId}
            onFolderSelect={setSelectedFolderId}
            onEditRoutine={(routine) => {
              setSelectedRoutine(routine);
              setShowRoutineCreator(true);
            }}
            onCreateRoutine={handleCreateRoutine}
          />
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
