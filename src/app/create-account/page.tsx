"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Copy } from 'lucide-react';

export default function CreateAccountPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [newlyCreatedUser, setNewlyCreatedUser] = useState<{ username: string; password_to_show: string } | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const validateInputs = () => {
        if (!/^[a-zA-Z]{6}$/.test(username)) {
            toast({
                title: 'Invalid Username',
                description: 'Username must be 6 alphabetic characters.',
                variant: 'destructive',
            });
            return false;
        }
        if (!/^[0-9]{6}$/.test(password)) {
            toast({
                title: 'Invalid Password',
                description: 'Password must be 6 numeric characters.',
                variant: 'destructive',
            });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateInputs()) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setNewlyCreatedUser({ username, password_to_show: password });
                 toast({
                    title: 'Success',
                    description: 'Account created successfully.',
                });
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'An error occurred.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center">Create Account</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="6 alphabetic characters"
                            maxLength={6}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="6 numeric characters"
                            maxLength={6}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Account'}
                    </Button>
                </form>
                 <p className="text-sm text-center">
                    Already have an account?{' '}
                    <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Sign in
                    </a>
                </p>
            </div>
            {newlyCreatedUser && (
                <Dialog open={!!newlyCreatedUser} onOpenChange={() => {
                    setNewlyCreatedUser(null);
                    router.push('/login');
                }}>
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
                                <Label htmlFor='new-password' className='w-24'>Password</Label>
                                <Input id='new-password' value={newlyCreatedUser.password_to_show} readOnly />
                                <Button size='sm' variant='ghost' onClick={() => navigator.clipboard.writeText(newlyCreatedUser.password_to_show)}><Copy className='h-4 w-4' /></Button>
                            </div>
                        </div>
                         <Button onClick={() => router.push('/login')}>Go to Login</Button>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}