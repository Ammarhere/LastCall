import { create } from 'zustand';

interface AdminUser { id: string; email: string; name?: string; role: string; }

interface AdminAuthState {
  user:    AdminUser | null;
  token:   string | null;
  login:   (token: string, user: AdminUser) => void;
  logout:  () => void;
}

export const useAdminAuth = create<AdminAuthState>((set) => ({
  user:  localStorage.getItem('admin_token') ? { id: '', email: '', role: 'ADMIN' } : null,
  token: localStorage.getItem('admin_token'),

  login: (token, user) => {
    localStorage.setItem('admin_token', token);
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    set({ token: null, user: null });
  },
}));
