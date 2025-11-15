
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
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
            <Card className="w-full max-w-sm text-center">
                <CardHeader>
                    <div className="flex justify-center items-center mb-4">
                      <Logo className="h-16 w-auto text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold">Request Sent</CardTitle>
                    <CardDescription>Your account request has been sent to the admin for approval.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className='text-muted-foreground'>You will be notified once your account is approved. You can then log in.</p>
                </CardContent>
                <CardFooter className="flex-col items-center gap-4">
                    <Button className="w-full" onClick={() => router.push('/login')}>
                        Back to Login
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Logo className="h-16 w-auto text-primary" />
            </div>
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>Request a new account from the administrator.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your desired username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center gap-4">
            <div className="text-center text-sm">
                <Link href="/login" className="text-muted-foreground hover:text-primary">
                    Already have an account? Sign in
                </Link>
            </div>
            <Button className="w-full" onClick={handleCreateAccount}>
                Request Account
            </Button>
        </CardFooter>
      </Card>
      <div className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} <a href="https://jtn.com.pk" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Jugnoo Transport Network</a>
      </div>
    </div>
  );
}
