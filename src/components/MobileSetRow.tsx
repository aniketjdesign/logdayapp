import React, { useState } from 'react';
import { MoreVertical, X } from 'lucide-react';
import { WorkoutSet } from '../types/workout';

interface MobileSetRowProps {
  set: WorkoutSet;
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
  onOpenNoteModal: () => void;
}

export const MobileSetRow: React.FC<MobileSetRowProps> = ({
  set,
  onUpdate,
  onDelete,
  onOpenNoteModal,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="grid grid-cols-[50px_1fr_1fr_1fr_32px] gap-2 items-center py-1 relative">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-600 mr-1">{set.setNumber}</span>
        <div className="relative flex -space-x-1">
          {set.isPR && (
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          )}
          {set.comments && (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          )}
        </div>
      </div>
      <input
        type="number"
        step="0.25"
        min="0"
        placeholder="-"
        className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm w-full"
        value={set.weight || ''}
        onChange={(e) => onUpdate('weight', e.target.value)}
      />
      <input
        type="number"
        min="0"
        placeholder="0"
        className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm w-full"
        value={set.targetReps || ''}
        onChange={(e) => onUpdate('targetReps', parseInt(e.target.value))}
      />
      <input
        type="text"
        placeholder="0"
        className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm w-full"
        value={set.performedReps}
        onChange={(e) => onUpdate('performedReps', e.target.value)}
      />
      <button
        onClick={() => setShowMenu(true)}
        className="p-1 hover:bg-gray-100 rounded-lg flex justify-center h-8"
      >
        <MoreVertical size={20} />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 animate-slide-up">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-3" />
            <div className="p-4 space-y-2">
              <button
                onClick={() => {
                  onUpdate('isPR', !set.isPR);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-base flex items-center space-x-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <span>{set.isPR ? 'Remove PR' : 'Mark as PR'}</span>
              </button>
              <button
                onClick={() => {
                  onOpenNoteModal();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-base flex items-center space-x-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Add Note</span>
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-base flex items-center space-x-3 hover:bg-gray-50 rounded-lg text-red-600"
              >
                <X size={16} />
                <span>Delete Set</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};