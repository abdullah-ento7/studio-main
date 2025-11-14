
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useData } from './data-context';

interface AuthContextProps {
  loggedInUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  createAccount: (username: string, password: string) => boolean;
  approveUser: (username: string) => void;
  rejectUser: (username: string) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const dataContext = useData();

  // On initial load, try to get user from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        setLoggedInUser(JSON.parse(storedUser));
      }
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    if (!dataContext) return false;
    const { users } = dataContext;
    const user = users.find(u => u.username === username && u.password === password);
    if (user && user.status === 'approved') {
      setLoggedInUser(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('loggedInUser', JSON.stringify(user));
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setLoggedInUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('loggedInUser');
    }
  };

  const createAccount = (username: string, password: string): boolean => {
    if (!dataContext) return false;
    const { users, setUsers } = dataContext;
    if (users.find(u => u.username === username)) {
      return false; // Username already exists
    }

    const newUser: User = {
      id: new Date().toISOString(), // Not a great ID, but works for this
      username,
      password,
      permissions: {
        dashboard: true,
        general: true,
        expenses: true,
        financials: true,
        edit: true,
        admin: users.length === 0, // First user is admin
      },
      status: users.length === 0 ? 'approved' : 'pending',
    };

    setUsers([...users, newUser]);
    return true;
  };

  const approveUser = (username: string) => {
    if (!dataContext) return;
    const { users, setUsers } = dataContext;
    const updatedUsers = users.map(u => u.username === username ? { ...u, status: 'approved' } : u);
    setUsers(updatedUsers);
  };

  const rejectUser = (username: string) => {
    if (!dataContext) return;
    const { users, setUsers } = dataContext;
    const updatedUsers = users.map(u => u.username === username ? { ...u, status: 'rejected' } : u);
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
