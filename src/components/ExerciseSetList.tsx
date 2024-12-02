import React from 'react';
import { Medal, Link2, Target } from 'lucide-react';
import { Exercise, WorkoutSet } from '../types/workout';
import { useSettings } from '../context/SettingsContext';

interface ExerciseSetListProps {
  exercise: Exercise;
  sets: WorkoutSet[];
  supersetPartner?: { exercise: Exercise; sets: WorkoutSet[] };
}

export const ExerciseSetList: React.FC<ExerciseSetListProps> = ({ exercise, sets, supersetPartner }) => {
  const { weightUnit, convertWeight } = useSettings();
  const isBodyweight = exercise.name.includes('(Bodyweight)');
  const isCardio = exercise.muscleGroup === 'Cardio';
  const isTimeBasedCore = exercise.muscleGroup === 'Core' && exercise.metrics?.time;

  const formatSetDisplay = (set: WorkoutSet) => {
    if (isCardio || isTimeBasedCore) {
      return set.time || '-';
    }
    
    const weight = isBodyweight ? 'BW' : `${set.weight || 0} ${weightUnit}`;
    const reps = set.performedReps || '-';
    
    return { weight, reps, target: set.targetReps };
  };

  const getSetValue = (set: WorkoutSet, field: string) => {
    switch (field) {
      case 'Weight':
        if (isBodyweight) return 'BW';
        const weight = set.weight || 0;
        return weightUnit === 'lb' 
          ? `${convertWeight(weight, 'kg', 'lb').toFixed(2)} ${weightUnit}`
          : `${weight} ${weightUnit}`;
      case 'Goal':
        return set.targetReps || '-';
      case 'Actual':
        return set.performedReps?.toString() || '-';
      case 'Time':
        return set.time || '-';
      case 'Distance':
        return set.distance ? `${set.distance}m` : '-';
      case 'Difficulty':
        return set.difficulty || '-';
      case 'Incline':
        return set.incline ? `${set.incline}%` : '-';
      case 'Pace':
        return set.pace || '-';
      default:
        return '-';
    }
  };

  const getHeaders = () => {
    if (isCardio) {
      const headers = ['Time'];
      if (exercise.metrics?.distance) headers.push('Distance');
      if (exercise.metrics?.difficulty) headers.push('Difficulty');
      if (exercise.metrics?.incline) headers.push('Incline');
      if (exercise.metrics?.pace) headers.push('Pace');
      if (exercise.metrics?.reps) headers.push('Reps');
      return headers;
    }
    if (isTimeBasedCore) {
      return ['Time'];
    }
    return ['Weight', 'Goal', 'Actual'];
  };

  const getSetTags = (set: WorkoutSet) => {
    const tags = [];
    
    if (set.isWarmup) {
      tags.push(
        <span key="warmup" className="text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
          W
        </span>
      );
    }
    if (set.isPR) {
      tags.push(
        <span key="pr" className="text-xs font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
          PR
        </span>
      );
    }
    if (set.isFailure) {
      tags.push(
        <span key="failure" className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
          F
        </span>
      );
    }
    if (set.isDropset) {
      tags.push(
        <span key="dropset" className="text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
          D
        </span>
      );
    }
    
    return tags;
  };

  const renderExerciseSets = (exercise: Exercise, sets: WorkoutSet[], isSecondary = false) => (
    <>
      <h4 className={`font-medium mb-3 ${isSecondary ? 'text-lime-800' : 'text-gray-900'}`}>
        {exercise.name}
      </h4>
      
      {/* Desktop View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="pr-4 font-medium w-20">SET</th>
              {getHeaders().map(header => (
                <th key={header} className="pr-4 font-medium">{header}</th>
              ))}
              <th className="pr-4 font-medium">NOTES</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {sets.map((set, index) => (
              <tr key={set.id} className="border-t border-gray-100">
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-700">{index + 1}</span>
                    {getSetTags(set)}
                  </div>
                </td>
                {getHeaders().map(header => (
                  <td key={header} className="py-2 pr-4 font-medium">
                    {getSetValue(set, header)}
                  </td>
                ))}
                <td className="py-2 pr-4">
                  {set.comments && (
                    <span className="text-gray-600 text-sm">{set.comments}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden space-y-3">
        <div className="text-sm">
          {sets.map((set, index) => (
          <div key={set.id} className="flex items-center gap-2 py-2">
            <span className="w-6 text-gray-500">{index + 1}</span>
            <span className="flex-1 font-medium">
              {(() => {
                const display = formatSetDisplay(set);
                return (
                  <div className="flex items-center gap-2">
                    <span>{display.weight} × {display.reps}</span>
                    {display.target && (
                      <div className="flex items-center text-gray-500 text-xs">
                        <Target size={12} className="mr-0.5" />
                        {display.target}
                      </div>
                    )}
                  </div>
                );
              })()}
            </span>
            <div className="flex items-center gap-1">
              {set.isPR && (
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">PR</span>
              )}
              {set.isWarmup && (
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">W</span>
              )}
              {set.isDropset && (
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">D</span>
              )}
              {set.isFailure && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">F</span>
              )}
            </div>
          </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="p-4 border-b last:border-b-0">
      {supersetPartner ? (
        <>
          <div className="flex items-center gap-2 mb-4 text-lime-700">
            <div className="flex items-center px-3 py-1.5 bg-lime-100 rounded-lg gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-lime-500" />
              <span className="font-medium text-sm">Superset</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative">
              {renderExerciseSets(exercise, sets)}
              <div className="absolute -right-3 top-1/2 hidden lg:block">
                <div className="w-6 h-px bg-lime-400" />
              </div>
            </div>
            <div className="relative">
              {renderExerciseSets(supersetPartner.exercise, supersetPartner.sets, true)}
              <div className="absolute -left-3 top-1/2 hidden lg:block">
                <div className="w-6 h-px bg-lime-400" />
              </div>
            </div>
          </div>
        </>
      ) : (
        renderExerciseSets(exercise, sets)
      )}
    </div>
  );
};