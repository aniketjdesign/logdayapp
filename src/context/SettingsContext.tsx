import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { WeightUnit, getSettings, saveSettings } from '../db/database';

interface SettingsContextType {
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  convertWeight: (weight: number, from: WeightUnit, to: WeightUnit) => number;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>('lbs');

  // Load settings when user changes
  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id) {
        const settings = await getSettings(user.id);
        if (settings) {
          setWeightUnitState(settings.weightUnit);
        }
      }
    };
    loadSettings();
  }, [user]);

  const setWeightUnit = async (unit: WeightUnit) => {
    setWeightUnitState(unit);
    if (user?.id) {
      await saveSettings(user.id, unit);
    }
  };

  const convertWeight = (weight: number, from: WeightUnit, to: WeightUnit): number => {
    if (from === to) return weight;
    if (from === 'kgs' && to === 'lbs') return weight * 2.20462;
    return weight / 2.20462;
  };

  return (
    <SettingsContext.Provider value={{ weightUnit, setWeightUnit, convertWeight }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};