import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuthStore from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const token = useAuthStore(s => s.token);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token
        ? <Stack.Screen name="Main"  component={TabNavigator} />
        : <Stack.Screen name="Login" component={LoginScreen} />}
    </Stack.Navigator>
  );
}
