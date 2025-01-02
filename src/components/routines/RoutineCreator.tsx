import React from 'react';
import { RoutineSetup } from './RoutineSetup';
import { useWorkout } from '../../context/WorkoutContext';

interface RoutineCreatorProps {
  onClose: () => void;
  routine?: any;
  folderId?: string | null;
}

export const RoutineCreator: React.FC<RoutineCreatorProps> = ({
  onClose,
  routine,
  folderId,
}) => {
  const { addRoutine, updateRoutine } = useWorkout();

  const handleSave = async (data: any) => {
    try {
      const routineData = {
        ...data,
        // Only set folder_id for new routines, let updates use the selected folder
        ...(routine ? {} : { folder_id: folderId }),
      };

      console.log('Saving routine data:', routineData);

      if (routine) {
        await updateRoutine(routine.id, routineData);
      } else {
        await addRoutine(routineData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving routine:', error);
      alert('Failed to save routine. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      <RoutineSetup
        onSave={handleSave}
        onCancel={onClose}
        routine={routine}
        folderId={routine?.folder_id || folderId || null}
      />
    </div>
  );
};
