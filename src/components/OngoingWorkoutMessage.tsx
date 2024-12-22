import React from 'react';
import { AlertCircle, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OngoingWorkoutMessage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="my-2 bg-blue-50 border border-blue-200 rounded-xl p-4 sm:flex sm:items-center sm:justify-between">
      <div className="flex items-center mb-3 sm:mb-0">
        <Clock className="h-4 w-4 text-blue-500 mr-1 flex-shrink-0" />
        <span className="text-blue-700 text-sm sm:text-base font-medium">You have an ongoing workout</span>
      </div>
      <button
        onClick={() => navigate('/workout')}
        className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium flex items-center justify-center sm:justify-start transition-colors"
      >
        <ArrowLeft size={16} className="mr-1.5" />
        Return to Workout
      </button>
    </div>
  );
};