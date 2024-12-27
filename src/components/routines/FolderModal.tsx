import React from 'react';
import { AlertTriangle, X, Pencil } from 'lucide-react';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value?: string) => void;
  title: string;
  message: string;
  confirmText: string;
  mode: 'rename' | 'delete';
  initialValue?: string;
  confirmButtonClass?: string;
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
  confirmButtonClass = mode === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
}) => {
  const [inputValue, setInputValue] = React.useState(initialValue);

  React.useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (mode === 'rename' && !inputValue.trim()) return;
    onConfirm(mode === 'rename' ? inputValue : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
              className="p-2 hover:bg-gray-100 rounded-full -mr-2 -mt-2"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{message}</p>

          {mode === 'rename' && (
            <div className="mb-6">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter folder name"
                className="w-full p-2 border rounded-lg"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputValue.trim()) {
                    handleConfirm();
                  }
                  if (e.key === 'Escape') {
                    onClose();
                  }
                }}
              />
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${confirmButtonClass} ${
                mode === 'rename' && !inputValue.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={mode === 'rename' && !inputValue.trim()}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
