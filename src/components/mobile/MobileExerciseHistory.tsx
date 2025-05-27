import React from 'react';
import { FileText, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Exercise, WorkoutLog } from '../../types/workout';
import { useSettings } from '../../context/SettingsContext';

interface MobileExerciseHistoryProps {
  exercise: Exercise;
  exerciseHistory?: { [exerciseId: string]: WorkoutLog[] };
  weightUnit: string;
  showChart: boolean;
  onToggleChart: () => void;
  contentHeight?: number;
}

export const MobileExerciseHistory: React.FC<MobileExerciseHistoryProps> = ({
  exercise,
  exerciseHistory,
  weightUnit,
  showChart,
  onToggleChart,
  contentHeight = 0,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  const { convertWeight } = useSettings();

  const formatSet = (set: any) => {
    if (exercise.metrics?.time) {
      return `${set.time}${set.distance ? ` | ${set.distance}km` : ''}`;
    }
    // Convert weight from kgs to lbs or vice versa based on current weightUnit setting
    const displayWeight = set.weight ? convertWeight(set.weight, 'kgs', weightUnit as 'kgs' | 'lbs').toFixed(1) : '0';
    return `${displayWeight}${weightUnit} x ${set.performedReps}`;
  };

  const getExerciseProgressionData = () => {
    if (!exerciseHistory?.[exercise.id]) return [];
    
    return exerciseHistory[exercise.id]
      .map(workout => {
        const exerciseData = workout.exercises.find(e => e.exercise.id === exercise.id);
        if (!exerciseData) return null;
        
        const maxWeightSet = exerciseData.sets.reduce((maxSet, currentSet) => {
          const currentWeight = currentSet.weight || 0;
          const maxWeight = maxSet ? maxSet.weight || 0 : 0;
          return currentWeight > maxWeight ? currentSet : maxSet;
        }, exerciseData.sets[0]);

        const movementNumber = workout.exercises.findIndex(e => e.exercise.id === exercise.id) + 1;
        const totalMovements = workout.exercises.length;
        
        // Convert the weight based on current weight unit setting
        const convertedWeight = maxWeightSet?.weight ? 
          convertWeight(maxWeightSet.weight, 'kgs', weightUnit as 'kgs' | 'lbs') : 0;
        
        return {
          date: new Date(workout.startTime),
          formattedDate: new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
          }).format(new Date(workout.startTime)),
          weight: convertedWeight,
          originalWeight: maxWeightSet?.weight || 0,
          reps: maxWeightSet?.performedReps || '0',
          movementInfo: `Exercise #${movementNumber} of ${totalMovements}`
        };
      })
      .filter(data => data !== null && data.weight > 0)
      .sort((a, b) => a!.date.getTime() - b!.date.getTime());
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Weight: {data.weight.toFixed(1)}{weightUnit}
          </p>
          <p className="text-sm text-gray-600">
            Reps: {data.reps}
          </p>
          <p className="text-sm text-gray-600">
            {data.movementInfo}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-2" >
      <div className="flex justify-between items-center">
        <div className="flex space-x-1 items-center">
          <FileText size={14} strokeWidth={1.33} className="text-gray-500" />
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-700">Performance</h4>
            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">Beta</span>
          </div>
        </div>
        <button
          onClick={onToggleChart}
          className={`p-1 rounded-md ${
            showChart 
              ? 'bg-gray-100 border border-white text-gray-900' 
              : 'bg-white border border-gray-200 text-gray-900 hover:text-gray-700'
          }`}
        >
          <BarChart2 size={16} strokeWidth={1.5} />
        </button>
      </div>

      {showChart ? (
        <div className="bg-white rounded-lg pr-2 ml-[-2.5rem]">
          <div className="w-auto h-[160px]">
            {(() => {
              const data = getExerciseProgressionData();
              if (data.length === 0) return (
                <div className="flex items-center justify-center h-full text-sm text-gray-500">
                  No progression data available
                </div>
              );
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="formattedDate" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: "#2563eb" }} activeDot={{ r: 5, fill: "#2563eb" }} />
                  </LineChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto space-y-4 py-1" style={{ height: `${contentHeight}px` }}>
          {exerciseHistory?.[exercise.id]?.map((workout, index) => (
            <div key={`${workout.id}-${index}`} className="space-y-2 w-auto bg-gray-50 pb-2 rounded-md overflow-hidden ">
              <div className="flex items-center justify-between pl-2 pr-1 py-1 bg-gray-100 space-y-4">
                <div className="flex items-center justify-between w-full">                        
                  <span className="text-xs font-medium text-gray-900">
                    {formatDate(workout.startTime)}
                  </span>
                  <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded">
                    {(() => {
                      const exercisesWithTimestamp = workout.exercises
                        .map((e, originalIndex) => ({
                          ...e,
                          originalIndex: originalIndex + 1,
                          // Use the first set's time property if available, or fall back to the workout start time
                          firstSetTime: e.sets[0]?.time || workout.startTime
                        }))
                        .sort((a, b) => {
                          if (a.firstSetTime && b.firstSetTime) {
                            return new Date(a.firstSetTime).getTime() - new Date(b.firstSetTime).getTime();
                          }
                          return a.originalIndex - b.originalIndex;
                        });
                      
                      const position = exercisesWithTimestamp.findIndex(e => e.exercise.id === exercise.id) + 1;
                      return `Exercise #${position} on this day`;
                    })()}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 bg-gray-50">
                {workout.exercises.find(e => e.exercise.id === exercise.id)?.sets.map((set) => (
                  <div key={set.id} className="flex items-center gap-3 text-xs px-2.5">
                    <span className="font-medium text-gray-700">
                      {formatSet(set)}
                    </span>
                    {set.isPR && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">
                        PR
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(!exerciseHistory?.[exercise.id] || exerciseHistory[exercise.id].length === 0) && (
            <div className="text-center text-gray-500 py-8">
              No previous workout data available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
