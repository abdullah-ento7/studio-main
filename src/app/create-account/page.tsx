
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Landmark, User, Lock, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CreateAccountPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { createAccount } = useAuth();
  const router = useRouter();

  const handleCreateAccount = async () => {
    const success = await createAccount(username, password);
    if (success) {
      setIsSubmitted(true);
    }
  };
  
  if (isSubmitted) {
    return (
        <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
            <div className="flex items-center justify-center p-6 lg:p-10">
                <Card className="w-full max-w-md mx-auto shadow-2xl rounded-2xl text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <PartyPopper className="h-16 w-auto text-green-500 animate-bounce" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight">Request Sent!</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Your account request is now pending admin approval. You will be notified shortly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            onClick={() => router.push('/login')} 
                            className="w-full h-12 text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-xl transition-transform transform hover:scale-105 shadow-lg"
                        >
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-10 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-repeat bg-center opacity-5" style={{backgroundImage: 'url(/path-to-your-pattern.svg)'}}></div>
                <div className="z-10 text-center space-y-4">
                    <Landmark className="h-24 w-auto mx-auto" />
                    <h2 className="text-5xl font-bold tracking-tight">Join Our Network</h2>
                    <p className="text-xl max-w-2xl mx-auto">
                        Become a part of a revolutionary platform for logistics management.
                    </p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="flex items-center justify-center p-6 lg:p-10">
            <Card className="w-full max-w-md mx-auto shadow-2xl rounded-2xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Landmark className="h-12 w-auto text-orange-500" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Create Your Account</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Enter your details to request a new account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-4">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                id="username" 
                                type="text" 
                                placeholder="Username (1-6 lowercase letters)"
                                required 
                                value={username}
                                onChange={(e) => {
                                const value = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
                                setUsername(value.slice(0, 6));
                                }}
                                maxLength={6}
                                className="pl-10 h-12 text-base rounded-xl focus:ring-2 focus:ring-orange-500/50"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                id="password" 
                                type="password" 
                                placeholder="Password (6-digit PIN)"
                                required 
                                value={password}
                                onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setPassword(value.slice(0, 6));
                                }}
                                maxLength={6}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
                                className="pl-10 h-12 text-base rounded-xl focus:ring-2 focus:ring-orange-500/50"
                            />
                        </div>
                    </div>
                    <Button 
                        onClick={handleCreateAccount} 
                        type="submit" 
                        className="w-full h-12 text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-xl transition-transform transform hover:scale-105 shadow-lg"
                    >
                        Request Account
                    </Button>
                    <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-orange-600 hover:underline">
                        Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-10 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-repeat bg-center opacity-5" style={{backgroundImage: 'url(/path-to-your-pattern.svg)'}}></div>
            <div className="z-10 text-center space-y-4">
                <Landmark className="h-24 w-auto mx-auto animate-pulse" />
                <h2 className="text-5xl font-bold tracking-tight">Join Our Network</h2>
                <p className="text-xl max-w-2xl mx-auto">
                    Become a part of an efficient and reliable transport management system.
                </p>
            </div>
             <div className="absolute bottom-4 right-4 text-xs opacity-70">
                &copy; {new Date().getFullYear()} Jugnoo Transport Network. All Rights Reserved.
            </div>
        </div>
    </div>
  );
}
