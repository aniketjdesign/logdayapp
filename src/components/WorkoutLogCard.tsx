import React, { useState } from 'react';
import { Calendar, Clock, MoreVertical, Trash2, Medal, Link2, Play } from 'lucide-react';
import { WorkoutLog } from '../types/workout';
import { useSettings } from '../context/SettingsContext';
import { ExerciseSetList } from './ExerciseSetList';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { generateUUID } from '../utils/uuid';
import { WorkoutDetailsModal } from './WorkoutDetailsModal';

interface WorkoutLogCardProps {
  log: WorkoutLog;
  onDelete: () => void;
}

export const WorkoutLogCard: React.FC<WorkoutLogCardProps> = ({ log, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { startWorkout } = useWorkout();
  const navigate = useNavigate();
  const { weightUnit, convertWeight } = useSettings();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${day}, ${formattedDate} at ${time}`;
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  };

  const getWorkoutStats = () => {
    let totalVolume = 0;
    let totalPRs = 0;
    let totalSets = 0;

    log.exercises.forEach(({ exercise, sets }) => {
      const isBodyweight = exercise.name.includes('(Bodyweight)');
      sets.forEach(set => {
        if (!isBodyweight && set.weight && set.performedReps) {
          const weight = weightUnit === 'lb' 
            ? convertWeight(set.weight, 'kg', 'lb')
            : set.weight;
          totalVolume += weight * parseInt(set.performedReps);
        }
        if (set.isPR) totalPRs++;
        totalSets++;
      });
    });

    return {
      volume: Math.round(totalVolume),
      prs: totalPRs,
      exercises: log.exercises.length,
      sets: totalSets
    };
  };

  const stats = getWorkoutStats();

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
        <div className="flex justify-between items-start mb-4">
          <div 
            className="flex-1"
            onClick={() => {
              if (window.innerWidth < 768) {
                setShowDetailsModal(true);
              } else {
                setIsExpanded(!isExpanded);
              }
            }}
          >
            <h3 className="text-lg font-bold text-gray-900">{log.name || 'Unnamed Workout'}</h3>
            <div className="mt-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar size={16} className="mr-1.5" />
                {formatDate(log.startTime)}
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                setShowMenu(!showMenu);
              }}
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
                <div 
                  className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-20"
                >
                  <div
                    onClick={() => {
                      handleRestartWorkout();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 flex items-center cursor-pointer"
                  >
                    <Play size={16} className="mr-2" />
                    Repeat Workout
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

        {/* Workout Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Time Spent</div>
            <div className="flex items-center text-sm font-medium">
                <Clock size={16} className="mr-1.5" />
                {formatDuration(log.duration)}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Volume</div>
            <div className="text-sm font-medium">
              {stats.volume.toLocaleString()} {weightUnit}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Sets</div>
            <div className="text-sm font-medium">
              {stats.exercises} exercises, {stats.sets} sets
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">PRs</div>
            <div className="flex items-center text-sm font-medium text-yellow-600">
              <Medal size={16} className="mr-1.5" />
              {stats.prs}
            </div>
          </div>
        </div>

        {/* Exercise Summary */}
        {window.innerWidth >= 768 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {/* Expanded Details - Desktop Only */}
      {isExpanded && window.innerWidth >= 768 && (
        <div className="border-t divide-y">
          {exerciseGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={`${group.length === 2 ? 'bg-lime-50/30' : ''} p-4`}>
              <div className="text-sm text-gray-500 mb-2">
                {group[0].exercise.muscleGroup}
              </div>
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

      {/* Mobile Details Modal */}
      {showDetailsModal && (
        <WorkoutDetailsModal
          log={log}
          onDelete={onDelete}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};