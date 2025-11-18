
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import Link from 'next/link';

export default function CreateAccountPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { createAccount } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleCreateAccount = async () => {
    if (!username || !password) {
        toast({
            title: 'Missing Information',
            description: 'Please enter both a username and a password.',
            variant: 'destructive',
        });
        return;
    }

    const success = await createAccount(username, password);
    if (success) {
      setIsSubmitted(true);
    } else {
      toast({
        title: 'Account Creation Failed',
        description: 'Username might already exist or there was a server error.',
        variant: 'destructive',
      });
    }
  };
  
  if (isSubmitted) {
    return (
        <div 
          className="flex min-h-screen flex-col items-center justify-center bg-cover bg-center p-4" 
          style={{ backgroundImage: "url('https://source.unsplash.com/random/?transport')" }}
        >
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <Card className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-sm dark:bg-gray-950/90 text-center">
                <CardHeader>
                    <div className="flex justify-center items-center mb-6">
                      <Logo className="h-20 w-auto text-orange-500" />
                    </div>
                    <CardTitle className="text-4xl font-bold text-gray-800 dark:text-white">Request Sent</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">Your account request has been sent to the admin for approval.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className='text-gray-600 dark:text-gray-400'>You will be notified once your account is approved. You can then log in.</p>
                </CardContent>
                <CardFooter className="flex-col items-center gap-4">
                    <Button className="w-full py-3 text-lg bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg" onClick={() => router.push('/login')}>
                        Back to Login
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  return (
    <div 
      className="flex min-h-screen flex-col items-center justify-center bg-cover bg-center p-4" 
      style={{ backgroundImage: "url('https://source.unsplash.com/random/?transport')" }}
    >
        <div className="absolute inset-0 bg-black opacity-50"></div>
      <Card className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-sm dark:bg-gray-950/90">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-6">
              <Logo className="h-20 w-auto text-orange-500" />
            </div>
          <CardTitle className="text-4xl font-bold text-gray-800 dark:text-white">Create Account</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">Request a new account from the administrator.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-lg text-gray-700 dark:text-gray-300">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your desired username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 text-lg border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-lg text-gray-700 dark:text-gray-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
              className="w-full px-4 py-3 text-lg border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center gap-4">
            <Button className="w-full py-3 text-lg bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg" onClick={handleCreateAccount}>
                Request Account
            </Button>
            <div className="text-center text-sm">
                <Link href="/login" className="text-gray-600 hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400">
                    Already have an account? Sign in
                </Link>
            </div>
        </CardFooter>
      </Card>
      <div className="mt-8 text-center text-sm text-white/80">
        © {new Date().getFullYear()} <a href="https://jtn.com.pk" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400">Jugnoo Transport Network</a>
      </div>
    </div>
  );
}
