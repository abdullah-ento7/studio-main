
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Landmark, User, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-10">
        <Card className="w-full max-w-md mx-auto shadow-2xl rounded-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Landmark className="h-12 w-auto text-orange-500" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 text-base rounded-xl focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Password"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="pl-10 h-12 text-base rounded-xl focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
            </div>
            <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-xl transition-transform transform hover:scale-105 shadow-lg"
                onClick={handleLogin}
            >
              Login
            </Button>
            <div className="mt-4 text-center text-sm">
              Don't have an account?{' '}
              <Link href="/create-account" className="font-semibold text-orange-600 hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-repeat bg-center opacity-5" style={{backgroundImage: 'url(/path-to-your-pattern.svg)'}}></div>
        <div className="z-10 text-center space-y-4">
          <Landmark className="h-24 w-auto mx-auto animate-bounce" />
          <h2 className="text-5xl font-bold tracking-tight">
            Jugnoo Transport Network
          </h2>
          <p className="text-xl max-w-2xl mx-auto">
            Your trusted partner in logistics. Streamlined, efficient, and always on time.
          </p>
        </div>
        <div className="absolute bottom-4 right-4 text-xs opacity-70">
          &copy; {new Date().getFullYear()} Jugnoo Transport Network. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
