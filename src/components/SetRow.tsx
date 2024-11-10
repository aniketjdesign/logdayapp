import React from 'react';
import { X, Medal } from 'lucide-react';
import { WorkoutSet } from '../types/workout';
import { useSettings } from '../context/SettingsContext';

interface SetRowProps {
  set: WorkoutSet;
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
}

export const SetRow: React.FC<SetRowProps> = ({ set, onUpdate, onDelete }) => {
  const { weightUnit } = useSettings();

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:grid md:grid-cols-[35px_1fr_1fr_1fr_1.2fr_100px] gap-2 items-center">
        <div className="flex items-center justify-center">
          <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-gray-700 text-sm">
            {set.setNumber}
          </span>
        </div>
        <input
          type="number"
          step="0.25"
          min="0"
          placeholder="-"
          className="px-2 py-1.5 border border-gray-300 rounded-md text-sm w-full"
          value={set.weight || ''}
          onChange={(e) => onUpdate('weight', e.target.value)}
        />
        <input
          type="number"
          min="0"
          placeholder="0"
          className="px-2 py-1.5 border border-gray-300 rounded-md text-sm w-full"
          value={set.targetReps || ''}
          onChange={(e) => onUpdate('targetReps', parseInt(e.target.value))}
        />
        <input
          type="text"
          placeholder="0"
          className="px-2 py-1.5 border border-gray-300 rounded-md text-sm w-full"
          value={set.performedReps}
          onChange={(e) => onUpdate('performedReps', e.target.value)}
        />
        <input
          type="text"
          placeholder="Add note"
          className="px-2 py-1.5 border border-gray-300 rounded-md text-sm w-full"
          value={set.comments}
          onChange={(e) => onUpdate('comments', e.target.value)}
        />
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onUpdate('isPR', !set.isPR)}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-all ${
              set.isPR 
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' 
                : 'border border-yellow-400 text-yellow-600 hover:bg-yellow-50'
            }`}
          >
            <Medal size={14} />
            <span>PR</span>
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:bg-red-50 rounded-full"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-gray-700 text-sm">
              {set.setNumber}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onUpdate('isPR', !set.isPR)}
              className={`px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-all ${
                set.isPR 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' 
                  : 'border border-yellow-400 text-yellow-600'
              }`}
            >
              <Medal size={14} />
              <span>PR</span>
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-red-600 rounded-full"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="relative">
            <input
              type="number"
              step="0.25"
              min="0"
              placeholder="Weight"
              className="px-2 py-1.5 border border-gray-300 rounded-md text-sm w-full pr-8"
              value={set.weight || ''}
              onChange={(e) => onUpdate('weight', e.target.value)}
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              {weightUnit}
            </span>
          </div>
          <input
            type="number"
            min="0"
            placeholder="Goal"
            className="px-2 py-1.5 border border-gray-300 rounded-md text-sm"
            value={set.targetReps || ''}
            onChange={(e) => onUpdate('targetReps', parseInt(e.target.value))}
          />
          <input
            type="text"
            placeholder="Actual"
            className="px-2 py-1.5 border border-gray-300 rounded-md text-sm"
            value={set.performedReps}
            onChange={(e) => onUpdate('performedReps', e.target.value)}
          />
        </div>
        <input
          type="text"
          placeholder="Notes"
          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
          value={set.comments}
          onChange={(e) => onUpdate('comments', e.target.value)}
        />
      </div>
    </>
  );
};