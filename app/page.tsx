'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import POSInterface from '@/components/POSInterface';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth?.role === 'manager') {
      router.replace('/dashboard');
    }
  }, [auth?.role, router]);

  return <POSInterface />;
}
