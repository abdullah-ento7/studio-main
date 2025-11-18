'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { User, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    const success = await login(username, password);
    if (success) {
      toast({
        title: 'Login Successful',
        description: "You've been successfully logged in.",
      });
      router.push('/');
    } else {
      setError('Invalid username or password. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-background">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative z-10 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="mb-8">
          <Logo className="h-10 w-auto text-primary mb-6" />
          <h1 className="text-4xl font-headline font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-lg">
            Enter your credentials to access your dashboard.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-foreground ml-1"
            >
              Username
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="username"
                  type="text"
                  placeholder="6-character username (letters/digits)"
                  required
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                    setUsername(value.slice(0, 6));
                  }}
                  maxLength={6}
                  className="pl-12 h-14 rounded-xl border-muted-foreground/20 focus:border-primary/50 bg-white/80 dark:bg-black/80 backdrop-blur-sm shadow-sm transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground ml-1"
            >
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="pl-12 h-14 rounded-xl border-muted-foreground/20 focus:border-primary/50 bg-white/80 dark:bg-black/80 backdrop-blur-sm shadow-sm transition-all"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <ShieldAlert className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 mt-4 group"
            onClick={handleLogin}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading && (
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Link
              href="/create-account"
              className="font-semibold text-primary hover:text-accent transition-colors underline-offset-4 hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(124,58,237,0.2),_transparent_50%)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary/20 via-background to-accent/20 mix-blend-overlay" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse delay-700" />

        <div className="relative z-10 p-12 text-center max-w-xl backdrop-blur-sm rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Logistics <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Reimagined
            </span>
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            Experience the next generation of transport management. Streamlined
            operations, real-time tracking, and vibrant insights at your
            fingertips.
          </p>
        </div>
      </div>
    </div>
  );
}
