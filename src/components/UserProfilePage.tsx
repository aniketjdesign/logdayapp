import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit3, Save, X, User, Calendar, Ruler, Weight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabaseService } from '../services/supabaseService';

interface UserProfile {
  id?: string;
  full_name?: string;
  email?: string;
  height?: number;
  weight?: number;
  date_of_birth?: string;
  sex?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserSettings {
  weightUnit: 'lbs' | 'kgs';
  heightUnit: 'cm' | 'inches';
}

export const UserProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>({ weightUnit: 'lbs', heightUnit: 'cm' });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({});
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadUserProfile();
    loadUserSettings();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabaseService.getUserProfile();
      if (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } else {
        setProfile(data);
        setFormData(data || {});
        // If no profile exists, start in edit mode
        if (!data) {
          setIsEditing(true);
          setFormData({ email: user?.email || '' });
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserSettings = async () => {
    try {
      const { weightUnit, error } = await supabaseService.getUserSettings();
      if (!error) {
        setSettings(prev => ({ ...prev, weightUnit }));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const { data, error } = await supabaseService.saveUserProfile({
        full_name: formData.full_name || '',
        height: formData.height ? Number(formData.height) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        date_of_birth: formData.date_of_birth || undefined,
        sex: formData.sex || undefined,
      });

      if (error) {
        setError('Failed to save profile');
        console.error('Error saving profile:', error);
      } else {
        setProfile(data);
        setIsEditing(false);
      }
    } catch (err) {
      setError('Failed to save profile');
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setIsEditing(false);
    setError(null);
  };

  const formatHeight = (height: number | undefined) => {
    if (!height) return '';
    if (settings.heightUnit === 'inches') {
      const feet = Math.floor(height / 12);
      const inches = height % 12;
      return `${feet}'${inches}"`;
    }
    return `${height} cm`;
  };

  const formatWeight = (weight: number | undefined) => {
    if (!weight) return '';
    return `${weight} ${settings.weightUnit}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (dateString: string | undefined) => {
    if (!dateString) return '';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto pb-20">
            <div className="max-w-2xl mx-auto">
              <div className="px-4 pt-8 pb-3">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Profile</h1>
                <p className="text-sm text-gray-500">Loading your profile...</p>
              </div>
              <div className="pt-4 pb-32 px-4">
                <div className="animate-pulse space-y-6">
                  <div className="h-20 bg-gray-200 rounded-xl"></div>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="max-w-2xl mx-auto">
            {/* Custom Header with Back Button */}
            <div className="px-4 pt-8 pb-3">
              <div className="flex items-center mb-4">
                <button
                  onClick={() => navigate('/profile')}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mr-3"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Profile</h1>
                  <p className="text-sm text-gray-500">
                    {isEditing ? "Edit your profile information" : "View your profile information"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 pb-32 px-4">
              {error && (
                <motion.div 
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-red-600 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Profile Header */}
              <motion.div 
                className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 mb-6 rounded-xl shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <User size={24} strokeWidth={2} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-800">
                      {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                    </h2>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                
                {!isEditing && profile && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Edit3 size={18} />
                  </button>
                )}
              </motion.div>

              {/* Profile Form/Display */}
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {/* Full Name */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-2">
                    <User size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Full Name</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.full_name || ''}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800 p-3 bg-gray-50 rounded-lg">
                      {profile?.full_name || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Height */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-2">
                    <Ruler size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      Height ({settings.heightUnit})
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.height || ''}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder={`Enter height in ${settings.heightUnit}`}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800 p-3 bg-gray-50 rounded-lg">
                      {formatHeight(profile?.height) || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Weight */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-2">
                    <Weight size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      Weight ({settings.weightUnit})
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight || ''}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder={`Enter weight in ${settings.weightUnit}`}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800 p-3 bg-gray-50 rounded-lg">
                      {formatWeight(profile?.weight) || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-2">
                    <Calendar size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Date of Birth</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.date_of_birth || ''}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-800">
                        {formatDate(profile?.date_of_birth) || 'Not set'}
                      </p>
                      {profile?.date_of_birth && (
                        <p className="text-sm text-gray-500 mt-1">
                          Age: {calculateAge(profile.date_of_birth)} years
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Sex */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-2">
                    <User size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Sex</span>
                  </div>
                  {isEditing ? (
                    <select
                      value={formData.sex || ''}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select sex</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  ) : (
                    <p className="text-gray-800 p-3 bg-gray-50 rounded-lg capitalize">
                      {profile?.sex?.replace('_', ' ') || 'Not set'}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Action Buttons */}
              {isEditing && (
                <motion.div 
                  className="flex space-x-3 mt-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save size={16} />
                    <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                  </button>
                  
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center justify-center p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
