
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextProps {
  user: User | null;
  loggedInUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createAccount: (username: string, password: string) => Promise<boolean>;
  fetchUsers: () => void;
  updateUserStatus: (userId: string, status: 'approved' | 'rejected') => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data as User[]);
    }
  };

  // Function to fetch the user profile from your 'users' table
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data as User;
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userProfile = await fetchUserProfile(session.user.id);
        if (userProfile && userProfile.status === 'approved') {
          setUser(userProfile);
        }
      }
    };
    getSession();
    fetchUsers();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const userProfile = await fetchUserProfile(session.user.id);
        if (userProfile && userProfile.status === 'approved') {
          setUser(userProfile);
          if (event === 'INITIAL_SESSION') {
            fetchUsers(); // Also fetch users on initial session
          }
        } else {
          setUser(null); // User is not approved or doesn't exist
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // We use a dummy email since Supabase Auth requires it
    const email = `${username}@jtn.com.pk`; 
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error || !data.user) {
      console.error('Error logging in:', error?.message);
      toast({ title: 'Login Failed', description: 'Invalid username or password.', variant: 'destructive' });
      return false;
    }
    
    const userProfile = await fetchUserProfile(data.user.id);

    if (userProfile && userProfile.status === 'approved') {
        setUser(userProfile);
        toast({ title: 'Login Successful', description: `Welcome back, ${userProfile.username}!` });
        return true;
    }
    
    if (userProfile && userProfile.status === 'pending') {
      toast({ title: 'Login Failed', description: 'Your account is pending approval.', variant: 'destructive' });
    } else if (!userProfile) {
       toast({ title: 'Login Failed', description: 'User profile not found.', variant: 'destructive' });
    }

    // Sign out if login is not fully successful
    await supabase.auth.signOut();
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };

  const createAccount = async (username: string, password: string): Promise<boolean> => {
    const email = `${username}@jtn.com.pk`;
    
    // 1. Check if user already exists in auth.users
    // This is a workaround since Supabase doesn't have a direct 'check if user exists' function without signing in

    // 2. Sign up the new user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (authError) {
        console.error('Error creating auth user:', authError.message);
        return false;
    }
    if (!authData.user) {
        console.error('No user returned after sign up');
        return false;
    }
    
    // 3. Insert into public.users table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
            {
                id: authData.user.id, // Use the ID from the auth user
                username: username,
                role: 'user',
                status: 'pending',
                permissions: { 
                  dashboard: true, general: true, financials: false, reports: false, 
                  billing: false, edit: false, expenses: false, trips: false, admin: false 
                },
            },
        ]);

    if (userError) {
        console.error('Error creating user profile:', userError.message);
        // Optional: Clean up the created auth.user if the profile insertion fails
        // await supabase.auth.api.deleteUser(authData.user.id);
        return false;
    }

    fetchUsers(); // Refresh the local user list
    return true;
  };

  const updateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('users').update({ status }).eq('id', userId);
    if (error) {
      console.error(`Error updating user status to ${status}:`, error);
      toast({ title: 'Error', description: 'Failed to update user status.', variant: 'destructive'});
    } else {
      fetchUsers(); 
      toast({ title: 'Success', description: `User status updated to ${status}.`});
    }
  };

  const updateUser = async (user: User) => {
    const { id, ...updateData } = user;
    const { error } = await supabase.from('users').update(updateData).eq('id', id);
    if (error) {
        console.error('Error updating user:', error);
        toast({ title: 'Update Failed', description: 'Could not save user changes.', variant: 'destructive'});
    } else {
        toast({ title: 'User Updated', description: 'User details have been saved successfully.' });
        fetchUsers();
    }
  }

  const value = {
    user,
    loggedInUser: user,
    users,
    login,
    logout,
    createAccount,
    fetchUsers,
    updateUserStatus,
    updateUser,
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
