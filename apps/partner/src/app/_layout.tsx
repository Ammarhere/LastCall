import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const loadUser = useAuthStore((s) => s.loadUser);
  useEffect(() => { loadUser(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle:     { backgroundColor: '#1d4ed8' },
          headerTintColor: '#fff',
          headerTitleStyle:{ fontWeight: '700' },
          headerBackTitle: 'Back',
        }}
      >
        <Stack.Screen name="(auth)"      options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
        <Stack.Screen name="index"       options={{ headerShown: false }} />

        <Stack.Screen name="bag/create"       options={{ title: 'Create Bag' }} />
        <Stack.Screen name="bag/templates"    options={{ title: 'Bag Templates' }} />
        <Stack.Screen name="payouts"          options={{ title: 'Payout History' }} />
        <Stack.Screen name="edit-profile"     options={{ title: 'Edit Business Profile' }} />
        <Stack.Screen name="documents"        options={{ title: 'Documents' }} />
        <Stack.Screen name="onboarding/step1-business"  options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/step2-documents" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/step3-review"    options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
