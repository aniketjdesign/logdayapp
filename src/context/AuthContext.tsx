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
  deleteAccount: (password: string) => Promise<void>;
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
      console.log("Starting sign-in process for email:", email);
      
      console.log("Attempting Supabase authentication...");
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Supabase auth error:", error);
        throw error;
      }
      
      console.log("Authentication successful");
      identifyUser(data.user);
      Analytics.userSignedIn({
        userId: data.user.id,
        email: data.user.email || ''
      });
    } catch (err: any) {
      console.error("Sign-in error details:", err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      console.log("Starting sign-up process for email:", email);
      
      console.log("Attempting Supabase signup...");
      const response = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (response.error) {
        console.error("Supabase signup error:", response.error);
        throw response.error;
      }
      
      if (response.data.user) {
        console.log("Signup successful");
        identifyUser(response.data.user);
        Analytics.userSignedUp({
          userId: response.data.user.id,
          email: response.data.user.email || '',
          createdAt: response.data.user.created_at
        });
      }
      
      return response;
    } catch (err: any) {
      console.error("Sign-up error details:", err);
      throw err;
    }
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

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw error;
  };

  const deleteAccount = async (password: string) => {
    if (!user) throw new Error('No user logged in');
    
    // First, verify the password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });
    
    if (verifyError) {
      throw new Error('Invalid password. Please enter your correct password.');
    }

    try {
      // Call our Supabase Edge Function to handle account deletion
      const { error: deleteError } = await supabase.functions.invoke('delete-account', {
        body: { password }
      });

      if (deleteError) {
        throw deleteError;
      }

      // Track the account deletion
      Analytics.userDeletedAccount({ userId: user.id });
      
      // Clear all local data and sign out
      await signOut();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw new Error(error.message || 'Failed to delete account. Please contact support.');
    }
  };

  const value: AuthContextType = {
    user,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updatePassword,
    resetPassword,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}