import React from 'react';
import { Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OngoingWorkoutMessage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="bg-slate-700 rounded-b-2xl p-4 w-full sm:flex sm:items-center sm:justify-between" style={{ position: 'relative', zIndex: 999, pointerEvents: 'auto' }}>
        <div className="flex justify-center items-start mb-3 sm:mb-0">
          <Clock className="h-3 w-3 text-white mr-1 flex-shrink-0 mt-1" />
          <span className="text-white text-sm sm:text-base">You have an ongoing workout. Changes to Settings and Routines won't apply until the next session.</span>
        </div>
        <button
          onClick={() => navigate('/workout')}
          className="w-full sm:w-auto px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium flex items-center justify-center sm:justify-start transition-colors"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Return to Workout
        </button>
      </div>
    </>
  );
};