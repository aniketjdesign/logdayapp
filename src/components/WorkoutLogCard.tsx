import React, { useState } from 'react';
import { Calendar, Clock, MoreVertical, Trash2, Medal, Link2, Play } from 'lucide-react';
import { WorkoutLog } from '../types/workout';
import { useSettings } from '../context/SettingsContext';
import { ExerciseSetList } from './ExerciseSetList';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { generateUUID } from '../utils/uuid';

interface WorkoutLogCardProps {
  log: WorkoutLog;
  onDelete: () => void;
}

export const WorkoutLogCard: React.FC<WorkoutLogCardProps> = ({ log, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { startWorkout } = useWorkout();
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const totalPRs = log.exercises.reduce((total, { sets }) => 
    total + sets.filter(set => set.isPR).length, 0
  );

  // Group exercises by superset
  const exerciseGroups = log.exercises.reduce((groups, exercise, index) => {
    if (exercise.supersetWith) {
      // If this exercise is part of a superset and comes first
      const partnerIndex = log.exercises.findIndex(ex => ex.exercise.id === exercise.supersetWith);
      if (index < partnerIndex) {
        groups.push([exercise, log.exercises[partnerIndex]]);
      }
    } else if (!log.exercises.some(ex => ex.supersetWith === exercise.exercise.id)) {
      // If this exercise is not part of any superset
      groups.push([exercise]);
    }
    return groups;
  }, [] as Array<Array<typeof log.exercises[0]>>);

  const handleRestartWorkout = () => {
    // Create new workout with same exercises and sets
    const exercises = log.exercises.map(({ exercise, sets, supersetWith }) => ({
      exercise,
      supersetWith,
      sets: sets.map(set => {
        // Preserve all set data except performed values
        const newSet = {
          ...set,
          id: generateUUID(),
          performedReps: '',  // Clear performed reps
          comments: '',       // Clear comments
          isPR: false        // Reset PR status
        };
        return newSet;
      })
    }));

    startWorkout(exercises.map(e => e.exercise), log.name, exercises);
    navigate('/workout');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div 
            className="flex-1 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <h3 className="text-lg font-bold text-gray-900">{log.name || 'Unnamed Workout'}</h3>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar size={16} className="mr-1.5" />
                {formatDate(log.startTime)}
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-1.5" />
                {formatDuration(log.duration)}
              </div>
              {totalPRs > 0 && (
                <div className="flex items-center text-yellow-600">
                  <Medal size={16} className="mr-1.5" />
                  {totalPRs} PR{totalPRs > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical size={20} className="text-gray-500" />
            </button>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
                  <div
                    onClick={() => {
                      handleRestartWorkout();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 flex items-center cursor-pointer"
                  >
                    <Play size={16} className="mr-2" />
                    Restart Workout
                  </div>
                  <div
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center cursor-pointer"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete Log
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Exercise Summary */}
        <div 
          className="flex flex-wrap gap-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {exerciseGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex items-center">
              {group.length === 2 ? (
                <div className="flex items-center bg-lime-50 rounded-lg p-1">
                  <span className="flex items-center px-2 py-1 text-xs font-medium text-lime-700">
                    <div className="w-2 h-2 mr-2 rounded-full bg-lime-500" />
                    {group[0].exercise.name}
                  </span>
                  <span className="w-px h-4 bg-lime-200 mx-1" />
                  <span className="px-2 py-1 text-xs font-medium text-lime-700">
                    {group[1].exercise.name}
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                  {group[0].exercise.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t divide-y">
          {exerciseGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={group.length === 2 ? 'bg-lime-50/30' : ''}>
              {group.length === 2 ? (
                <ExerciseSetList
                  exercise={group[0].exercise}
                  sets={group[0].sets}
                  supersetPartner={{
                    exercise: group[1].exercise,
                    sets: group[1].sets
                  }}
                />
              ) : (
                <ExerciseSetList
                  exercise={group[0].exercise}
                  sets={group[0].sets}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};