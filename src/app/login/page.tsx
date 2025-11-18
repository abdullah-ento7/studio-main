
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
          <CardTitle className="text-4xl font-bold text-gray-800 dark:text-white">Sign In</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-lg text-gray-700 dark:text-gray-300">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 text-lg border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password"className="text-lg text-gray-700 dark:text-gray-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 text-lg border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center gap-4">
          <Button className="w-full py-3 text-lg bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg" onClick={handleLogin}>
            Sign In
          </Button>
          <div className="text-center text-sm">
            <Link href="/create-account" className="text-gray-600 hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400">
                Don't have an account? Create one
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
