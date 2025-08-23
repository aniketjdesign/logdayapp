import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabaseService } from '../services/supabaseService';

interface WeightContextType {
  currentBodyweight: number | null;
  weightUnit: 'lbs' | 'kgs';
  isLoading: boolean;
  refreshWeight: () => Promise<void>;
  getFormattedBodyweight: () => string;
}

const WeightContext = createContext<WeightContextType | undefined>(undefined);

export const WeightProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentBodyweight, setCurrentBodyweight] = useState<number | null>(null);
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kgs'>('lbs');
  const [isLoading, setIsLoading] = useState(true);

  const loadWeightData = async () => {
    if (!user) {
      setCurrentBodyweight(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [statsResult, settingsResult, profileResult] = await Promise.all([
        supabaseService.getWeightStats(),
        supabaseService.getUserSettings(),
        supabaseService.getUserProfile()
      ]);

      // Get weight unit from settings
      if (!settingsResult.error) {
        setWeightUnit(settingsResult.weightUnit || 'lbs');
      }

      // Get current weight from weight stats or fallback to profile
      if (!statsResult.error && statsResult.data && statsResult.data.totalEntries > 0) {
        // Has weight logs, use current weight from stats
        setCurrentBodyweight(statsResult.data.currentWeight);
      } else if (!profileResult.error && profileResult.data?.weight) {
        // No weight logs but profile has weight, use that
        setCurrentBodyweight(profileResult.data.weight);
      } else {
        // No weight data available
        setCurrentBodyweight(null);
      }
    } catch (error) {
      console.error('Error loading weight data:', error);
      setCurrentBodyweight(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWeight = async () => {
    await loadWeightData();
  };

  const getFormattedBodyweight = () => {
    if (!currentBodyweight) return 'BW';
    return `${currentBodyweight} ${weightUnit}`;
  };

  useEffect(() => {
    loadWeightData();
  }, [user]);

  // Listen for weight updates globally (could be called when weight is logged)
  useEffect(() => {
    const handleWeightUpdate = () => {
      loadWeightData();
    };

    // Custom event listener for weight updates
    window.addEventListener('weightUpdated', handleWeightUpdate);
    
    return () => {
      window.removeEventListener('weightUpdated', handleWeightUpdate);
    };
  }, []);

  const value: WeightContextType = {
    currentBodyweight,
    weightUnit,
    isLoading,
    refreshWeight,
    getFormattedBodyweight
  };

  return (
    <WeightContext.Provider value={value}>
      {children}
    </WeightContext.Provider>
  );
};

export const useWeight = (): WeightContextType => {
  const context = useContext(WeightContext);
  if (context === undefined) {
    throw new Error('useWeight must be used within a WeightProvider');
  }
  return context;
};