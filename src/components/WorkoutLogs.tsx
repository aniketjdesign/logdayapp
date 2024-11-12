import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Dumbbell, MoreVertical, Trash2, ArrowLeft, Plus } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from './ConfirmationModal';
import { OngoingWorkoutMessage } from './OngoingWorkoutMessage';

export const WorkoutLogs: React.FC = () => {
  const { workoutLogs, searchLogs, deleteLog, currentWorkout } = useWorkout();
  const { weightUnit, convertWeight } = useSettings();
  const [search, setSearch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    searchLogs(search);
  }, [search]);

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

  const handleDeleteClick = (logId: string) => {
    setSelectedLogId(logId);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedLogId) {
      await deleteLog(selectedLogId);
      setShowDeleteModal(false);
      setSelectedLogId(null);
    }
  };

  const toggleMenu = (logId: string) => {
    setOpenMenuId(openMenuId === logId ? null : logId);
  };

  if (workoutLogs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Workout History</h1>
        <p className="text-sm text-gray-600 mb-4">View your past workouts</p>

        {currentWorkout && <OngoingWorkoutMessage />}
        <div className="text-center py-8 sm:py-12">
          <div className="flex justify-center mb-4">
            <Dumbbell className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
            {currentWorkout 
              ? "Complete Your Workout to See Logs"
              : "No workout logs yet"}
          </h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">
            {currentWorkout 
              ? "Your workout logs will appear here once you finish your current workout"
              : "Start your fitness journey by logging your first workout"}
          </p>
          <button
            onClick={() => navigate(currentWorkout ? '/workout' : '/')}
            className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {currentWorkout ? (
              <>
                <ArrowLeft size={18} className="mr-1.5 sm:mr-2" />
                Return to Workout
              </>
            ) : (
              <>
                <Plus size={18} className="mr-1.5 sm:mr-2" />
                Start Your First Workout
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {currentWorkout && <OngoingWorkoutMessage />}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Workout History</h1>
        <p className="text-sm text-gray-600 mb-4">View your past workouts</p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search workouts..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {workoutLogs.map(log => (
          <div key={log.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold">{log.name || 'Unnamed Workout'}</h3>
              <div className="relative">
                <button
                  onClick={() => toggleMenu(log.id)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreVertical size={20} className="text-gray-500" />
                </button>
                {openMenuId === log.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <button
                      onClick={() => handleDeleteClick(log.id)}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center transition-colors"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Log
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <Calendar size={14} className="mr-1" />
                {formatDate(log.startTime)}
              </div>
              <div className="flex items-center">
                <Clock size={14} className="mr-1" />
                {formatDuration(log.duration)}
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {log.exercises.map(({ exercise, sets }) => {
                const isBodyweight = exercise.name.includes('(Bodyweight)');
                return (
                  <div key={exercise.id} className="border-t pt-4">
                    <h4 className="font-medium mb-3 text-sm sm:text-base">{exercise.name}</h4>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="min-w-full inline-block align-middle">
                        <table className="min-w-full">
                          <thead>
                            <tr className="text-left text-xs sm:text-sm text-gray-500">
                              <th className="pb-2 pr-4 pl-4 sm:pl-0">Set</th>
                              <th className="pb-2 pr-4">Reps</th>
                              <th className="pb-2 pr-4">Weight {!isBodyweight && `(${weightUnit})`}</th>
                              <th className="pb-2">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs sm:text-sm">
                            {sets.map(set => (
                              <tr key={set.id} className="border-t border-gray-100">
                                <td className="py-2 pr-4 pl-4 sm:pl-0">Set {set.setNumber}</td>
                                <td className="py-2 pr-4">{set.performedReps}</td>
                                <td className="py-2 pr-4">
                                  {isBodyweight ? 'BW' : weightUnit === 'lb' 
                                    ? convertWeight(set.weight, 'kg', 'lb').toFixed(2)
                                    : set.weight}
                                </td>
                                <td className="py-2 flex items-center">
                                  <span className="truncate">{set.comments}</span>
                                  {set.isPR && (
                                    <span className="ml-2 text-yellow-500 flex-shrink-0">PR ⭐ </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Workout Log?"
        message="This action cannot be undone. Are you sure you want to delete this workout log?"
        confirmText="Delete Log"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};