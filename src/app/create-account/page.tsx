
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
  const { createAccount } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleCreateAccount = () => {
    const success = createAccount(username, password);
    if (success) {
      toast({
        title: 'Account Created',
        description: `Welcome, ${username}! Please log in.`,
      });
      router.push('/login');
    } else {
      toast({
        title: 'Account Creation Failed',
        description: 'Username already exists.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Logo className="h-16 w-auto text-primary" />
            </div>
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
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
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleCreateAccount}>
            Create Account
          </Button>
        </CardFooter>
      </Card>
      <div className="mt-4 text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-primary">
            Already have an account? Sign in
        </Link>
      </div>
      <div className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} <a href="https://www.jtn.pcom.pk" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Jugnoo Transport Network</a>
      </div>
    </div>
  );
}
