import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { LoadingButton } from '../ui/LoadingButton';

interface DeleteRoutineModalProps {
  isOpen: boolean;
  routineName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const DeleteRoutineModal: React.FC<DeleteRoutineModalProps> = ({
  isOpen,
  routineName,
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <h2 className="text-lg font-semibold">Delete Routine</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{routineName}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-x-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <LoadingButton
            onClick={onConfirm}
            isLoading={isLoading}
            variant="danger"
            className="text-sm font-medium"
          >
            Delete
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};
