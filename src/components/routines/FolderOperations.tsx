import React, { useState, useRef } from 'react';
import { LoadingButton } from '../ui/LoadingButton';
import { Popup, DeleteFolderPopup, RenameFolderPopup } from '../ui/Popup';

/**
 * FolderCreator component for creating new folders
 */
interface FolderCreatorProps {
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export const FolderCreator: React.FC<FolderCreatorProps> = ({
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isLoading) {
      setIsLoading(true);
      try {
        await onSave(name.trim());
        onClose();
      } catch (error) {
        console.error('Error creating folder:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const footer = (
    <div className="flex justify-end gap-x-2">
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
      >
        Cancel
      </button>
      <LoadingButton
        type="button"
        isLoading={isLoading}
        className="text-sm font-medium"
        onClick={() => formRef.current?.requestSubmit()}
      >
        Create
      </LoadingButton>
    </div>
  );

  return (
    <Popup
      isOpen={true}
      onClose={onClose}
      title="New Folder"
      footer={footer}
      size="md"
      modalClassName="rounded-xl"
      preventScroll={true}
    >
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="p-4">
          <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-1">
            Folder Name
          </label>
          <input
            id="folderName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter folder name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </form>
    </Popup>
  );
};

/**
 * FolderModal component for renaming or deleting folders
 */
interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value?: string) => Promise<void>;
  title: string;
  message: string;
  confirmText: string;
  mode: 'rename' | 'delete';
  initialValue?: string;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  mode,
  initialValue = '',
}) => {
  // If delete mode, use the DeleteFolderPopup component
  if (mode === 'delete') {
    return (
      <DeleteFolderPopup
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={async () => await onConfirm()}
        title={title}
        message={message}
        confirmText={confirmText}
      />
    );
  }
  
  // If rename mode, use the RenameFolderPopup component
  return (
    <RenameFolderPopup
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={async (value) => await onConfirm(value)}
      title={title}
      message={message}
      confirmText={confirmText}
      initialValue={initialValue}
    />
  );
};
