import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { Analytics } from '../services/analytics';
import { Capacitor } from '@capacitor/core';

interface OnboardingContextType {
  showWhatsNew: boolean;
  openCount: number;
  dismissWhatsNew: () => Promise<void>;
  showWhatsNewManually: () => void;
  isPlatformIOS: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [showWhatsNew, setShowWhatsNew] = useState<boolean>(false);
  const [openCount, setOpenCount] = useState<number>(0);
  const isPlatformIOS = Capacitor.getPlatform() === 'ios';

  useEffect(() => {
    const loadOnboardingState = async () => {
      if (!user?.id) return;
      
      try {
        // Verify we have an authenticated session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.error('No authenticated user session found');
          return;
        }
        
        // Get the user's onboarding record
        const { data, error } = await supabase
          .from('user_onboarding')
          .select('id, visit_count')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching onboarding state:', error);
          return;
        }

        if (!data) {
          // First time user - create record and show modal
          const { error: insertError } = await supabase
            .from('user_onboarding')
            .insert([{ user_id: user.id, visit_count: 1 }]);
            
          if (insertError) {
            console.error('Error creating onboarding record:', insertError);
            return;
          }
          
          setOpenCount(1);
          setShowWhatsNew(true);
          
          // Track analytics for first open
          Analytics.track('whats_new_shown', {
            count: 1,
            platform: isPlatformIOS ? 'ios' : 'web',
            trigger: 'first_open'
          });
        } else {
          // Returning user - don't show modal automatically
          setOpenCount(data.visit_count);
        }
      } catch (error) {
        console.error('Error managing onboarding state:', error);
      }
    };

    loadOnboardingState();
  }, [user, isPlatformIOS]);

  const dismissWhatsNew = async () => {
    try {
      setShowWhatsNew(false);
      
      // Track dismissal in analytics
      Analytics.track('whats_new_dismissed', {
        count: openCount,
        platform: isPlatformIOS ? 'ios' : 'web'
      });
    } catch (error) {
      console.error('Error dismissing whats new:', error);
    }
  };
  
  const showWhatsNewManually = async () => {
    try {
      // Increment the count
      const newCount = openCount + 1;
      setOpenCount(newCount);
      setShowWhatsNew(true);
      
      // Update the count in the database
      if (user?.id) {
        // Get the user's onboarding record
        const { data, error } = await supabase
          .from('user_onboarding')
          .select('id, visit_count')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching onboarding record:', error);
          return;
        }
        
        if (data) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('user_onboarding')
            .update({ visit_count: newCount })
            .eq('id', data.id);
            
          if (updateError) {
            console.error('Error updating onboarding count:', updateError);
          }
        } else {
          // Create new record if none exists
          const { error: insertError } = await supabase
            .from('user_onboarding')
            .insert([{ user_id: user.id, visit_count: newCount }]);
            
          if (insertError) {
            console.error('Error creating onboarding record:', insertError);
          }
        }
      }
      
      // Track manual open in analytics
      Analytics.track('whats_new_shown', {
        count: newCount,
        platform: isPlatformIOS ? 'ios' : 'web',
        trigger: 'manual'
      });
    } catch (error) {
      console.error('Error showing whats new:', error);
    }
  };

  return (
    <OnboardingContext.Provider value={{ 
      showWhatsNew, 
      openCount, 
      dismissWhatsNew,
      showWhatsNewManually,
      isPlatformIOS
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
