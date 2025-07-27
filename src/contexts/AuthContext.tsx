import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  addUser: (userData: Omit<User, 'id' | 'created_at'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  setUserPassword: (email: string, password: string) => Promise<void>;
  getUserById: (id: string) => Promise<User | null>;
  syncData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile from Supabase
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id).then(setUser);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          const profile = await loadUserProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        const profile = await loadUserProfile(data.user.id);
        setUser(profile);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addUser = async (userData: Omit<User, 'id' | 'created_at'>): Promise<User> => {
    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: 'temp123456', // Temporary password
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role
        }
      });

      if (authError) {
        throw authError;
      }

      // Create profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: userData.name,
          role: userData.role,
          tokens_given: userData.tokens_given,
          tokens_consumed: userData.tokens_consumed,
          tokens_remaining: userData.tokens_remaining
        })
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      return profileData as User;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state if it's the current user
      if (user && user.id === id) {
        setUser({ ...user, ...updates });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      // Delete auth user (this will cascade to profile)
      const { error } = await supabase.auth.admin.deleteUser(id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const setUserPassword = async (email: string, password: string): Promise<void> => {
    try {
      // Get user by email first
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!users) {
        throw new Error('User not found');
      }

      // Update password using admin API
      const { error } = await supabase.auth.admin.updateUserById(users.id, {
        password: password
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error setting password:', error);
      throw error;
    }
  };

  const getUserById = async (id: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  const syncData = async (): Promise<void> => {
    if (supabaseUser) {
      const profile = await loadUserProfile(supabaseUser.id);
      setUser(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      supabaseUser,
      login, 
      logout, 
      isLoading, 
      addUser, 
      updateUser, 
      deleteUser, 
      getAllUsers,
      setUserPassword,
      getUserById,
      syncData
    }}>
      {children}
    </AuthContext.Provider>
  );
};