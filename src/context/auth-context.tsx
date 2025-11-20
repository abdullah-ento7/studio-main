'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { fetchById, updateRecord, fetchData as fetchTableData } from '@/lib/data';

type UserStatus = "approved" | "pending" | "disabled" | "rejected";

interface AuthContextProps {
  user: User | null;
  users: User[];
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createAccount: (username: string, password: string) => Promise<boolean>;
  fetchUsers: () => Promise<void>;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error fetching session:", error.message);
          setLoading(false);
          return;
        }

        if (session) {
            const { data: userProfile, error: profileError } = await fetchById<User>('users', session.user.id);

          if (profileError) {
            console.error("Error fetching user profile:", profileError.message);
            await supabase.auth.signOut(); 
            setUser(null);
          } else if (userProfile) {
            if(userProfile.status === 'pending') {
                toast({ title: 'Account Pending', description: 'Your account is pending approval from an administrator.', variant: 'destructive' });
                await supabase.auth.signOut();
                setUser(null);
            } else if (userProfile.status === 'disabled') {
                toast({ title: 'Account Disabled', description: 'Your account has been disabled. Please contact an administrator.', variant: 'destructive' });
                await supabase.auth.signOut();
                setUser(null);
            } else {
                setUser(userProfile as User);
            }
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error("An unexpected error occurred during session fetch:", e);
        setUser(null);
      }
      setLoading(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      if (event === 'SIGNED_IN' && session) {
        const { data: userProfile } = await fetchById<User>('users', session.user.id);
        setUser(userProfile as User || null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUsers([]);
        router.push('/login');
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast, router]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ title: 'Login Failed', description: data.message || 'Invalid username or password.', variant: 'destructive' });
        return false;
      }

      const { error: sessionError } = await supabase.auth.setSession(data.session);

      if (sessionError) {
          console.error("Error setting session:", sessionError.message);
          toast({ title: 'Login Failed', description: 'Could not establish a session.', variant: 'destructive' });
          return false;
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: 'Login Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout failed:", error.message);
      toast({ title: 'Logout Failed', description: 'An error occurred during logout.', variant: 'destructive' });
    }
  };

  const createAccount = async (username: string, password: string): Promise<boolean> => {
    const usernameRegex = /^[a-z0-9]{6}$/;
    if (!usernameRegex.test(username)) {
      toast({ title: 'Invalid Username', description: 'Username must be exactly 6 lowercase letters or digits.', variant: 'destructive' });
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
        toast({
            title: 'Invalid Password',
            description: 'Password must be at least 6 characters and include uppercase, lowercase, and numbers.',
            variant: 'destructive',
        });
        return false;
    }

    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ title: 'Account Creation Failed', description: data.message || 'An unknown error occurred.', variant: 'destructive' });
        return false;
      }

      toast({ title: 'Account Created', description: 'Your account has been created successfully. You can now log in.' });
      router.push('/login');
      return true;
    } catch (error) {
      console.error('Error creating account:', error);
      toast({ title: 'Account Creation Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
      return false;
    }
  };

  const fetchUsers = useCallback(async () => {
    if (user?.role !== 'admin') return;

    const { data, error } = await fetchTableData<User>('users');
    if (error) {
      console.error('Error fetching users:', error.message);
      toast({ title: 'Error Fetching Users', description: 'Could not fetch user list.', variant: 'destructive' });
    } else {
      setUsers(data as User[]);
    }
  }, [user, toast]);

  const updateUser = async (userId: string, updates: Partial<User>) => {
    if (user?.role !== 'admin') {
      toast({ title: 'Permission Denied', description: 'You do not have permission to update user information.', variant: 'destructive' });
      return;
    }

    const { data, error } = await updateRecord('users', userId, updates);

    if (error) {
      console.error('Error updating user:', error.message);
      toast({ title: 'Update Failed', description: 'Could not update user information.', variant: 'destructive' });
    } else {
      toast({ title: 'Update Successful', description: 'User information has been updated.' });
      if (data) {
        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...data[0] } : u));
      }
    }
  };

  const updateUserStatus = async (userId: string, status: UserStatus) => {
    if (user?.role !== 'admin') {
      toast({ title: 'Permission Denied', description: 'You do not have permission to update user status.', variant: 'destructive' });
      return;
    }

    const { error } = await updateRecord('users', userId, { status });

    if (error) {
      console.error('Error updating user status:', error.message);
      toast({ title: 'Update Failed', description: 'Could not update user status.', variant: 'destructive' });
    } else {
      toast({ title: 'Update Successful', description: `User status has been updated to ${status}.` });
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, status } : u));
    }
  };

  return (
    <AuthContext.Provider value={{ user, users, loading, login, logout, createAccount, fetchUsers, updateUser, updateUserStatus }}>
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
