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

const STORAGE_PREFIX = 'logday_';

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
      // Clear all local storage data
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear session cookies
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Reset user state
      setUser(null);
      identifyUser(null);

      // Clear IndexedDB data
      const databases = await window.indexedDB.databases();
      databases.forEach(db => {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      });

      // Force a complete page reload and redirect
      window.location.href = '/login';
      window.location.reload(true);
    } catch (error) {
      console.error('Error during sign out:', error);
      // Fallback: force reload even if there's an error
      window.location.href = '/login';
      window.location.reload(true);
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