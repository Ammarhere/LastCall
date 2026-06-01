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
          headerStyle:     { backgroundColor: '#16A34A' },
          headerTintColor: '#fff',
          headerTitleStyle:{ fontWeight: '700' },
          headerBackTitle: 'Back',
        }}
      >
        {/* Auth screens — no header */}
        <Stack.Screen name="(auth)"    options={{ headerShown: false }} />
        {/* Tabs — tabs handle their own headers */}
        <Stack.Screen name="(tabs)"    options={{ headerShown: false }} />
        <Stack.Screen name="index"     options={{ headerShown: false }} />

        {/* Screens with headers */}
        <Stack.Screen name="bag/[id]"         options={{ title: 'Bag Details' }} />
        <Stack.Screen name="order/[id]"       options={{ title: 'Order Details' }} />
        <Stack.Screen name="review/[id]"      options={{ title: 'Leave a Review' }} />
        <Stack.Screen name="partner/[id]"     options={{ title: 'Restaurant' }} />
        <Stack.Screen name="edit-profile"     options={{ title: 'Edit Profile' }} />
        <Stack.Screen name="favourites"       options={{ title: 'Favourites' }} />
        <Stack.Screen name="notifications"    options={{ title: 'Notifications' }} />
        <Stack.Screen name="payment-methods"  options={{ title: 'Payment Methods' }} />
      </Stack>
    </QueryClientProvider>
  );
}
