import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#1d4ed8" /></View>;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (!user.partner || user.partner.status === 'PENDING') return <Redirect href="/onboarding/step1-business" />;
  return <Redirect href="/(tabs)/dashboard" />;
}
