import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, Weight as WeightIcon, Plus, TrendingUp, TrendingDown, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { PageHeader } from './ui/PageHeader';

interface WeightLog {
  id: string;
  weight: number;
  logged_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const WeightEntries: React.FC = () => {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kgs'>('lbs');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [editingLog, setEditingLog] = useState<WeightLog | null>(null);
  const [weightFormData, setWeightFormData] = useState({
    weight: '',
    logged_at: new Date().toISOString().slice(0, 16),
    notes: ''
  });
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [weightError, setWeightError] = useState<string | null>(null);

  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadWeightData();
  }, []);


  const loadWeightData = async () => {
    setIsLoading(true);
    try {
      const [logsResult, settingsResult] = await Promise.all([
        supabaseService.getWeightLogs(),
        supabaseService.getUserSettings()
      ]);

      if (!logsResult.error) {
        setWeightLogs(logsResult.data);
      } else {
        setError('Failed to load weight entries');
      }

      if (!settingsResult.error) {
        setWeightUnit(settingsResult.weightUnit);
      }
    } catch (error) {
      setError('Failed to load weight entries');
      console.error('Error loading weight data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabaseService.deleteWeightLog(id);
      if (error) {
        setError('Failed to delete weight entry');
      } else {
        // Remove the deleted entry from the list
        setWeightLogs(logs => logs.filter(log => log.id !== id));
      }
    } catch (error) {
      setError('Failed to delete weight entry');
      console.error('Error deleting weight log:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (log: WeightLog) => {
    setEditingLog(log);
    setWeightFormData({
      weight: log.weight.toString(),
      logged_at: new Date(log.logged_at).toISOString().slice(0, 16),
      notes: log.notes || ''
    });
    setShowWeightModal(true);
  };

  const handleWeightUpdate = async () => {
    if (!weightFormData.weight || !weightFormData.logged_at || !editingLog) {
      setWeightError('Weight and date are required');
      return;
    }

    setIsSavingWeight(true);
    setWeightError(null);

    try {
      const { error } = await supabaseService.updateWeightLog(editingLog.id, {
        weight: parseFloat(weightFormData.weight),
        logged_at: weightFormData.logged_at,
        notes: weightFormData.notes || undefined
      });

      if (error) {
        setWeightError('Failed to update weight log');
      } else {
        closeWeightModal();
        // Reload weight data
        loadWeightData();
        // Trigger weight update event for other components
        window.dispatchEvent(new CustomEvent('weightUpdated'));
      }
    } catch (error) {
      setWeightError('Failed to update weight log');
      console.error('Error updating weight log:', error);
    } finally {
      setIsSavingWeight(false);
    }
  };

  const closeWeightModal = () => {
    setShowWeightModal(false);
    setEditingLog(null);
    setWeightFormData({
      weight: '',
      logged_at: new Date().toISOString().slice(0, 16),
      notes: ''
    });
    setWeightError(null);
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

  const getWeightChange = (currentWeight: number, previousWeight: number | null) => {
    if (!previousWeight) return null;
    const change = currentWeight - previousWeight;
    return {
      value: change,
      isIncrease: change > 0,
      text: `${change > 0 ? '+' : ''}${change.toFixed(1)} ${weightUnit}`,
      icon: change > 0 ? TrendingUp : TrendingDown,
      color: change > 0 ? 'text-red-500' : 'text-green-500'
    };
  };

  const formatDateCompact = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div 
            ref={scrollContainerRef} 
            className="flex-1 overflow-y-auto pb-20"
            style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="max-w-2xl mx-auto">
              <PageHeader
                title="Weight Entries"
                subtitle="Track your weight progress over time"
                scrollContainerRef={scrollContainerRef}
              />
              <div className="pt-4 pb-32 px-4">
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                          <div className="h-6 w-16 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      </div>
                      <div className="mt-2">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div 
          ref={scrollContainerRef} 
          className="flex-1 overflow-y-auto pb-20"
          style={{ WebkitOverflowScrolling: 'touch' }}>
          
          <div className="max-w-2xl mx-auto">
            <PageHeader
              title={
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate('/profile')}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors mr-1"
                  >
                    <ArrowLeft size={18} className="text-gray-600" />
                  </button>
                  <span>Weight Entries</span>
                </div>
              }
              subtitle={`${weightLogs.length} ${weightLogs.length === 1 ? 'entry' : 'entries'} • Track your progress`}
              scrollContainerRef={scrollContainerRef}
            />
            
            <div className="pt-4 pb-32 px-4">
              {error && (
                <motion.div 
                  className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-red-600 text-sm">{error}</p>
                </motion.div>
              )}

              {weightLogs.length === 0 ? (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                  <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <WeightIcon size={32} className="text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No weight entries yet</h3>
                  <p className="text-sm text-gray-500 mb-6">Start tracking your weight progress by logging your first entry</p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center space-x-2 mx-auto px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Plus size={16} />
                    <span>Log Your First Weight</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {weightLogs.map((log, index) => {
                      const previousLog = index < weightLogs.length - 1 ? weightLogs[index + 1] : null;
                      const weightChange = getWeightChange(log.weight, previousLog?.weight || null);
                      
                      return (
                        <motion.div
                          key={log.id}
                          className="relative overflow-hidden"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -300 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          {/* Delete action background */}
                          <div className="absolute inset-0 flex justify-end">
                            <div className="bg-red-500 rounded-xl text-white font-medium flex items-center justify-end w-full pr-4">
                              {deletingId === log.id ? 'Deleting...' : 'Delete'}
                            </div>
                          </div>
                          
                          {/* Main content that slides */}
                          <motion.div
                            drag="x"
                            dragConstraints={{ left: -120, right: 0 }}
                            dragElastic={0.1}
                            dragDirectionLock
                            onDragEnd={(_, info) => {
                              if (info.offset.x < -80 && !deletingId) {
                                handleDelete(log.id);
                              }
                            }}
                            onClick={() => handleEdit(log)}
                            className="relative bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-1">
                                    <div className="flex items-center">
                                      <div className="bg-purple-100 rounded-full p-1.5 mr-3">
                                        <WeightIcon size={14} className="text-purple-600" />
                                      </div>
                                      <span className="text-xl font-bold text-gray-900">
                                        {formatWeight(log.weight)}
                                      </span>
                                    </div>
                                    
                                    {weightChange && (
                                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${weightChange.color}`}
                                        style={{ backgroundColor: `${weightChange.color.includes('red') ? '#fee2e2' : '#dcfce7'}` }}>
                                        {weightChange.isIncrease ? (
                                          <TrendingUp size={12} />
                                        ) : (
                                          <TrendingDown size={12} />
                                        )}
                                        <span>{weightChange.text}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center text-sm text-gray-500 mb-2">
                                    <Calendar size={12} className="mr-1.5" />
                                    {formatDateCompact(log.logged_at)}
                                  </div>
                                  
                                  {log.notes && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                      <p className="text-sm text-gray-700">{log.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Weight Logging/Editing Modal */}
      <AnimatePresence>
        {showWeightModal && (
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
                  onClick={closeWeightModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              {weightError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{weightError}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight ({weightUnit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightFormData.weight}
                    onChange={(e) => setWeightFormData({ ...weightFormData, weight: e.target.value })}
                    placeholder={`Enter weight in ${weightUnit}`}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={weightFormData.logged_at}
                    onChange={(e) => setWeightFormData({ ...weightFormData, logged_at: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={weightFormData.notes}
                    onChange={(e) => setWeightFormData({ ...weightFormData, notes: e.target.value })}
                    placeholder="Add any notes about this weight entry..."
                    rows={3}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={editingLog ? handleWeightUpdate : () => {}}
                  disabled={isSavingWeight}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={16} />
                  <span>{isSavingWeight ? 'Saving...' : (editingLog ? 'Update Weight' : 'Log Weight')}</span>
                </button>
                
                <button
                  onClick={closeWeightModal}
                  disabled={isSavingWeight}
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