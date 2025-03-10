import React, { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Pencil } from 'lucide-react';
import { RemoveScroll } from 'react-remove-scroll';
import { Dropdown } from './Dropdown';
import { LoadingButton } from './LoadingButton';

export type PopupSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: PopupSize;
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  preventScroll?: boolean;
  titleClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  modalClassName?: string;
  icon?: ReactNode;
}

export const Popup: React.FC<PopupProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
  showCloseButton = true,
  preventScroll = true,
  titleClassName = '',
  contentClassName = '',
  headerClassName = '',
  footerClassName = '',
  modalClassName = '',
  icon
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4'
  };

  const popupContent = (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <motion.div 
        className="fixed inset-0 bg-black z-40" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={closeOnBackdropClick ? onClose : undefined}
      />
      <motion.div 
        className={`bg-white rounded-lg w-full z-50 ${sizeClasses[size]} ${modalClassName}`}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {(title || showCloseButton) && (
          <div className={`flex items-center justify-between p-4 ${headerClassName} ${!title ? 'pb-0' : ''}`}>
            {title && (
              <div className="flex items-center space-x-3">
                {icon && icon}
                <h3 className={`text-lg font-semibold ${titleClassName}`}>{title}</h3>
              </div>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg"
                aria-label="Close"
              >
                <X size={20} className="text-gray-500" />
              </button>
            )}
          </div>
        )}
        
        <div className={`${contentClassName}`}>
          {children}
        </div>
        
        {footer && (
          <div className={`p-4 ${footerClassName}`}>
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        preventScroll ? (
          <RemoveScroll>{popupContent}</RemoveScroll>
        ) : popupContent
      )}
    </AnimatePresence>
  );
};

/**
 * Confirmation Popup variant built on top of the base Popup
 */
export interface ConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmButtonClass?: string;
  icon?: ReactNode;
}

export const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmButtonClass = 'bg-blue-600 hover:bg-blue-700',
  icon
}) => {
  const footer = (
    <div className="flex space-x-3">
      <button
        onClick={onClose}
        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${confirmButtonClass}`}
      >
        {confirmText}
      </button>
    </div>
  );

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={icon}
      footer={footer}
      size="md"
    >
      <div className="p-4 pt-0">
        <p className="text-gray-600">{message}</p>
      </div>
    </Popup>
  );
};

/**
 * Form Popup variant built on top of the base Popup
 */
export interface FormPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  submitText?: string;
  cancelText?: string;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitButtonClass?: string;
  size?: PopupSize;
  preventSubmitOnEnter?: boolean;
}

/**
 * Delete Folder Popup variant built on top of the base Popup
 */
export interface DeleteFolderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmText: string;
}

export const DeleteFolderPopup: React.FC<DeleteFolderPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isLoading}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-70 flex items-center"
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          confirmText
        )}
      </button>
    </div>
  );

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      icon={<AlertTriangle className="h-6 w-6 text-yellow-500" />}
      size="md"
    >
      <div className="p-4 pt-0">
        <p className="text-gray-600">{message}</p>
      </div>
    </Popup>
  );
};

/**
 * Form Popup variant built on top of the base Popup
 */
/**
 * Delete Routine Popup variant built on top of the base Popup
 */
export interface DeleteRoutinePopupProps {
  isOpen: boolean;
  routineName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const DeleteRoutinePopup: React.FC<DeleteRoutinePopupProps> = ({
  isOpen,
  routineName,
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  const title = "Delete Routine";
  const message = `Are you sure you want to delete "${routineName}"? This action cannot be undone.`;
  
  const footer = (
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isLoading}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-70 flex items-center"
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          "Delete"
        )}
      </button>
    </div>
  );

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      icon={<AlertTriangle className="h-6 w-6 text-yellow-500" />}
      size="md"
    >
      <div className="p-4 pt-0">
        <p className="text-gray-600">{message}</p>
      </div>
    </Popup>
  );
};

/**
 * Form Popup variant built on top of the base Popup
 */
/**
 * Move Routine Popup variant built on top of the base Popup
 */
export interface MoveRoutinePopupProps {
  isOpen: boolean;
  onClose: () => void;
  routineId: string;
  currentFolderId: string | null;
  folders: Array<{ id: string; name: string }>;
  moveRoutine: (routineId: string, folderId: string | null) => Promise<void>;
}

export const MoveRoutinePopup: React.FC<MoveRoutinePopupProps> = ({
  isOpen,
  onClose,
  routineId,
  currentFolderId,
  folders,
  moveRoutine
}) => {
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

  const footer = (
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={onClose}
        disabled={isMoving}
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleMove}
        disabled={isMoving || selectedFolderId === currentFolderId}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-70"
      >
        {isMoving ? 'Moving...' : 'Move'}
      </button>
    </div>
  );

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Move Routine"
      footer={footer}
      size="md"
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
      </div>
    </Popup>
  );
};

/**
 * Form Popup variant built on top of the base Popup
 */
/**
 * Rename Folder Popup variant built on top of the base Popup
 */
export interface RenameFolderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => Promise<void>;
  title: string;
  message: string;
  confirmText: string;
  initialValue: string;
}

export const RenameFolderPopup: React.FC<RenameFolderPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  initialValue = '',
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const handleConfirm = async () => {
    if (!inputValue.trim()) return;
    if (isLoading) return;

    setIsLoading(true);
    try {
      await onConfirm(inputValue);
      onClose();
    } catch (error) {
      console.error('Error in folder operation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
      >
        Cancel
      </button>
      <LoadingButton
        onClick={handleConfirm}
        isLoading={isLoading}
        variant="primary"
        className="text-sm font-medium"
      >
        {confirmText}
      </LoadingButton>
    </div>
  );

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      icon={<Pencil className="h-6 w-6 text-blue-500" />}
      size="md"
    >
      <div className="p-4 pt-0">
        <p className="text-gray-600">{message}</p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter folder name"
          disabled={isLoading}
          autoFocus
        />
      </div>
    </Popup>
  );
};

/**
 * Form Popup variant built on top of the base Popup
 */
export const FormPopup: React.FC<FormPopupProps> = ({
  isOpen,
  onClose,
  title,
  children,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onSubmit,
  isSubmitting = false,
  submitButtonClass = 'bg-blue-600 hover:bg-blue-700',
  size = 'md',
  preventSubmitOnEnter = false
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (preventSubmitOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
  };

  const footer = (
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
      >
        {cancelText}
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-70 ${submitButtonClass}`}
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          submitText
        )}
      </button>
    </div>
  );

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
    >
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <div className="p-4">
          {children}
        </div>
        <div className="p-4 border-t">
          {footer}
        </div>
      </form>
    </Popup>
  );
};
