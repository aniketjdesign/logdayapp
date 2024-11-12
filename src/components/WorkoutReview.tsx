import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Dumbbell, Medal, ClipboardList, Plus } from 'lucide-react';
import { WorkoutLog } from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';
import { useSettings } from '../context/SettingsContext';

interface WorkoutReviewProps {
  workout: WorkoutLog;
  onClose: () => void;
}

export const WorkoutReview: React.FC<WorkoutReviewProps> = ({ workout, onClose }) => {
  const navigate = useNavigate();
  const { clearWorkoutState } = useWorkout();
  const { weightUnit, convertWeight } = useSettings();

  const calculateStats = () => {
    let totalWeight = 0;
    let totalSets = 0;
    let totalPRs = 0;
    let totalDistance = 0;
    let totalTime = 0;

    workout.exercises.forEach(({ exercise, sets }) => {
      const isBodyweight = exercise.name.includes('(Bodyweight)');
      const isCardio = exercise.muscleGroup === 'Cardio';

      sets.forEach(set => {
        if (isCardio) {
          if (set.distance) totalDistance += set.distance;
          if (set.time) {
            const [minutes = 0, seconds = 0] = set.time.split(':').map(Number);
            totalTime += minutes * 60 + seconds;
          }
        } else if (!isBodyweight && set.weight && set.performedReps) {
          const weight = weightUnit === 'lb' ? convertWeight(set.weight, 'kg', 'lb') : set.weight;
          totalWeight += weight * (parseInt(set.performedReps) || 0);
        }
        totalSets++;
        if (set.isPR) totalPRs++;
      });
    });

    return { totalWeight, totalSets, totalPRs, totalDistance, totalTime };
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const { totalWeight, totalSets, totalPRs, totalDistance, totalTime } = calculateStats();
  const duration = Math.floor((new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / 1000);

  const handleGoToLogs = () => {
    clearWorkoutState();
    onClose();
    navigate('/logs');
  };

  const handleStartNew = () => {
    clearWorkoutState();
    onClose();
    navigate('/');
  };

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full my-8 max-h-[80vh] flex flex-col relative">
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold">Workout Complete! 🎉</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2 -mt-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 font-semibold">Duration</div>
                <div className="text-2xl font-bold">{formatTime(duration)}</div>
              </div>
              {totalWeight > 0 && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-purple-600 font-semibold">Total Weight</div>
                  <div className="text-2xl font-bold">{totalWeight.toLocaleString()} {weightUnit}</div>
                </div>
              )}
              {totalDistance > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-green-600 font-semibold">Total Distance</div>
                  <div className="text-2xl font-bold">{totalDistance.toLocaleString()} m</div>
                </div>
              )}
              {totalTime > 0 && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-indigo-600 font-semibold">Total Time</div>
                  <div className="text-2xl font-bold">{formatTime(totalTime)}</div>
                </div>
              )}
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
              {workout.exercises.map(({ exercise, sets }) => {
                const isBodyweight = exercise.name.includes('(Bodyweight)');
                const isCardio = exercise.muscleGroup === 'Cardio';

                return (
                  <div key={exercise.id} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{exercise.name}</h3>
                    <div className="grid gap-2">
                      {sets.map(set => {
                        let displayMetrics = [];

                        if (isCardio) {
                          if (set.time) displayMetrics.push(`Time: ${set.time}`);
                          if (set.distance) displayMetrics.push(`Distance: ${set.distance}m`);
                          if (set.difficulty) displayMetrics.push(`Difficulty: ${set.difficulty}`);
                          if (set.incline) displayMetrics.push(`Incline: ${set.incline}%`);
                          if (set.pace) displayMetrics.push(`Pace: ${set.pace}`);
                          if (set.performedReps) displayMetrics.push(`Reps: ${set.performedReps}`);
                        } else {
                          const displayWeight = isBodyweight 
                            ? 'BW'
                            : weightUnit === 'lb' 
                              ? convertWeight(set.weight, 'kg', 'lb').toFixed(2)
                              : set.weight;
                          displayMetrics.push(`${displayWeight} ${!isBodyweight ? weightUnit : ''}`);
                          displayMetrics.push(`${set.performedReps} reps`);
                        }

                        return (
                          <div key={set.id} className="grid grid-cols-[1fr_auto] text-sm bg-white p-2 rounded">
                            <div className="flex items-center space-x-4">
                              <span>Set {set.setNumber}</span>
                              {displayMetrics.map((metric, index) => (
                                <span key={index}>{metric}</span>
                              ))}
                            </div>
                            {set.isPR && (
                              <div className="text-yellow-500 flex items-center">
                                <Medal size={16} className="mr-1" />
                                PR Set
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoToLogs}
              className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm sm:text-base sm:px-4"
            >
              <ClipboardList size={20} className="mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Go to Logs</span>
            </button>
            <button
              onClick={handleStartNew}
              className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base sm:px-4"
            >
              <Plus size={20} className="mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Start New</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};