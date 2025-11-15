
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
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Save, Trash2, UserPlus, Copy, Edit, RotateCw } from 'lucide-react';
import DataTable from './data-table'; // Assuming you have a generic DataTable component
import { ColumnDef } from '@tanstack/react-table';

export default function AdminTab() {
  const dataContext = useData();
  const authContext = useAuth();
  const { user: loggedInUser } = useAuth();

  if (!dataContext || !authContext) {
    return <div>Loading...</div>;
  }

  const { users, setUsers } = dataContext;
  const { updateUserStatus } = authContext;

  const [newUsername, setNewUsername] = useState('');
  const [newlyCreatedUser, setNewlyCreatedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleCreateUser = () => {
    if (!newUsername) {
      toast({ title: 'Error', description: 'Please enter a username.', variant: 'destructive' });
      return;
    }
    if (users.find(u => u.username === newUsername)) {
        toast({ title: 'Error', description: 'Username already exists.', variant: 'destructive' });
        return;
    }
    const password = Math.random().toString(36).slice(-8);
    const newUser: User = {
      id: `U${Date.now()}`,
      username: newUsername,
      password: password,
      role: 'user',
      permissions: { 
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
    setNewlyCreatedUser(newUser);
  };
  
  const handleUpdateUser = () => {
    if (!editingUser) return;

    // Prevent removing the last admin
    if (editingUser.permissions?.admin === false) {
        const adminCount = users.filter(u => u.permissions?.admin).length;
        if (adminCount === 1 && users.find(u => u.id === editingUser.id)?.permissions?.admin) {
            toast({ title: 'Cannot Remove Last Admin', description: 'There must be at least one admin user.', variant: 'destructive'});
            return;
        }
    }

    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    toast({ title: 'User Updated', description: 'User details have been saved.' });
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.permissions?.admin) {
        const adminCount = users.filter(u => u.permissions?.admin).length;
        if (adminCount <= 1) {
            toast({ title: 'Cannot Delete Last Admin', description: 'You cannot delete the only admin account.', variant: 'destructive' });
            return;
        }
    }
    setUsers(users.filter(u => u.id !== userId));
    toast({ title: 'User Deleted', description: 'The user account has been deleted.' });
  };

  const pendingUsers = useMemo(() => users.filter(u => u.status === 'pending'), [users]);
  
  const userColumns: ColumnDef<User>[] = [
    { accessorKey: 'username', header: 'Username' },
    { accessorKey: 'status', header: 'Status' },
    {
        id: 'actions',
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="space-x-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            );
        }
    }
  ];

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
                    <Button size="sm" onClick={() => updateUserStatus(user.id, 'approved')}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateUserStatus(user.id, 'rejected')}>Reject</Button>
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
              onKeyDown={(e) => e.key === 'Enter' && handleCreateUser()}
            />
            <Button onClick={handleCreateUser}>
              <UserPlus className="mr-2 h-4 w-4" /> Create User
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>Edit user details, permissions, and status.</CardDescription>
        </CardHeader>
        <CardContent>
            <DataTable columns={userColumns} data={users.filter(u => u.status !== 'pending' && u.username !== loggedInUser?.username)} />
        </CardContent>
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
                        <Button size='sm' onClick={() => navigator.clipboard.writeText(newlyCreatedUser.username || '')}><Copy className='h-4 w-4' /></Button>
                    </div>
                    <div className='flex items-center gap-4'>
                        <Label htmlFor='new-password-display' className='w-24'>Password</Label>
                        <Input id='new-password-display' value={newlyCreatedUser.password} readOnly />
                        <Button size='sm' onClick={() => navigator.clipboard.writeText(newlyCreatedUser.password || '')}><Copy className='h-4 w-4' /></Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      )}

      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit User: {editingUser.username}</DialogTitle>
                    <DialogDescription>Modify the user's details and permissions below.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username-edit" className="text-right">Username</Label>
                        <Input id="username-edit" value={editingUser.username} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password-edit" className="text-right">Password</Label>
                        <Input id="password-edit" value={editingUser.password} onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                       <Label className="text-right">Permissions</Label>
                       <div className="col-span-3 grid grid-cols-2 gap-4 rounded-lg border p-4">
                        {Object.keys(editingUser.permissions).map(key => (
                            <div key={key} className="flex items-center space-x-2">
                                <Switch
                                id={`${editingUser.username}-${key}-edit`}
                                checked={editingUser.permissions[key as keyof User['permissions']]}
                                onCheckedChange={(value) => {
                                    const newPermissions = { ...editingUser.permissions, [key]: value };
                                    setEditingUser({ ...editingUser, permissions: newPermissions });
                                }}
                                />
                                <Label htmlFor={`${editingUser.username}-${key}-edit`} className="capitalize">{key}</Label>
                            </div>
                        ))}
                       </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleUpdateUser}><Save className='mr-2' /> Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
