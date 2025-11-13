'use client';
import { useAuth } from '@/context/auth-context';
import MainLayout from '@/components/dashboard/main-layout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { loggedInUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loggedInUser) {
      router.push('/login');
    }
  }, [loggedInUser, router]);

  if (!loggedInUser) {
    // You can render a loading spinner here
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return <MainLayout />;
}
