import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],

      // Sync from DB to local store
      pullFromDB: async () => {
        try {
          const res = await fetch("/api/user/favorites", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            console.log("Favorites pulled from DB:", data.favorites.length);
            set({ favorites: data.favorites || [] });
          }
        } catch (error) {
          console.error("Failed to pull favorites:", error);
        }
      },

      // Merge local with DB after login
      syncWithDB: async () => {
        const localItems = get().favorites;
        try {
          // Merge logic: push all local IDs to DB for merging
          await fetch("/api/user/favorites", {
            method: "POST",
            body: JSON.stringify({ 
              action: "merge", 
              productIds: localItems.map(p => p.id) 
            })
          });
          
          // After merge, pull the definitive list back
          await get().pullFromDB();
        } catch (error) {
          console.error("Failed to sync favorites:", error);
        }
      },

      addFavorite: async (product, authenticated = false) => {
        set((state) => {
          if (state.favorites.some(p => p.id === product.id)) return state;
          return { favorites: [...state.favorites, product] };
        });

        if (authenticated) {
          try {
            await fetch("/api/user/favorites", {
              method: "POST",
              body: JSON.stringify({ action: "add", productId: product.id })
            });
          } catch (error) {
            console.error("Sync add favorite failed:", error);
          }
        }
      },

      removeFavorite: async (productId, authenticated = false) => {
        set((state) => ({
          favorites: state.favorites.filter((p) => p.id !== productId)
        }));

        if (authenticated) {
          try {
            await fetch("/api/user/favorites", {
              method: "POST",
              body: JSON.stringify({ action: "remove", productId })
            });
          } catch (error) {
            console.error("Sync remove favorite failed:", error);
          }
        }
      },

      toggleFavorite: async (product, authenticated = false) => {
        const isFav = get().favorites.some(p => p.id === product.id);
        if (isFav) {
          await get().removeFavorite(product.id, authenticated);
        } else {
          await get().addFavorite(product, authenticated);
        }
      },

      isFavorite: (productId) => get().favorites.some(p => p.id === productId),

      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'niez-favorites-storage',
    }
  )
);
