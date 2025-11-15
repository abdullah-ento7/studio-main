
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
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Save, Trash2, UserPlus, Copy, Edit, Check, X, Users } from 'lucide-react';
import DataTable from './data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../ui/badge';

export default function AdminTab() {
  const dataContext = useData();
  const authContext = useAuth();
  const { user: loggedInUser } = useAuth();

  if (!dataContext || !authContext) {
    return <div>Loading...</div>;
  }

  const { users, setUsers } = dataContext;
  const { updateUserStatus, updateUser } = authContext;

  const [newUsername, setNewUsername] = useState('');
  const [newlyCreatedUser, setNewlyCreatedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

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
        financials: true,
        reports: true,
        billing: true,
        edit: true,
        expenses: true,
        trips: true,
      },
      status: loggedInUser.permissions?.admin ? 'approved' : 'pending',
    };

    setUsers(prev => [...prev, newUser]);
    setNewUsername('');
    setNewlyCreatedUser(newUser);
    toast({ title: 'User Created', description: 'A new user has been created with a temporary password.'});
  };
  
  const handleUpdateUser = () => {
    if (!editingUser) return;

    // Prevent removing the last admin
    if (editingUser.permissions?.admin === false) {
        const adminCount = users.filter(u => u.permissions?.admin && u.status === 'approved').length;
        if (adminCount <= 1 && users.find(u => u.id === editingUser.id)?.permissions?.admin) {
            toast({ title: 'Cannot Remove Last Admin', description: 'There must be at least one admin user.', variant: 'destructive'});
            return;
        }
    }

    updateUser(editingUser);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.permissions?.admin) {
        const adminCount = users.filter(u => u.permissions?.admin && u.status === 'approved').length;
        if (adminCount <= 1) {
            toast({ title: 'Cannot Delete Last Admin', description: 'You cannot delete the only admin account.', variant: 'destructive' });
            return;
        }
    }
    // Instead of deleting, we can set the status to 'rejected' or a new 'deleted' status
    updateUserStatus(userId, 'rejected');
    toast({ title: 'User Disabled', description: 'The user account has been disabled.' });
  };

  const pendingUsers = useMemo(() => users.filter(u => u.status === 'pending'), [users]);
  const approvedUsers = useMemo(() => users.filter(u => u.status === 'approved' && u.id !== loggedInUser?.id), [users, loggedInUser]);

  const userColumns: ColumnDef<User>[] = [
    { accessorKey: 'username', header: 'Username' },
    {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => <span className="capitalize">{row.original.role}</span>
    },
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
  
  const pendingUserColumns: ColumnDef<User>[] = [
    { accessorKey: 'username', header: 'Username' },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="space-x-2 text-right">
                    <Button size="sm" variant='ghost' onClick={() => updateUserStatus(user.id, 'approved')}><Check className="h-4 w-4 text-green-500" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => updateUserStatus(user.id, 'rejected')}><X className="h-4 w-4 text-red-500" /></Button>
                </div>
            );
        }
    }
  ];

  return (
    <div className="space-y-6">
        
      <div className='grid lg:grid-cols-2 gap-6'>
        <Card>
            <CardHeader>
            <CardTitle className='flex items-center'><Users className='mr-2'/> Active Users</CardTitle>
            <CardDescription>Edit user details, permissions, and status for approved accounts.</CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={userColumns} data={approvedUsers} />
            </CardContent>
        </Card>

        <div className='flex flex-col gap-6'>
            {pendingUsers.length > 0 && (
            <Card>
                <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Review and approve or reject new user requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable columns={pendingUserColumns} data={pendingUsers} />
                </CardContent>
            </Card>
            )}

            <Card>
                <CardHeader>
                <CardTitle>Create New User</CardTitle>
                <CardDescription>Create a new pre-approved user account with a temporary password.</CardDescription>
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
        </div>
      </div>
      
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
                        <Button size='sm' variant='ghost' onClick={() => navigator.clipboard.writeText(newlyCreatedUser.username || '')}><Copy className='h-4 w-4' /></Button>
                    </div>
                    <div className='flex items-center gap-4'>
                        <Label htmlFor='new-password-display' className='w-24'>Password</Label>
                        <Input id='new-password-display' value={newlyCreatedUser.password} readOnly />
                        <Button size='sm' variant='ghost' onClick={() => navigator.clipboard.writeText(newlyCreatedUser.password || '')}><Copy className='h-4 w-4' /></Button>
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
                    <DialogDescription>Modify the user's role and permissions.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username-edit" className="text-right">Username</Label>
                        <Input id="username-edit" value={editingUser.username} readOnly disabled className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Role</Label>
                         <div className="col-span-3 flex items-center space-x-2">
                            <Switch
                                id={`${editingUser.username}-role-edit`}
                                checked={editingUser.role === 'admin'}
                                onCheckedChange={(value) => {
                                    const newRole = value ? 'admin' : 'user';
                                    const newPermissions = { ...(editingUser.permissions || {}), admin: value };
                                    setEditingUser({ ...editingUser, role: newRole, permissions: newPermissions });
                                }}
                            />
                            <Label htmlFor={`${editingUser.username}-role-edit`} className="capitalize">
                                {editingUser.role === 'admin' ? 'Admin' : 'User'}
                            </Label>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                       <Label className="text-right">Permissions</Label>
                       <div className="col-span-3 grid grid-cols-2 gap-4 rounded-lg border p-4">
                        {Object.keys(editingUser.permissions ?? {}).filter(k => k !== 'admin').map(key => (
                            <div key={key} className="flex items-center space-x-2">
                                <Switch
                                id={`${editingUser.username}-${key}-edit`}
                                checked={editingUser.permissions?.[key as keyof User['permissions']]}
                                onCheckedChange={(value) => {
                                    const newPermissions = { ...(editingUser.permissions ?? {}), [key]: value };
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
