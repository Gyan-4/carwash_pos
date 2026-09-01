'use client';

import { useAuth } from '@/context/AuthContext';
import LoginScreen from '@/components/LoginScreen';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  return <Dashboard />;
}