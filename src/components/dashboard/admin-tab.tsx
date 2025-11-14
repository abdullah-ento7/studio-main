
'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { User } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Save, Trash2, UserPlus, Copy, Edit, RotateCw } from 'lucide-react';

export default function AdminTab() {
  const dataContext = useData();
  const authContext = useAuth();
  const { loggedInUser } = useAuth();

  if (!dataContext || !authContext) {
    return <div>Loading...</div>;
  }

  const { users, setUsers } = dataContext;
  const { approveUser, rejectUser } = authContext;

  const [editableUsers, setEditableUsers] = useState<User[]>(users);
  const [newUsername, setNewUsername] = useState('');
  const [newlyCreatedUser, setNewlyCreatedUser] = useState<User | null>(null);

  const handlePermissionChange = (username: string, permission: string, value: boolean) => {
    if (permission === 'admin' && value) {
      const adminExists = editableUsers.some(u => u.permissions.admin);
      if (adminExists) {
        toast({
          title: 'Admin Limit Reached',
          description: 'Only one admin account is allowed.',
          variant: 'destructive',
        });
        return;
      }
    }
    setEditableUsers(editableUsers.map(u => 
      u.username === username 
        ? { ...u, permissions: { ...u.permissions, [permission]: value } } 
        : u
    ));
  };

  const handleSaveChanges = () => {
    setUsers(editableUsers);
    toast({ title: 'Changes Saved', description: 'User permissions have been updated.' });
  };

  const handleCreateUser = () => {
    if (!newUsername) {
      toast({ title: 'Error', description: 'Please enter a username.', variant: 'destructive' });
      return;
    }
    const password = Math.random().toString(36).slice(-8);
    const newUser: User = {
      id: `U${Date.now()}`,
      username: newUsername,
      password: password,
      permissions: { // Default permissions for a new user
        dashboard: true,
        general: true,
        expenses: false,
        financials: false,
        edit: false,
        admin: false,
      },
      status: 'approved',
    };

    setUsers(prev => [...prev, newUser]);
    setNewUsername('');
    setNewlyCreatedUser(newUser); // Show the dialog with credentials
  };

  const pendingUsers = useMemo(() => users.filter(u => u.status === 'pending'), [users]);
  const approvedUsers = useMemo(() => users.filter(u => u.status === 'approved' && u.username !== loggedInUser?.username), [users, loggedInUser]);

  return (
    <div className="space-y-6">
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Review and approve or reject new user requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-md border">
                  <span>{user.username}</span>
                  <div className="space-x-2">
                    <Button size="sm" onClick={() => approveUser(user.username)}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectUser(user.username)}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>Create a new user account and set their initial password.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Enter new username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <Button onClick={handleCreateUser}>
              <UserPlus className="mr-2 h-4 w-4" /> Create User
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage User Permissions</CardTitle>
          <CardDescription>Toggle permissions for each user.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {approvedUsers.map(user => (
              <details key={user.id} className="group">
                <summary className="flex items-center justify-between p-2 rounded-md border cursor-pointer">
                  <span className='font-medium'>{user.username}</span>
                  <Edit className='h-4 w-4 text-muted-foreground' />
                </summary>
                <div className="p-4 mt-2 border rounded-md">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.keys(user.permissions).map(key => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          id={`${user.username}-${key}`}
                          checked={user.permissions[key as keyof User['permissions']]}
                          onCheckedChange={(value) => handlePermissionChange(user.username, key, value)}
                        />
                        <Label htmlFor={`${user.username}-${key}`} className="capitalize">{key}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </CardContent>
        <CardFooter>
            <Button className='ml-auto' onClick={handleSaveChanges}>
                <Save className='mr-2' />
                Save Changes
            </Button>
        </CardFooter>
      </Card>
      
      {newlyCreatedUser && (
        <Dialog open={!!newlyCreatedUser} onOpenChange={() => setNewlyCreatedUser(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>User Created Successfully</DialogTitle>
                    <DialogDescription>
                        Please copy and share these credentials with the new user. This is the only time the password will be shown.
                    </DialogDescription>
                </DialogHeader>
                <div className='space-y-4 my-4'>
                    <div className='flex items-center gap-4'>
                        <Label htmlFor='new-username' className='w-24'>Username</Label>
                        <Input id='new-username' value={newlyCreatedUser.username} readOnly />
                        <Button size='sm' onClick={() => navigator.clipboard.writeText(newlyCreatedUser.username)}><Copy className='h-4 w-4' /></Button>
                    </div>
                    <div className='flex items-center gap-4'>
                        <Label htmlFor='new-password-display' className='w-24'>Password</Label>
                        <Input id='new-password-display' value={newlyCreatedUser.password} readOnly />
                        <Button size='sm' onClick={() => navigator.clipboard.writeText(newlyCreatedUser.password)}><Copy className='h-4 w-4' /></Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
