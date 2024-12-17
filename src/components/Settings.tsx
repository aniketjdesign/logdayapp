import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { Scale, Lock } from 'lucide-react';

export const Settings: React.FC = () => {
  const { weightUnit, setWeightUnit } = useSettings();
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
                  onClick={() => !currentWorkout && setWeightUnit('kgs')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    weightUnit === 'kgs'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${currentWorkout ? 'cursor-not-allowed opacity-60' : ''}`}
                  disabled={!!currentWorkout}
                >
                  Kilograms (KGs)
                </button>
                <button
                  onClick={() => !currentWorkout && setWeightUnit('lbs')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    weightUnit === 'lbs'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${currentWorkout ? 'cursor-not-allowed opacity-60' : ''}`}
                  disabled={!!currentWorkout}
                >
                  Pounds (LBs)
                </button>
              </div>
              {currentWorkout && (
                <p className="mt-3 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                  Weight unit cannot be changed during an active workout
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col items-start gap-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex flex-col w-full">
              <h3 className="text-lg font-semibold mb-0">Update Password</h3>
              <p className="text-gray-600 text-sm mb-4">
                Change your account password
              </p>
              <div className="space-y-4">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handlePasswordUpdate}
                  disabled={isUpdating || !newPassword}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isUpdating || !newPassword
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isUpdating ? 'Updating...' : 'Update Password'}
                </button>
                {updateError && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {updateError}
                  </p>
                )}
                {updateSuccess && (
                  <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                    Password updated successfully!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};