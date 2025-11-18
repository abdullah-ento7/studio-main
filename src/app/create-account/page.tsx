
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Landmark } from 'lucide-react';

export default function CreateAccountPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { createAccount } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleCreateAccount = async () => {
    const usernameRegex = /^[a-z]{1,6}$/;
    const passwordRegex = /^[0-9]{6}$/;

    if (!usernameRegex.test(username)) {
      toast({
        title: 'Invalid Username',
        description: 'Username must be 1-6 lowercase letters and contain no numbers or special characters.',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordRegex.test(password)) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be exactly 6 digits.',
        variant: 'destructive',
      });
      return;
    }

    const success = await createAccount(username, password);
    if (success) {
      setIsSubmitted(true);
    } else {
      // The toast for failure is already handled in the auth context
    }
  };
  
  if (isSubmitted) {
    return (
        <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
          <div className="flex items-center justify-center py-12">
            <div className="mx-auto grid w-[350px] gap-6 text-center">
                <h1 className="text-3xl font-bold">Request Sent</h1>
                <p className="text-balance text-muted-foreground">
                    Your account request has been sent to the admin for approval. You will be notified upon approval.
                </p>
                <Button onClick={() => router.push('/login')} className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600">
                    Back to Login
                </Button>
            </div>
          </div>
          <div className="hidden bg-gradient-to-br from-orange-400 to-yellow-500 lg:flex lg:flex-col items-center justify-center space-y-4 p-10">
            <Landmark className="h-20 w-auto text-white" />
            <h2 className="text-4xl font-bold text-center text-white">
              Join Our Network
            </h2>
            <p className="text-lg text-center text-white/90">
              Become a part of an efficient and reliable transport management system.
            </p>
          </div>
        </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
        <div className="flex items-center justify-center py-12">
            <div className="mx-auto grid w-[350px] gap-6">
              <div className="grid gap-2 text-center">
                <h1 className="text-3xl font-bold">Create an account</h1>
                <p className="text-balance text-muted-foreground">
                  Enter your details below to request a new account.
                </p>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="Up to 6 lowercase letters"
                    required 
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
                      setUsername(value.slice(0, 6));
                    }}
                    maxLength={6}
                   />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="6-digit PIN"
                    required 
                    value={password}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setPassword(value.slice(0, 6));
                    }}
                    maxLength={6}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
                  />
                </div>
                <Button onClick={handleCreateAccount} type="submit" className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600">
                  Request Account
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                  Sign in
                </Link>
              </div>
            </div>
        </div>
        <div className="hidden bg-gradient-to-br from-orange-400 to-yellow-500 lg:flex lg:flex-col items-center justify-center space-y-4 p-10">
            <Landmark className="h-20 w-auto text-white" />
            <h2 className="text-4xl font-bold text-center text-white">
              Join Our Network
            </h2>
            <p className="text-lg text-center text-white/90">
              Become a part of an efficient and reliable transport management system.
            </p>
        </div>
    </div>
  );
}
