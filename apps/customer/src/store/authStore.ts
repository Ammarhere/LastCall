import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  role: string;
  avatarUrl?: string;
  referralCode: string;
}

interface AuthState {
  user:        User | null;
  token:       string | null;
  isLoading:   boolean;
  setToken:    (token: string) => Promise<void>;
  loadUser:    () => Promise<void>;
  logout:      () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:      null,
  token:     null,
  isLoading: true,

  setToken: async (token) => {
    await SecureStore.setItemAsync('auth_token', token);
    set({ token });
    await get().loadUser();
  },

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) { set({ isLoading: false }); return; }
      set({ token });
      const { data } = await api.get('/users/me');
      set({ user: data.data, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync('auth_token');
      set({ user: null, token: null, isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await api.post('/auth/logout').catch(() => {});
    set({ user: null, token: null });
  },
}));
