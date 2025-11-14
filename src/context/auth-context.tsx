
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@/lib/types';

interface AuthContextProps {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createAccount: (username: string, password: string) => Promise<boolean>;
  fetchUsers: () => void;
  updateUserStatus: (userId: string, status: 'approved' | 'rejected') => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data as User[]);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        if (data) {
          setUser(data);
        }
      }
    };
    getSession();

    fetchUsers();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        if (data) {
          setUser(data);
        }
      }
      if (event === 'SIGNED_out') {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (error || !data.user) {
      console.error('Error logging in:', error?.message);
      return false;
    }
    
    const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    if (userError || !userData) {
        return false;
    }

    if (userData.status === 'approved') {
        setUser(userData);
        return true;
    }

    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const createAccount = async (username: string, password: string): Promise<boolean> => {
    const { data: users, error: usersError } = await supabase.from('users').select('id');
    if (usersError) {
      console.error('Error fetching users count:', usersError.message);
      return false;
    }

    const isFirstUser = users.length === 0;
    const initialStatus = isFirstUser ? 'approved' : 'pending';
    const initialRole = isFirstUser ? 'admin' : 'user';

    const { data, error } = await supabase.auth.signUp({
        email: username,
        password: password,
        options: {
            data: {
                status: initialStatus,
                role: initialRole,
            }
        }
    });

    if (error) {
        console.error('Error creating account:', error.message);
        return false;
    }

    if (data.user) {
        fetchUsers();
    }

    return true;
  };

  const updateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('users').update({ status }).eq('id', userId);
    if (error) {
      console.error(`Error updating user status to ${status}:`, error);
    } else {
      fetchUsers(); 
    }
  };

  const value = {
    user,
    users,
    login,
    logout,
    createAccount,
    fetchUsers,
    updateUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
