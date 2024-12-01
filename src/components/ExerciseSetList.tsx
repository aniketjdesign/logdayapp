import React from 'react';
import { Medal, Link2 } from 'lucide-react';
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
      case 'Done':
        return set.performedReps || '-';
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
        {sets.map((set, index) => (
          <div 
            key={set.id}
            className={`p-3 rounded-lg ${
              isSecondary ? 'bg-lime-50/50' : 'bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-700">Set {index + 1}</span>
                {getSetTags(set)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {getHeaders().map(header => (
                <div key={header}>
                  <span className="text-gray-500">{header}:</span>{' '}
                  <span className="font-medium">{getSetValue(set, header)}</span>
                </div>
              ))}
            </div>
            {set.comments && (
              <div className="mt-2 text-sm text-gray-600 bg-white/50 p-2 rounded">
                {set.comments}
              </div>
            )}
          </div>
        ))}
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