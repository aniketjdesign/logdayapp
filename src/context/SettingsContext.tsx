import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { WeightUnit } from '../db/database';
import { supabaseService } from '../services/supabaseService';
import { Analytics } from '../services/analytics';

interface SettingsContextType {
  weightUnit: WeightUnit;
  disableRestTimer: boolean;
  defaultHomePage: 'routines' | 'exercises';
  setWeightUnit: (unit: WeightUnit) => void;
  setDisableRestTimer: (disable: boolean) => void;
  setDefaultHomePage: (page: 'routines' | 'exercises') => void;
  convertWeight: (weight: number, from: WeightUnit, to: WeightUnit) => number;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>('lbs');
  const [disableRestTimer, setDisableRestTimerState] = useState<boolean>(false);
  const [defaultHomePage, setDefaultHomePageState] = useState<'routines' | 'exercises'>('exercises');

  // Load settings from Supabase
  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id) {
        const { weightUnit: savedUnit, disableRestTimer: savedDisableRestTimer, defaultHomePage: savedDefaultHomePage, error } = await supabaseService.getUserSettings();
        if (!error) {
          if (savedUnit) setWeightUnitState(savedUnit);
          if (savedDisableRestTimer !== undefined) setDisableRestTimerState(savedDisableRestTimer);
          if (savedDefaultHomePage) setDefaultHomePageState(savedDefaultHomePage);
        }
      }
    };
    loadSettings();
  }, [user]);

  const setWeightUnit = async (unit: WeightUnit) => {
    setWeightUnitState(unit);
    Analytics.settingsChanged({
      setting: 'weightUnit',
      value: unit,
      previousValue: weightUnit
    });
    if (user?.id) {
      await supabaseService.saveUserSettings({ weightUnit: unit, disableRestTimer, defaultHomePage });
    }
  };

  const setDisableRestTimer = async (disable: boolean) => {
    setDisableRestTimerState(disable);
    Analytics.settingsChanged({
      setting: 'disableRestTimer',
      value: disable,
      previousValue: disableRestTimer
    });
    if (user?.id) {
      await supabaseService.saveUserSettings({ weightUnit, disableRestTimer: disable, defaultHomePage });
    }
  };

  const setDefaultHomePage = async (page: 'routines' | 'exercises') => {
    setDefaultHomePageState(page);
    Analytics.settingsChanged({
      setting: 'defaultHomePage',
      value: page,
      previousValue: defaultHomePage
    });
    if (user?.id) {
      await supabaseService.saveUserSettings({ weightUnit, disableRestTimer, defaultHomePage: page });
    }
  };

  const convertWeight = (weight: number, from: WeightUnit, to: WeightUnit): number => {
    if (from === to) return weight;
    if (from === 'kgs' && to === 'lbs') return weight * 2.20462;
    return weight / 2.20462;
  };

  return (
    <SettingsContext.Provider value={{ 
      weightUnit, 
      disableRestTimer, 
      defaultHomePage, 
      setWeightUnit, 
      setDisableRestTimer, 
      setDefaultHomePage, 
      convertWeight 
    }}>
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