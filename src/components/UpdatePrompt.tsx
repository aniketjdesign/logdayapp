import React from 'react';
import { RefreshCw } from 'lucide-react';

interface UpdatePromptProps {
  onUpdate: () => void;
}

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({ onUpdate }) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-between z-50 animate-fade-in">
      <span className="text-sm">A new version is available!</span>
      <button
        onClick={onUpdate}
        className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium flex items-center"
      >
        <RefreshCw size={16} className="mr-2" />
        Update Now
      </button>
    </div>
  );
};