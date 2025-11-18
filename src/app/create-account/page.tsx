
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { User, Lock, CheckCircle2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export default function CreateAccountPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { createAccount } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleCreateAccount = async () => {
    setError('');
    setIsLoading(true);
    const success = await createAccount(username, password);
    if (success) {
      toast({
        title: 'Account Request Sent',
        description: 'Your request has been submitted for approval.',
      });
      setIsSubmitted(true);
    } else {
      // Error toasts are handled by the auth context
    }
    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

        <div className="max-w-md w-full mx-4 bg-white/50 dark:bg-black/50 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Request Sent!</h2>
          <p className="text-muted-foreground mb-8">
            Your account request has been successfully submitted. An administrator
            will review your application shortly.
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full h-12 rounded-xl text-lg font-medium bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all"
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-background">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1580674684081-7617fbf3d745?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

        <div className="relative z-10 p-12 max-w-xl">
          <div className="mb-6 inline-block px-4 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-sm font-medium text-white">
            Join the network
          </div>
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Start Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Journey
            </span>
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            Create an account to manage fleets, track expenses, and generate
            comprehensive reports with modern efficiency.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative z-10 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
          <Logo className="h-10 w-auto text-primary mb-6" />
          <h1 className="text-4xl font-headline font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Create Account
          </h1>
          <p className="text-muted-foreground text-lg">
            Join Jugnoo Transport Network today.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor='username' className="text-sm font-medium text-foreground ml-1">Username</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary z-10" />
              <Input
                id="username"
                type="text"
                placeholder="6 lowercase letters (e.g. 'johndoe')"
                required
                value={username}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
                  setUsername(value.slice(0, 6));
                }}
                maxLength={6}
                className="pl-12 h-14 rounded-xl border-muted-foreground/20 focus:border-primary/50 bg-white/80 dark:bg-black/80 backdrop-blur-sm shadow-sm transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                {username.length}/6
              </div>
            </div>
            <p className="text-xs text-muted-foreground ml-1">
              Must be exactly 6 lowercase letters.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor='password' className="text-sm font-medium text-foreground ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary z-10" />
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters (case-sensitive, with numbers)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
                className="pl-12 h-14 rounded-xl border-muted-foreground/20 focus:border-primary/50 bg-white/80 dark:bg-black/80 backdrop-blur-sm shadow-sm transition-all"
              />
            </div>
            <p className="text-xs text-muted-foreground ml-1">
              Must be at least 6 characters and include uppercase, lowercase, and numbers.
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <ShieldAlert className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          <Button
            onClick={handleCreateAccount}
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 mt-4"
          >
            {isLoading ? 'Requesting...' : 'Request Account'}
          </Button>
        </div>
      </div>
    </div>
  );
}
