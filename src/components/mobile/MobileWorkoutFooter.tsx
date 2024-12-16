import React from 'react';
import { CheckCheck, X } from 'lucide-react';

interface MobileWorkoutFooterProps {
  onFinish: () => void;
  onCancel: () => void;
}

export const MobileWorkoutFooter: React.FC<MobileWorkoutFooterProps> = ({
  onFinish,
  onCancel,
}) => {
  return (
    <div className="space-y-3 mt-6 mb-20">
      <button
        onClick={onFinish}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center"
      >
        <CheckCheck size={20} className="mr-2" />
        Finish Workout
      </button>
      <button
        onClick={onCancel}
        className="w-full py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors flex items-center justify-center"
      >
        <X size={20} className="mr-2" />
        Cancel Workout
      </button>
    </div>
  );
};
