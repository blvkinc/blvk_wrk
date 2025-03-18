import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useWorkspaceStore } from '../store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  syncWorkspace: () => Promise<void>;
  isSyncing: boolean;
  isWorkspaceSynced: boolean;
  lastSyncedAt: Date | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    saveWorkspaceToCloud,
    loadWorkspaceFromCloud,
    syncWorkspace: syncWorkspaceStore,
    isSyncing: isStoreSyncing,
    isCloudSaved,
    lastSyncedAt
  } = useWorkspaceStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      // Load workspace from cloud when user logs in
      if (currentUser) {
        loadWorkspaceFromCloud(currentUser.id).catch(console.error);
      }
      
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      // Load workspace from cloud when user logs in
      if (event === 'SIGNED_IN' && currentUser) {
        loadWorkspaceFromCloud(currentUser.id).catch(console.error);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadWorkspaceFromCloud]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-confirmation`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    // Save workspace to cloud before signing out
    if (user) {
      try {
        setIsSyncing(true);
        await saveWorkspaceToCloud(user.id);
      } catch (error) {
        console.error('Error saving workspace before sign out:', error);
      } finally {
        setIsSyncing(false);
      }
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/email-confirmation`,
    });
    if (error) throw error;
  };

  const syncWorkspace = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      await loadWorkspaceFromCloud(user.id);
    } finally {
      setIsSyncing(false);
    }
  };

  // Set up periodic syncing if user is logged in
  useEffect(() => {
    if (!user) return;
    
    // Initial sync after login
    loadWorkspaceFromCloud(user.id).catch(console.error);
    
    const syncInterval = setInterval(() => {
      // For periodic syncs, use saveWorkspaceToCloud to push local changes
      saveWorkspaceToCloud(user.id).catch(console.error);
    }, 5 * 60 * 1000); // Sync every 5 minutes
    
    return () => clearInterval(syncInterval);
  }, [user, loadWorkspaceFromCloud, saveWorkspaceToCloud]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      resetPassword,
      syncWorkspace,
      isSyncing: isSyncing || isStoreSyncing,
      isWorkspaceSynced: isCloudSaved,
      lastSyncedAt
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 