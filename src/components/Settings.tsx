import React, { useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { Scale, Lock, Clock, Home, Trash2, AlertTriangle } from 'lucide-react';
import { OngoingWorkoutMessage } from './others/OngoingWorkoutMessage';
import { PageHeader } from './ui/PageHeader';
import { DeleteAccountModal } from './DeleteAccountModal';

export const Settings: React.FC = () => {
  const { weightUnit, setWeightUnit, disableRestTimer, setDisableRestTimer, defaultHomePage, setDefaultHomePage } = useSettings();
  const { currentWorkout } = useWorkout();
  const { user, updatePassword, deleteAccount } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const handleDeleteAccount = async (password: string) => {
    setIsDeleting(true);
    try {
      await deleteAccount(password);
      // Account deletion successful - user will be signed out automatically
    } catch (error) {
      setIsDeleting(false);
      throw error; // Re-throw to be handled by the modal
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div>
        {currentWorkout && <OngoingWorkoutMessage />}
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Scrollable content area */}
        <div 
          ref={scrollContainerRef} 
          className="flex-1 overflow-y-auto pb-20"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="max-w-2xl mx-auto">
            <PageHeader 
              title="Settings" 
              subtitle="Configure your app preferences"
              scrollContainerRef={scrollContainerRef} 
            />
            
            <div className="pt-4 pb-32 px-4">
              <div>
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

                  {/* Danger Zone */}
                  <div className="bg-red-50 border border-red-200 rounded-lg shadow-sm p-4">
                    <div className="flex flex-col items-start gap-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex flex-col mx-0">
                        <h3 className="text-lg font-semibold mb-0 text-red-800">Danger Zone</h3>
                        <p className="text-red-700 text-sm mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <DeleteAccountModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeleting}
        userEmail={user?.email}
      />
    </div>
  );
};