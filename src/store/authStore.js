"use client";

import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isInitialized: true }),
  
  checkAuth: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: !!data.user, isInitialized: true });
        return data.user;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
    set({ user: null, isAuthenticated: false, isInitialized: true });
    return null;
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }
}));
