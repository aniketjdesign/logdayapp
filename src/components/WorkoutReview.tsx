import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Dumbbell, Medal, ClipboardList, Plus } from 'lucide-react';
import { WorkoutLog } from '../types/workout';

interface WorkoutReviewProps {
  workout: WorkoutLog;
  onClose: () => void;
}

export const WorkoutReview: React.FC<WorkoutReviewProps> = ({ workout, onClose }) => {
  const navigate = useNavigate();

  const calculateStats = () => {
    let totalWeight = 0;
    let totalSets = 0;
    let totalPRs = 0;

    workout.exercises.forEach(({ sets }) => {
      sets.forEach(set => {
        totalWeight += set.weight * (parseInt(set.performedReps) || 0);
        totalSets++;
        if (set.isPR) totalPRs++;
      });
    });

    return { totalWeight, totalSets, totalPRs };
  };

  const { totalWeight, totalSets, totalPRs } = calculateStats();
  const duration = Math.floor((new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / 1000);
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Workout Complete! 🎉</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 font-semibold">Duration</div>
              <div className="text-2xl font-bold">{formatDuration(duration)}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-600 font-semibold">Total Weight</div>
              <div className="text-2xl font-bold">{totalWeight.toLocaleString()} kg</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 font-semibold">Total Sets</div>
              <div className="text-2xl font-bold">{totalSets}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-yellow-600 font-semibold">PRs Achieved</div>
              <div className="text-2xl font-bold">{totalPRs}</div>
            </div>
          </div>

          <div className="space-y-6">
            {workout.exercises.map(({ exercise, sets }) => (
              <div key={exercise.id} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">{exercise.name}</h3>
                <div className="grid gap-2">
                  {sets.map(set => (
                    <div key={set.id} className="grid grid-cols-4 text-sm bg-white p-2 rounded">
                      <div>Set {set.setNumber}</div>
                      <div>{set.performedReps} reps</div>
                      <div>{set.weight} kg</div>
                      {set.isPR && (
                        <div className="text-yellow-500 flex items-center">
                          <Medal size={16} className="mr-1" />
                          PR Set
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/logs')}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ClipboardList size={20} className="mr-2" />
              Go to Logs
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Start New Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};