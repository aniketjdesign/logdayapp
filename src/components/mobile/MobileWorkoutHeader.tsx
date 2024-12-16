import React from 'react';
import { MoreVertical, Plus, Timer } from 'lucide-react';
import { CircularProgress } from '../CircularProgress';

interface MobileWorkoutHeaderProps {
  workoutName: string;
  duration: number;
  isPaused: boolean;
  stats: {
    exercises: {
      completed: number;
      total: number;
      progress: number;
      color: string;
    };
    sets: {
      completed: number;
      total: number;
      progress: number;
      color: string;
    };
  };
  onNameChange: (name: string) => void;
  onMenuToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onAddExercise: () => void;
  onPauseResume: () => void;
}

export const MobileWorkoutHeader: React.FC<MobileWorkoutHeaderProps> = ({
  workoutName,
  duration,
  isPaused,
  stats,
  onNameChange,
  onMenuToggle,
  onAddExercise,
  onPauseResume,
}) => {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b z-40">
      <div className="flex items-center justify-between p-4 gap-4">
        <input
          type="text"
          placeholder="Workout Name"
          className="flex-1 px-2 py-1 text-md font-medium bg-transparent rounded-lg border text-gray-800"
          value={workoutName}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <div className="flex items-center space-x-2">
          <button
            onClick={onMenuToggle}
            className="p-2.5 bg-blue-50 rounded-lg"
          >
            <MoreVertical strokeWidth={2} size={16} className="font-normal text-blue-600"/>
          </button>
          <button
            onClick={onAddExercise}
            className="p-2.5 bg-blue-600 rounded-lg text-[#FFFFFF]"
          >
            <Plus strokeWidth={2} size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-2 pb-4">
        <button 
          onClick={onPauseResume}
          className={`flex items-center space-x-1 ${isPaused ? "text-yellow-600" : "text-gray-600"}`}
        >
          <Timer size={18} className={isPaused ? "text-yellow-600" : "text-gray-500"} />
          <span className={`text-sm font-medium ${isPaused ? "text-yellow-600" : "text-gray-600"}`}>
            {formatTime(duration)}
          </span>
        </button>
        <div className="separator w-px h-4 bg-gray-200"/>
        <div className="flex items-center space-x-2">
          <CircularProgress 
            progress={stats.exercises.progress} 
            color={stats.exercises.color}
          />
          <span className="text-sm font-medium text-gray-600">
            {stats.exercises.completed}/{stats.exercises.total} exercises
          </span>
        </div>
        <div className="separator w-px h-4 bg-gray-200"/>
        <div className="flex items-center space-x-2">
          <CircularProgress 
            progress={stats.sets.progress} 
            color={stats.sets.color}
          />
          <span className="text-sm font-medium text-gray-600">
            {stats.sets.completed}/{stats.sets.total} sets
          </span>
        </div>
      </div>
    </div>
  );
};
