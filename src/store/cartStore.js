"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // Array of { product, variant, quantity }

      // Sync from DB to local store
      pullFromDB: async () => {
        try {
          const res = await fetch("/api/user/cart", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            // Map keys if API returns different structure, but here we assume match
            set({ items: data.cart || [] });
          }
        } catch (error) {
          console.error("Failed to pull cart:", error);
        }
      },

      // Merge local with DB after login
      syncWithDB: async () => {
        const localItems = get().items;
        try {
          await fetch("/api/user/cart", {
            method: "POST",
            body: JSON.stringify({ 
              action: "merge", 
              items: localItems 
            })
          });
          await get().pullFromDB();
        } catch (error) {
          console.error("Failed to sync cart:", error);
        }
      },

      // Background Sync to update stale prices/stock without requiring login
      refreshLocalPrices: async () => {
        const currentItems = get().items;
        if (currentItems.length === 0) return;
        
        try {
          const res = await fetch("/api/products/batch", {
            method: "POST",
            body: JSON.stringify({ variantIds: currentItems.map(i => i.variant.id) })
          });
          if (res.ok) {
            const { variants } = await res.json();
            if (!variants) return;
            
            const variantMap = new Map(variants.map(v => [v.id, v]));
            const updatedItems = currentItems.map(item => {
              const fresh = variantMap.get(item.variant.id);
              if (!fresh || !fresh.isActive || !fresh.product.isActive) {
                // Si ya no existe o est\u00e1 inactivo, lo botamos
                return null;
              }
              const safeQuantity = Math.min(item.quantity, fresh.stock);
              
              return {
                ...item,
                quantity: safeQuantity,
                variant: {
                   ...item.variant,
                   price: Number(fresh.price),
                   compareAtPrice: fresh.compareAtPrice ? Number(fresh.compareAtPrice) : null,
                   stock: fresh.stock
                }
              };
            }).filter(Boolean); // filtra items inactivos
            
            set({ items: updatedItems });
          }
        } catch (error) {
          console.error("Failed to refresh local prices:", error);
        }
      },

      addItem: async (product, variant, quantity = 1, authenticated = false) => {
        let updatedItems = [...get().items];
        const existingItemIndex = updatedItems.findIndex(
          (item) => item.variant.id === variant.id
        );

        let finalQuantity = quantity;

        if (existingItemIndex >= 0) {
          const newQty = Math.min(
            updatedItems[existingItemIndex].quantity + quantity,
            typeof variant.stock === 'number' ? variant.stock : 99
          );
          updatedItems[existingItemIndex].quantity = newQty;
          finalQuantity = newQty;
          set({ items: updatedItems });
        } else {
          updatedItems = [...updatedItems, { product, variant, quantity }];
          set({ items: updatedItems });
        }

        if (authenticated) {
          try {
            await fetch("/api/user/cart", {
              method: "POST",
              body: JSON.stringify({ 
                action: "set", 
                item: { productId: product.id, variantId: variant.id, quantity: finalQuantity } 
              })
            });
          } catch (error) {
            console.error("Sync add cart failed:", error);
          }
        }
      },

      removeItem: async (variantId, authenticated = false) => {
        set((state) => ({
          items: state.items.filter((item) => item.variant.id !== variantId)
        }));

        if (authenticated) {
          try {
            await fetch("/api/user/cart", {
              method: "POST",
              body: JSON.stringify({ action: "remove", item: { variantId } })
            });
          } catch (error) {
            console.error("Sync remove cart failed:", error);
          }
        }
      },

      updateQuantity: async (variantId, newQuantity, authenticated = false) => {
        const currentItems = get().items;
        const item = currentItems.find(i => i.variant.id === variantId);
        if (!item) return;

        if (newQuantity < 1) {
          await get().removeItem(variantId, authenticated);
          return;
        }

        const checkedQty = Math.min(newQuantity, typeof item.variant.stock === 'number' ? item.variant.stock : 99);
        
        set((state) => ({
          items: state.items.map((i) => {
            if (i.variant.id === variantId) {
              return { ...i, quantity: checkedQty };
            }
            return i;
          })
        }));

        if (authenticated) {
          try {
            await fetch("/api/user/cart", {
              method: "POST",
              body: JSON.stringify({ 
                action: "set", 
                item: { productId: item.product.id, variantId, quantity: checkedQty } 
              })
            });
          } catch (error) {
            console.error("Sync update qty failed:", error);
          }
        }
      },

      clearCart: async (authenticated = false) => {
        set({ items: [] });
        if (authenticated) {
          try {
            await fetch("/api/user/cart", { method: "POST", body: JSON.stringify({ action: "clear" }) });
          } catch (error) {
            console.error("Sync clear cart failed:", error);
          }
        }
      },

      getCartTotal: () => {
        return get().items.reduce((total, item) => {
          return total + (item.variant.price * item.quantity);
        }, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'niez-cart-storage',
      onRehydrateStorage: () => (state) => {
        if (state) state.refreshLocalPrices();
      }
    }
  )
);
