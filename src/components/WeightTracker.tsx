import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Calendar, Weight, Edit3, Trash2, Save, X, ArrowLeft, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { useNavigate } from 'react-router-dom';

interface WeightLog {
  id: string;
  weight: number;
  logged_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface WeightStats {
  currentWeight: number | null;
  previousWeight: number | null;
  weightChange: number | null;
  totalEntries: number;
  avgLast7Days: number | null;
  avgLast30Days: number | null;
  firstEntryDate: string | null;
  lastEntryDate: string | null;
}

interface ChartDataPoint {
  date: string;
  weight: number;
  formattedDate: string;
}

export const WeightTracker: React.FC = () => {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [weightStats, setWeightStats] = useState<WeightStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLog, setEditingLog] = useState<WeightLog | null>(null);
  const [formData, setFormData] = useState({
    weight: '',
    logged_at: new Date().toISOString().slice(0, 16),
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kgs'>('lbs');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadWeightData();
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const { weightUnit: unit } = await supabaseService.getUserSettings();
      setWeightUnit(unit);
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadWeightData = async () => {
    setIsLoading(true);
    try {
      const [logsResult, statsResult] = await Promise.all([
        supabaseService.getWeightLogs(),
        supabaseService.getWeightStats()
      ]);

      if (logsResult.error) {
        setError('Failed to load weight logs');
      } else {
        setWeightLogs(logsResult.data);
      }

      if (statsResult.error) {
        console.error('Error loading weight stats:', statsResult.error);
      } else {
        setWeightStats(statsResult.data);
      }
    } catch (error) {
      setError('Failed to load weight data');
      console.error('Error loading weight data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWeight = async () => {
    if (!formData.weight || !formData.logged_at) {
      setError('Weight and date are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error } = await supabaseService.addWeightLog({
        weight: parseFloat(formData.weight),
        logged_at: formData.logged_at,
        notes: formData.notes || undefined
      });

      if (error) {
        setError('Failed to add weight log');
      } else {
        setShowAddModal(false);
        setFormData({
          weight: '',
          logged_at: new Date().toISOString().slice(0, 16),
          notes: ''
        });
        await loadWeightData();
      }
    } catch (error) {
      setError('Failed to add weight log');
      console.error('Error adding weight log:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateWeight = async () => {
    if (!editingLog || !formData.weight || !formData.logged_at) {
      setError('Weight and date are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error } = await supabaseService.updateWeightLog(editingLog.id, {
        weight: parseFloat(formData.weight),
        logged_at: formData.logged_at,
        notes: formData.notes || undefined
      });

      if (error) {
        setError('Failed to update weight log');
      } else {
        setEditingLog(null);
        setFormData({
          weight: '',
          logged_at: new Date().toISOString().slice(0, 16),
          notes: ''
        });
        await loadWeightData();
      }
    } catch (error) {
      setError('Failed to update weight log');
      console.error('Error updating weight log:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWeight = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) return;

    try {
      const { error } = await supabaseService.deleteWeightLog(id);
      if (error) {
        setError('Failed to delete weight log');
      } else {
        await loadWeightData();
      }
    } catch (error) {
      setError('Failed to delete weight log');
      console.error('Error deleting weight log:', error);
    }
  };

  const startEdit = (log: WeightLog) => {
    setEditingLog(log);
    setFormData({
      weight: log.weight.toString(),
      logged_at: new Date(log.logged_at).toISOString().slice(0, 16),
      notes: log.notes || ''
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setEditingLog(null);
    setShowAddModal(false);
    setFormData({
      weight: '',
      logged_at: new Date().toISOString().slice(0, 16),
      notes: ''
    });
    setError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWeight = (weight: number) => {
    return `${weight} ${weightUnit}`;
  };

  const getWeightChangeColor = (change: number | null) => {
    if (!change) return 'text-gray-500';
    return change > 0 ? 'text-red-500' : 'text-green-500';
  };

  const getWeightChangeIcon = (change: number | null) => {
    if (!change) return null;
    return change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  const prepareChartData = (): ChartDataPoint[] => {
    return weightLogs
      .slice()
      .reverse()
      .map(log => ({
        date: log.logged_at,
        weight: log.weight,
        formattedDate: new Date(log.logged_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">{formatDate(label)}</p>
          <p className="text-lg font-semibold text-blue-600">
            {formatWeight(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded-xl"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Weight Tracking</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {error && (
          <motion.div 
            className="p-3 bg-red-50 border border-red-200 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-600 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Weight Overview Card */}
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-3">
                <Weight size={24} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Weight</h2>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span>Log Weight</span>
            </button>
          </div>

          {weightStats && weightStats.totalEntries > 0 ? (
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Current Weight</p>
                <p className="text-3xl font-bold text-gray-800">
                  {weightStats.currentWeight ? formatWeight(weightStats.currentWeight) : 'N/A'}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Change</p>
                <div className={`flex items-center justify-center space-x-2 ${getWeightChangeColor(weightStats.weightChange)}`}>
                  {getWeightChangeIcon(weightStats.weightChange)}
                  <p className="text-xl font-semibold">
                    {weightStats.weightChange 
                      ? `${Math.abs(weightStats.weightChange).toFixed(1)} ${weightUnit}`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Weight size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No weight entries yet</p>
              <p className="text-sm text-gray-400">Start tracking your weight progress</p>
            </div>
          )}
        </motion.div>

        {/* Statistics Cards */}
        {weightStats && weightStats.totalEntries > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-sm text-gray-500 mb-1">7-Day Average</p>
              <p className="text-xl font-bold text-gray-800">
                {weightStats.avgLast7Days ? formatWeight(weightStats.avgLast7Days) : 'N/A'}
              </p>
            </motion.div>

            <motion.div 
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-sm text-gray-500 mb-1">30-Day Average</p>
              <p className="text-xl font-bold text-gray-800">
                {weightStats.avgLast30Days ? formatWeight(weightStats.avgLast30Days) : 'N/A'}
              </p>
            </motion.div>
          </div>
        )}

        {/* Weight Chart */}
        {weightLogs.length > 1 && (
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Weight Progress</h3>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="formattedDate" 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Weight History */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Recent Entries</h3>
          
          {weightLogs.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <Weight size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No weight entries yet</p>
              <p className="text-sm text-gray-400">Start tracking your weight by adding your first entry</p>
            </div>
          ) : (
            <div className="space-y-2">
              {weightLogs.slice(0, 10).map((log, index) => (
                <motion.div
                  key={log.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <p className="text-lg font-semibold text-gray-800">
                          {formatWeight(log.weight)}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(log.logged_at)}
                        </div>
                      </div>
                      {log.notes && (
                        <p className="text-sm text-gray-600 mt-1">{log.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEdit(log)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteWeight(log.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-xl p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingLog ? 'Edit Weight Entry' : 'Log Weight'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight ({weightUnit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder={`Enter weight in ${weightUnit}`}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.logged_at}
                    onChange={(e) => setFormData({ ...formData, logged_at: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any notes about this weight entry..."
                    rows={3}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={editingLog ? handleUpdateWeight : handleAddWeight}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Saving...' : editingLog ? 'Update' : 'Log Weight'}</span>
                </button>
                
                <button
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
