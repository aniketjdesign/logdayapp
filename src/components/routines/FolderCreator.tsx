import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LoadingButton } from '../ui/LoadingButton';
import { RemoveScroll } from 'react-remove-scroll';

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

  return (
    <AnimatePresence>
      <RemoveScroll>
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <motion.div 
            className="fixed inset-0 bg-black z-40" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div 
            className="bg-white rounded-xl p-4 w-full max-w-md mx-4 z-50"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">New Folder</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
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
                type="submit"
                isLoading={isLoading}
                className="text-sm font-medium"
              >
                Create
              </LoadingButton>
            </div>
          </form>
          </motion.div>
        </div>
      </RemoveScroll>
    </AnimatePresence>
  );
};
