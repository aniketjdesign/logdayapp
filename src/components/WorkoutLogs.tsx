import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Dumbbell } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';

export const WorkoutLogs: React.FC = () => {
  const { workoutLogs, searchLogs } = useWorkout();
  const [search, setSearch] = useState('');
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search workouts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {workoutLogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <Dumbbell className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No workout logs yet</h3>
          <p className="text-gray-500 mb-6">Start your fitness journey by logging your first workout</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Start Your First Workout
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {workoutLogs.map(log => (
            <div key={log.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{log.name || 'Unnamed Workout'}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-1" />
                    {formatDate(log.startTime)}
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-1" />
                    {formatDuration(log.duration)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {log.exercises.map(({ exercise, sets }) => (
                  <div key={exercise.id} className="border-t pt-4">
                    <h4 className="font-medium mb-2">{exercise.name}</h4>
                    <div className="grid gap-2">
                      {sets.map(set => (
                        <div key={set.id} className="grid grid-cols-5 text-sm">
                          <div>Set {set.setNumber}</div>
                          <div>{set.performedReps} reps</div>
                          <div>{set.weight}kg</div>
                          <div>{set.comments}</div>
                          {set.isPR && (
                            <div className="text-yellow-500 flex items-center">
                              PR Set ⭐
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};