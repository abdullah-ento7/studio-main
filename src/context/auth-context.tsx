
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@/lib/types';
import { useData } from './data-context';

interface AuthContextProps {
  loggedInUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createAccount: (username: string, password: string) => Promise<boolean>;
  approveUser: (username: string) => void;
  rejectUser: (username: string) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const dataContext = useData();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && dataContext) {
        const { users } = dataContext;
        const user = users.find(u => u.id === session.user.id);
        if (user) {
          setLoggedInUser(user);
        }
      }
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && dataContext) {
        const { users } = dataContext;
        const user = users.find(u => u.id === session.user.id);
        if (user) {
          setLoggedInUser(user);
        }
      }
      if (event === 'SIGNED_OUT') {
        setLoggedInUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [dataContext]);

  const login = async (username: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (error || !data.user) {
      console.error('Error logging in:', error?.message);
      return false;
    }
    if (dataContext){
        const { users } = dataContext;
        const user = users.find(u => u.id === data.user.id);
        if (user && user.status === 'approved') {
            setLoggedInUser(user);
            return true
        }
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setLoggedInUser(null);
  };

  const createAccount = async (username: string, password: string): Promise<boolean> => {
    if (!dataContext) return false;

    const { data, error } = await supabase.auth.signUp({
        email: username,
        password: password,
        options: {
            data: {
                permissions: {
                    dashboard: true,
                    general: true,
                    expenses: true,
                    financials: true,
                    edit: true,
                    admin: false,
                },
                status: 'pending',
            }
        }
    });

    if (error) {
        console.error('Error creating account:', error.message);
        return false;
    }

    if (data.user) {
        // Refresh users
        await dataContext.refreshUsers();
    }

    return true;
  };

  const approveUser = async (username: string) => {
    if (!dataContext) return;
    const { users, setUsers } = dataContext;
    const userToApprove = users.find(u => u.username === username);
    if (!userToApprove) return;

    const { error } = await supabase.from('users').update({ status: 'approved' }).eq('id', userToApprove.id);
    if (error) {
        console.error('Error approving user:', error.message);
        return;
    }
    const updatedUsers = users.map(u => u.username === username ? { ...u, status: 'approved' as const } : u);
    setUsers(updatedUsers);
  };

  const rejectUser = async (username: string) => {
    if (!dataContext) return;
    const { users, setUsers } = dataContext;
    const userToReject = users.find(u => u.username === username);
    if (!userToReject) return;
    
    const { error } = await supabase.from('users').update({ status: 'rejected' }).eq('id', userToReject.id);
    if (error) {
        console.error('Error rejecting user:', error.message);
        return;
    }

    const updatedUsers = users.map(u => u.username === username ? { ...u, status: 'rejected' as const } : u);
    setUsers(updatedUsers);
  };

  const value = {
    loggedInUser,
    login,
    logout,
    createAccount,
    approveUser,
    rejectUser,
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
