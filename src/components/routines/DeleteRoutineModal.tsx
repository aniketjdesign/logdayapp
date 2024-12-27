import React from 'react';

interface DeleteRoutineModalProps {
  isOpen: boolean;
  routineName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteRoutineModal: React.FC<DeleteRoutineModalProps> = ({
  isOpen,
  routineName,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-2">Delete Routine</h2>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete "{routineName}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
