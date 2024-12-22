import React from 'react';
import { ClipboardList, BarChart2, LineChart } from 'lucide-react';

interface MobileExerciseTabsProps {
  activeTab: 'log' | 'previous';
  onTabChange: (tab: 'log' | 'previous') => void;
}

export const MobileExerciseTabs: React.FC<MobileExerciseTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex space-x-1 p-[2px] rounded-lg border border-gray-100">
      <button
        className={`p-1.5 rounded-md transition-colors ${
          activeTab === 'log'
            ? 'text-gray-600 bg-gray-100 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => onTabChange('log')}
      >
        <ClipboardList size={18} strokeWidth={1.5}/>
      </button>
      <button
        className={`p-1.5 rounded-md transition-colors ${
          activeTab === 'previous'
            ? 'text-gray-600 bg-gray-100 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => onTabChange('previous')}
      >
        <LineChart size={18} strokeWidth={1.5}/>
      </button>
    </div>
  );
};
