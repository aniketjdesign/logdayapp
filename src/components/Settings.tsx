import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { Scale, Lock, Clock, Home } from 'lucide-react';
import { OngoingWorkoutMessage } from './OngoingWorkoutMessage';

export const Settings: React.FC = () => {
  const { weightUnit, setWeightUnit, disableRestTimer, setDisableRestTimer, defaultHomePage, setDefaultHomePage } = useSettings();
  const { currentWorkout } = useWorkout();
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const handlePasswordUpdate = async () => {
    if (!newPassword) return;
    
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    
    try {
      await updatePassword(newPassword);
      setUpdateSuccess(true);
      setNewPassword('');
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-32">
      {currentWorkout && <OngoingWorkoutMessage />}

      <div className={`${currentWorkout ? 'opacity-50 pointer-events-none' : ''}`}>
        <h2 className="text-lg font-bold mb-6">Settings</h2>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col items-start gap-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Scale className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex flex-col mx-0">
                <h3 className="text-lg font-semibold mb-0">Weight Unit</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Choose your preferred unit for tracking weights
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setWeightUnit('kgs')}
                    className={`px-4 py-2 rounded-lg text-left ${
                      weightUnit === 'kgs'
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    Kilograms (kg)
                  </button>
                  <button
                    onClick={() => setWeightUnit('lbs')}
                    className={`px-4 py-2 rounded-lg text-left ${
                      weightUnit === 'lbs'
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    Pounds (lbs)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col items-start gap-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex flex-col mx-0">
                <h3 className="text-lg font-semibold mb-0">Rest Timer</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Toggle rest timer for all workouts
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setDisableRestTimer(true)}
                    className={`px-4 py-2 rounded-lg text-left ${
                      disableRestTimer
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    Disable Rest Timer
                  </button>
                  <button
                    onClick={() => setDisableRestTimer(false)}
                    className={`px-4 py-2 rounded-lg text-left ${
                      !disableRestTimer
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    Enable Rest Timer
                  </button>
                  <p className="text-gray-500 text-xs mt-1 px-2">
                    You can still enable rest timers for individual workouts while in a workout session
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col items-start gap-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex flex-col mx-0">
                <h3 className="text-lg font-semibold mb-0">Default Home Page</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Choose which page to show when you open the app
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setDefaultHomePage('routines')}
                    className={`px-4 py-2 rounded-lg text-left ${
                      defaultHomePage === 'routines'
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    Routines
                  </button>
                  <button
                    onClick={() => setDefaultHomePage('exercises')}
                    className={`px-4 py-2 rounded-lg text-left ${
                      defaultHomePage === 'exercises'
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    Quick Start
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col items-start gap-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex flex-col mx-0">
                <h3 className="text-lg font-semibold mb-0">Password</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Update your password
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handlePasswordUpdate}
                    disabled={!newPassword || isUpdating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Updating...' : 'Update Password'}
                  </button>
                  {updateError && (
                    <p className="text-red-500 text-sm mt-2">{updateError}</p>
                  )}
                  {updateSuccess && (
                    <p className="text-green-500 text-sm mt-2">
                      Password updated successfully!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};