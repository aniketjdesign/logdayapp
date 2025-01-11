import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { Dropdown } from '../ui/Dropdown';
import { Dialog } from '../ui/Dialog';

interface MoveRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routineId: string;
  currentFolderId: string | null;
}

export const MoveRoutineModal: React.FC<MoveRoutineModalProps> = ({
  isOpen,
  onClose,
  routineId,
  currentFolderId,
}) => {
  const { folders, moveRoutine } = useWorkout();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = async () => {
    if (selectedFolderId === currentFolderId) return;
    
    try {
      setIsMoving(true);
      await moveRoutine(routineId, selectedFolderId);
      onClose();
    } catch (error) {
      console.error('Error moving routine:', error);
      alert('Failed to move routine. Please try again.');
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Move Routine"
    >
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Folder
          </label>
          <Dropdown
            value={selectedFolderId || ''}
            onChange={(value) => setSelectedFolderId(value || null)}
            options={[
              { value: '', label: 'No folder' },
              ...folders.map((folder) => ({
                value: folder.id,
                label: folder.name
              }))
            ]}
            placeholder="Select a folder"
            className="w-full text-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            disabled={isMoving}
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={isMoving || selectedFolderId === currentFolderId}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMoving ? 'Moving...' : 'Move'}
          </button>
        </div>
      </div>
    </Dialog>
  );
};
