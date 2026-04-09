import { create } from 'zustand';

const useAuthStore = create(set => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth:    (user, token) => set({ user, token, isLoading: false }),
  logout:     ()            => set({ user: null, token: null, isLoading: false }),
  setLoading: v             => set({ isLoading: v }),
}));

export default useAuthStore;
