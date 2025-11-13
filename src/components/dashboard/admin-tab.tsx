
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Save, Trash2, UserPlus, Copy, Edit, RotateCw } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';

type PermissionKey = keyof User['permissions'];

export default function AdminTab() {
  const { toast } = useToast();
  const { users, setUsers } = useData();
  const { loggedInUser } = useAuth();
  const [newUsername, setNewUsername] = React.useState('');
  const [newlyCreatedUser, setNewlyCreatedUser] = React.useState<User | null>(null);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);

  const handleCreateUser = () => {
    if (!newUsername) {
      toast({
        title: 'Invalid Username',
        description: 'Please enter a username.',
        variant: 'destructive',
      });
      return;
    }

    const password = Math.floor(100000 + Math.random() * 900000).toString();

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
    };

    setUsers(prev => [...prev, newUser]);
    setNewUsername('');
    setNewlyCreatedUser(newUser); // Show the dialog with credentials
  };

  const handlePermissionChange = (userId: string, permission: PermissionKey, value: boolean) => {
    setUsers(users.map(user => 
      user.id === userId
        ? { ...user, permissions: { ...user.permissions, [permission]: value } }
        : user
    ));
  };
  
  const handleSaveChanges = () => {
    toast({
        title: "Permissions Saved",
        description: "User permissions have been updated successfully.",
        className: 'bg-accent text-accent-foreground',
      });
      // In a real app, this would be persisted to a database.
      // The state is already updated in the context.
      console.log("Saving users:", users);
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
    toast({
        title: "User Removed",
        description: "The user has been removed from the system.",
        variant: "destructive"
    })
  }

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
    toast({
        title: "User Updated",
        description: `Details for ${updatedUser.username} have been updated.`,
    });
    setEditingUser(null);
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: 'Copied!', description: 'Credentials copied to clipboard.'})
    });
  }

  const allTabs: PermissionKey[] = ['dashboard', 'general', 'expenses', 'financials', 'edit', 'admin'];

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>
            Create a new user account with a username and a system-generated password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Label htmlFor="user-name" className="sr-only">Username</Label>
            <Input 
                id="user-name" 
                type="text" 
                placeholder="Enter username" 
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
            />
            <Button onClick={handleCreateUser}>
                <UserPlus className='mr-2'/>
                Create User
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Manage User Access</CardTitle>
            <CardDescription>
                Control which sections of the application each user can access. The password is only visible to the admin.
            </CardDescription>
        </CardHeader>
        <CardContent>
             <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Password (Visible to Admin)</TableHead>
                            {allTabs.map(tab => <TableHead key={tab} className="capitalize text-center">{tab}</TableHead>)}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className='font-medium'>{user.username}</TableCell>
                                <TableCell className='font-mono text-sm'>{user.password}</TableCell>
                                {allTabs.map(tab => (
                                    <TableCell key={tab} className="text-center">
                                        <Checkbox 
                                            checked={user.permissions[tab]}
                                            onCheckedChange={(checked) => handlePermissionChange(user.id, tab, !!checked)}
                                            disabled={user.id === loggedInUser?.id && tab === 'admin'}
                                        />
                                    </TableCell>
                                ))}
                                <TableCell className='text-right'>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={user.id === loggedInUser?.id}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the user <span className='font-bold'>{user.username}</span> and cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                       ))}
                    </TableBody>
                </Table>
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
                    </div>
                     <div className='flex items-center gap-4'>
                        <Label htmlFor='new-password' className='w-24'>Password</Label>
                        <Input id='new-password' value={newlyCreatedUser.password} readOnly className='font-mono' />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setNewlyCreatedUser(null)}>Close</Button>
                    <Button onClick={() => copyToClipboard(`Username: ${newlyCreatedUser.username}\nPassword: ${newlyCreatedUser.password}`)}>
                        <Copy className='mr-2'/>
                        Copy Credentials
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {editingUser && (
        <EditUserDialog
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={handleUpdateUser}
        />
      )}
    </div>
  );
}


interface EditUserDialogProps {
    user: User;
    onClose: () => void;
    onSave: (user: User) => void;
}

function EditUserDialog({ user, onClose, onSave }: EditUserDialogProps) {
    const [username, setUsername] = React.useState(user.username);
    const [password, setPassword] = React.useState(user.password);
    const [isDirty, setIsDirty] = React.useState(false);
    const [isDiscardAlertOpen, setIsDiscardAlertOpen] = React.useState(false);
    
    React.useEffect(() => {
        setUsername(user.username);
        setPassword(user.password);
        setIsDirty(false);
    }, [user]);

    const handleDirty = () => setIsDirty(true);

    const handleClose = () => {
        if (isDirty) {
            setIsDiscardAlertOpen(true);
        } else {
            onClose();
        }
    };

    const generateNewPassword = () => {
        handleDirty();
        const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
        setPassword(newPassword);
    }

    const handleSave = () => {
        onSave({ ...user, username, password });
        setIsDirty(false);
    }

    const handleDiscard = () => {
        onClose();
        setIsDiscardAlertOpen(false);
        setIsDirty(false);
    }

    return (
        <>
            <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User: {user.username}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4" onChange={handleDirty}>
                        <div className="space-y-2">
                            <Label htmlFor="edit-username">Username</Label>
                            <Input id="edit-username" value={username} onChange={e => setUsername(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-password">Password</Label>
                            <div className="flex items-center gap-2">
                                <Input id="edit-password" value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
                                <Button variant="outline" size="icon" onClick={generateNewPassword}><RotateCw/></Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleSave} disabled={!isDirty}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog open={isDiscardAlertOpen} onOpenChange={setIsDiscardAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to discard them?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDiscard}>Discard</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
