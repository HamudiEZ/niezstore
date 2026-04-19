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

      // Background Sync to update stale prices without requiring login
      refreshLocalFavorites: async () => {
        const currentItems = get().favorites;
        if (currentItems.length === 0) return;
        
        try {
          const res = await fetch("/api/products/batch", {
            method: "POST",
            body: JSON.stringify({ productIds: currentItems.map(p => p.id) })
          });
          if (res.ok) {
            const { products } = await res.json();
            if (!products) return;
            
            const productMap = new Map(products.map(p => [p.id, p]));
            const updatedFavorites = currentItems.map(item => {
              const fresh = productMap.get(item.id);
              if (!fresh || !fresh.isActive) return null;
              
              const firstVariant = fresh.variants?.[0];
              const price = firstVariant ? Number(firstVariant.price) : 0;
              const previousPrice = firstVariant?.compareAtPrice ? Number(firstVariant.compareAtPrice) : null;
              
              let discountPercentage = null;
              if (previousPrice && price && previousPrice > price) {
                discountPercentage = Math.round(((previousPrice - price) / previousPrice) * 100);
              }

              return {
                ...item,
                price,
                previousPrice,
                discountPercentage
              };
            }).filter(Boolean);
            
            set({ favorites: updatedFavorites });
          }
        } catch (error) {
          console.error("Failed to refresh local favorites:", error);
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
      onRehydrateStorage: () => (state) => {
        if (state) state.refreshLocalFavorites();
      }
    }
  )
);
