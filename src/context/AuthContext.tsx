import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse, AuthError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import zipy from 'zipyai';
import { Analytics } from '../services/analytics';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const identifyUser = (user: User | null) => {
    if (user?.email) {
      zipy.identify(user.email, {
        email: user.email,
        userId: user.id,
        createdAt: user.created_at
      });
      Analytics.identify(user.id, {
        email: user.email,
        created_at: user.created_at
      });
    } else {
      zipy.anonymize();
      Analytics.reset();
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      identifyUser(currentUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      identifyUser(currentUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Attempt to sign in
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      identifyUser(data.user);
      Analytics.userSignedIn({
        userId: data.user.id,
        email: data.user.email || ''
      });
    } catch (err) {
      throw err;
    }
  };

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await supabase.auth.signUp({
      email,
      password,
    });
    if (response.data.user) {
      identifyUser(response.data.user);
      Analytics.userSignedUp({
        userId: response.data.user.id,
        email: response.data.user.email || '',
        createdAt: response.data.user.created_at
      });
    }
    return response;
  };

  const signOut = async () => {
    try {
      Analytics.userSignedOut();
      // First, clear all app data
      const keysToKeep = ['vite-dummy']; // Add any keys that should not be cleared
      Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      // Clear all sessionStorage data
      sessionStorage.clear();

      // Reset user state
      setUser(null);
      identifyUser(null);

      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Even if there's an error, we want to force logout
      if (error) {
        console.error('Error during sign out:', error);
        // Force clear Supabase session
        await supabase.auth.clearSession();
      }

      // Force reload to clear all app state and redirect
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during sign out:', error);
      // Force reload even if there's an error
      window.location.href = '/login';
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) throw error;
      if (data.user) {
        identifyUser(data.user);
      }
      return data;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  };

    const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password-confirm`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, signInWithGoogle, updatePassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}