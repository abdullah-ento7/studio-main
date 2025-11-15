
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
import { Logo } from '@/components/icons';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    const success = await login(username, password);
    if (success) {
      router.push('/');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Logo className="h-16 w-auto text-primary" />
            </div>
          <CardTitle className="text-3xl font-bold">Sign In</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
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
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center gap-4">
          <div className="text-center text-sm">
            <Link href="/create-account" className="text-muted-foreground hover:text-primary">
                Don't have an account? Create one
            </Link>
          </div>
          <Button className="w-full" onClick={handleLogin}>
            Sign In
          </Button>
        </CardFooter>
      </Card>
      <div className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} <a href="https://jtn.com.pk" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Jugnoo Transport Network</a>
      </div>
    </div>
  );
}
