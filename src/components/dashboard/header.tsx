
'use client';

import * as React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { Logo } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

function LiveClock() {
    const [currentTime, setCurrentTime] = React.useState<Date | null>(null);

    React.useEffect(() => {
        // Set initial time on client-side to avoid hydration mismatch
        setCurrentTime(new Date());
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {currentTime ? (
                <>
                    <Clock className="h-4 w-4" />
                    <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    <span>|</span>
                    <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </>
            ) : (
                <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
            )}
        </div>
    )
}


export default function Header() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2">
        <Logo className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-semibold text-foreground">
          JTN Logistics
        </h1>
      </div>
      <div className="flex items-center gap-4 ml-auto">
        <LiveClock />
        <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
      </div>
    </header>
  );
}
