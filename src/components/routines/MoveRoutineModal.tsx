import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { MoveRoutinePopup } from '../ui/Popup';

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

  return (
    <MoveRoutinePopup
      isOpen={isOpen}
      onClose={onClose}
      routineId={routineId}
      currentFolderId={currentFolderId}
      folders={folders}
      moveRoutine={moveRoutine}
    />
  );
};
