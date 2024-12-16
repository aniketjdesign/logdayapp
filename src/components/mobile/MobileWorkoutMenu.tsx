import React from 'react';
import { CheckCheck, PlayCircle, PauseCircle, MoveVertical, Clock, History, Settings, RefreshCw } from 'lucide-react';

interface MobileWorkoutMenuProps {
  isOpen: boolean;
  position: { top: number; right: number };
  isPaused: boolean;
  workoutRestTimer: boolean;
  onClose: () => void;
  onFinishWorkout: () => void;
  onPauseResume: () => void;
  onReorderExercises: () => void;
  onToggleWorkoutRestTimer: () => void;
  onNavigateToHistory: () => void;
  onNavigateToSettings: () => void;
  onRefresh: () => void;
}

export const MobileWorkoutMenu: React.FC<MobileWorkoutMenuProps> = ({
  isOpen,
  position,
  isPaused,
  workoutRestTimer,
  onClose,
  onFinishWorkout,
  onPauseResume,
  onReorderExercises,
  onToggleWorkoutRestTimer,
  onNavigateToHistory,
  onNavigateToSettings,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50" 
        onClick={onClose}
      />
      <div 
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          right: `${position.right}px`,
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto'
        }}
        className="bg-white rounded-lg shadow-lg z-50 min-w-[200px] py-1"
      >
        <button
          onClick={() => {
            onClose();
            onFinishWorkout();
          }}
          className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
        >
          <CheckCheck size={18} className="mr-3 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Finish Workout</span>
        </button>
        <button
          onClick={() => {
            onClose();
            onPauseResume();
          }}
          className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
        >
          {isPaused ? (
            <>
              <PlayCircle size={18} className="mr-3 text-gray-600" />
              <span className="text-sm font-medium">Resume Workout</span>
            </>
          ) : (
            <>
              <PauseCircle size={18} className="mr-3 text-gray-600" />
              <span className="text-sm font-medium">Pause Workout</span>
            </>
          )}
        </button>
        <button
          onClick={() => {
            onClose();
            onReorderExercises();
          }}
          className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
        >
          <MoveVertical size={18} className="mr-3 text-gray-600" />
          <span className="text-sm font-medium">Reorder Exercises</span>
        </button>
        <div className="w-full h-px bg-gray-100"/>
        <button
          onClick={() => {
            onToggleWorkoutRestTimer();
            onClose();
          }}
          className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
        >
          <Clock size={18} className={`mr-3 ${workoutRestTimer ? "text-gray-600" : "text-gray-600"}`} />
          <span className="text-sm font-medium">
            {workoutRestTimer ? 'Disable Rest Timers' : 'Enable Rest Timers'}
          </span>
        </button>
        <button
          onClick={() => {
            onClose();
            onNavigateToHistory();
          }}
          className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
        >
          <History size={18} className="mr-3 text-gray-600" />
          <span className="text-sm font-medium">Workout History</span>
        </button>
        <button
          onClick={() => {
            onClose();
            onNavigateToSettings();
          }}
          className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
        >
          <Settings size={18} className="mr-3 text-gray-600" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        <div className="w-full h-px bg-gray-100"/>
        <button
          onClick={() => {
            onClose();
            onRefresh();
          }}
          className="w-full flex items-center px-4 py-3 hover:bg-gray-50"
        >
          <RefreshCw size={18} className="mr-3 text-gray-600" />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>
    </>
  );
};
