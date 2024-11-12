import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import zipy from 'zipyai';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
    } else {
      zipy.anonymize();
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
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    identifyUser(data.user);
  };

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await supabase.auth.signUp({
      email,
      password,
    });
    if (response.data.user) {
      identifyUser(response.data.user);
    }
    return response;
  };

  const signOut = async () => {
    try {
      // First, clear all local storage data
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.startsWith('sb-') || key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });

      // Clear session cookies
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Reset user state
      setUser(null);
      identifyUser(null);

      // Force a clean reload to reset all app state
      window.location.replace('/login');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, force a reload to clear state
      window.location.replace('/login');
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

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, signInWithGoogle }}>
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