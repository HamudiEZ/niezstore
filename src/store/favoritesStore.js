"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

let favRefreshSeq = 0;

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],
      ownerUserId: null,

      resetLocalSession: () => {
        favRefreshSeq += 1;
        set({ favorites: [], ownerUserId: null });
      },

      // Sync from DB to local store
      pullFromDB: async () => {
        favRefreshSeq += 1;
        try {
          const res = await fetch("/api/user/favorites", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            set({ favorites: data.favorites || [] });
          }
        } catch (error) {
          console.error("Failed to pull favorites:", error);
        }
      },

      // Merge local with DB after login (strictly isolated per userId)
      syncForUser: async (userId) => {
        favRefreshSeq += 1;
        if (!userId) {
          if (get().ownerUserId !== null) {
            set({ favorites: [], ownerUserId: null });
          }
          return;
        }

        const currentOwner = get().ownerUserId;
        if (currentOwner && currentOwner !== userId) {
          set({ favorites: [], ownerUserId: userId });
          await get().pullFromDB();
          return;
        }

        const localItems = get().favorites;
        try {
          if (currentOwner === null && localItems.length > 0) {
            await fetch("/api/user/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "merge",
                productIds: localItems.map((p) => p.id),
              }),
            });
          }
          set({ ownerUserId: userId });
          await get().pullFromDB();
        } catch (error) {
          console.error("Failed to sync favorites:", error);
        }
      },

      // Legacy alias preserved for callers
      syncWithDB: async (userId) => {
        if (userId) {
          await get().syncForUser(userId);
        } else {
          await get().pullFromDB();
        }
      },

      // Background Sync to update stale prices without requiring login
      refreshLocalFavorites: async () => {
        const snapshotItems = get().favorites;
        if (snapshotItems.length === 0) return;

        const reqSeq = ++favRefreshSeq;
        const startOwnerId = get().ownerUserId;
        const productIds = Array.from(
          new Set(snapshotItems.map((p) => p?.id).filter(Boolean))
        ).slice(0, 100);
        if (productIds.length === 0) return;

        try {
          const res = await fetch("/api/products/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds }),
          });
          if (!res.ok) return;

          const { products } = await res.json();
          if (!products) return;

          if (reqSeq !== favRefreshSeq || get().ownerUserId !== startOwnerId) {
            return;
          }

          const productMap = new Map(products.map((p) => [p.id, p]));
          const latestItems = get().favorites;
          const updatedFavorites = latestItems
            .map((item) => {
              const fresh = productMap.get(item.id);
              if (!fresh) {
                return productIds.includes(item.id) ? null : item;
              }
              if (!fresh.isActive) return null;

              const firstVariant = fresh.variants?.[0];
              const price = firstVariant ? Number(firstVariant.price) : 0;
              const previousPrice = firstVariant?.compareAtPrice
                ? Number(firstVariant.compareAtPrice)
                : null;

              let discountPercentage = null;
              if (previousPrice && price && previousPrice > price) {
                discountPercentage = Math.round(
                  ((previousPrice - price) / previousPrice) * 100
                );
              }

              return {
                ...item,
                price,
                previousPrice,
                discountPercentage,
              };
            })
            .filter(Boolean);

          set({ favorites: updatedFavorites });
        } catch (error) {
          console.error("Failed to refresh local favorites:", error);
        }
      },

      addFavorite: async (product, authenticated = false) => {
        set((state) => {
          if (state.favorites.some((p) => p.id === product.id)) return state;
          return { favorites: [...state.favorites, product] };
        });

        if (authenticated) {
          try {
            await fetch("/api/user/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "add", productId: product.id }),
            });
          } catch (error) {
            console.error("Sync add favorite failed:", error);
          }
        }
      },

      removeFavorite: async (productId, authenticated = false) => {
        set((state) => ({
          favorites: state.favorites.filter((p) => p.id !== productId),
        }));

        if (authenticated) {
          try {
            await fetch("/api/user/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "remove", productId }),
            });
          } catch (error) {
            console.error("Sync remove favorite failed:", error);
          }
        }
      },

      toggleFavorite: async (product, authenticated = false) => {
        const isFav = get().favorites.some((p) => p.id === product.id);
        if (isFav) {
          await get().removeFavorite(product.id, authenticated);
        } else {
          await get().addFavorite(product, authenticated);
        }
      },

      isFavorite: (productId) => get().favorites.some((p) => p.id === productId),

      clearFavorites: () => {
        favRefreshSeq += 1;
        set({ favorites: [] });
      },
    }),
    {
      name: "niez-favorites-storage",
      onRehydrateStorage: () => (state) => {
        if (state) state.refreshLocalFavorites();
      },
    }
  )
);
