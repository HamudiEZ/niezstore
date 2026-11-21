"use client";

import { create } from "zustand";
import { useCartStore } from "./cartStore";
import { useFavoritesStore } from "./favoritesStore";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isInitialized: true }),

  checkAuth: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const nextUser = data.user || null;
        set({
          user: nextUser,
          isAuthenticated: !!nextUser,
          isInitialized: true,
        });
        if (!nextUser) {
          useCartStore.getState().syncForUser(null);
          useFavoritesStore.getState().syncForUser(null);
        }
        return nextUser;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }

    set({ user: null, isAuthenticated: false, isInitialized: true });
    useCartStore.getState().syncForUser(null);
    useFavoritesStore.getState().syncForUser(null);
    return null;
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      set({ user: null, isAuthenticated: false, isInitialized: true });
      useCartStore.getState().resetLocalSession();
      useFavoritesStore.getState().resetLocalSession();
    }
  },
}));
