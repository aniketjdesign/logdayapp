import React from 'react';
import { AlertTriangle, X, Pencil } from 'lucide-react';
import { LoadingButton } from '../ui/LoadingButton';

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
  const [inputValue, setInputValue] = React.useState(initialValue);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    if (isOpen) {
      // Save current scroll position and body styles
      const scrollY = window.scrollY;
      const originalStyle = window.getComputedStyle(document.body);
      const originalOverflow = originalStyle.overflow;
      
      // Disable scroll and fix body position
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Re-enable scroll when modal closes
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = originalOverflow;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (mode === 'rename' && !inputValue.trim()) return;
    if (isLoading) return;

    setIsLoading(true);
    try {
      await onConfirm(mode === 'rename' ? inputValue : undefined);
    } catch (error) {
      console.error('Error in folder operation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onTouchMove={(e) => e.preventDefault()}
    >
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              {mode === 'delete' ? (
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              ) : (
                <Pencil className="h-6 w-6 text-blue-500" />
              )}
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600">{message}</p>
            {mode === 'rename' && (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter folder name"
                disabled={isLoading}
                autoFocus
              />
            )}
          </div>

          <div className="flex justify-end gap-x-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <LoadingButton
              onClick={handleConfirm}
              isLoading={isLoading}
              variant={mode === 'delete' ? 'danger' : 'primary'}
              className="text-sm font-medium"
            >
              {confirmText}
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
};
