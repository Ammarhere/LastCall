import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface PartnerUser {
  id: string;
  phone: string;
  name?: string;
  role: string;
  partner?: { id: string; businessName: string; status: string; logoUrl?: string; rating: number };
}

interface AuthState {
  user:      PartnerUser | null;
  token:     string | null;
  isLoading: boolean;
  setToken:  (token: string) => Promise<void>;
  loadUser:  () => Promise<void>;
  logout:    () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:      null,
  token:     null,
  isLoading: true,

  setToken: async (token) => {
    await SecureStore.setItemAsync('partner_auth_token', token);
    set({ token });
    await get().loadUser();
  },

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync('partner_auth_token');
      if (!token) { set({ isLoading: false }); return; }
      set({ token });
      const { data } = await api.get('/users/me');
      const user = data.data;
      // Attach partner profile if exists
      try {
        const { data: pData } = await api.get('/partners/me');
        user.partner = pData.data;
      } catch {}
      set({ user, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync('partner_auth_token');
      set({ user: null, token: null, isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('partner_auth_token');
    set({ user: null, token: null });
  },
}));
