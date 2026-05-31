import { QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { queryClient } from '../src/lib/queryClient';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const loadUser = useAuthStore((s) => s.loadUser);
  useEffect(() => { loadUser(); }, []);
  return <QueryClientProvider client={queryClient}><Slot /></QueryClientProvider>;
}
