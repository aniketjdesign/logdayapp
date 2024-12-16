import React from 'react';

interface MobileExerciseTabsProps {
  activeTab: 'log' | 'previous';
  onTabChange: (tab: 'log' | 'previous') => void;
}

export const MobileExerciseTabs: React.FC<MobileExerciseTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex border-b border-gray-100">
      <button
        className={`px-3 py-1.5 text-sm font-medium ${
          activeTab === 'log'
            ? 'text-gray-900 border-b-2 border-gray-200 bg-gray-50'
            : 'text-gray-500 hover:text-gray-500'
        }`}
        onClick={() => onTabChange('log')}
      >
        Log
      </button>
      <button
        className={`px-3 py-1.5 text-sm font-medium ${
          activeTab === 'previous'
            ? 'text-gray-900 border-b-2 border-gray-200 bg-gray-50'
            : 'text-gray-500 hover:text-gray-500'
        }`}
        onClick={() => onTabChange('previous')}
      >
        Previous
      </button>
    </div>
  );
};
