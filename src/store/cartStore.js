"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

let cartRefreshSeq = 0;

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // Array of { product, variant, quantity }
      ownerUserId: null,

      resetLocalSession: () => {
        cartRefreshSeq += 1;
        set({ items: [], ownerUserId: null });
      },

      // Sync from DB to local store
      pullFromDB: async () => {
        cartRefreshSeq += 1;
        try {
          const res = await fetch("/api/user/cart", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            set({ items: data.cart || [] });
          }
        } catch (error) {
          console.error("Failed to pull cart:", error);
        }
      },

      // Merge local with DB after login (strictly isolated per userId)
      syncForUser: async (userId) => {
        cartRefreshSeq += 1;
        if (!userId) {
          if (get().ownerUserId !== null) {
            set({ items: [], ownerUserId: null });
          }
          return;
        }

        const currentOwner = get().ownerUserId;
        if (currentOwner && currentOwner !== userId) {
          // Different user previously used this browser storage — never merge their data
          set({ items: [], ownerUserId: userId });
          await get().pullFromDB();
          return;
        }

        const localItems = get().items;
        try {
          if (currentOwner === null && localItems.length > 0) {
            await fetch("/api/user/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "merge",
                items: localItems,
              }),
            });
          }
          set({ ownerUserId: userId });
          await get().pullFromDB();
        } catch (error) {
          console.error("Failed to sync cart:", error);
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

      // Background Sync to update stale prices/stock without requiring login
      refreshLocalPrices: async () => {
        const snapshotItems = get().items;
        if (snapshotItems.length === 0) return;

        const reqSeq = ++cartRefreshSeq;
        const startOwnerId = get().ownerUserId;
        const variantIds = Array.from(
          new Set(snapshotItems.map((i) => i?.variant?.id).filter(Boolean))
        ).slice(0, 100);
        if (variantIds.length === 0) return;

        try {
          const res = await fetch("/api/products/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantIds }),
          });
          if (!res.ok) return;

          const { variants } = await res.json();
          if (!variants) return;

          // Abort if a newer pull/sync/logout happened while the request was in flight
          if (reqSeq !== cartRefreshSeq || get().ownerUserId !== startOwnerId) {
            return;
          }

          const variantMap = new Map(variants.map((v) => [v.id, v]));
          const latestItems = get().items;
          const updatedItems = latestItems
            .map((item) => {
              const fresh = variantMap.get(item.variant.id);
              // Skip if this item wasn't part of the batch query (added during flight)
              if (!fresh) {
                return variantIds.includes(item.variant.id) ? null : item;
              }
              if (!fresh.isActive || !fresh.product?.isActive || fresh.stock <= 0) {
                return null;
              }
              const safeQuantity = Math.max(1, Math.min(item.quantity, fresh.stock));
              const fallbackImage =
                fresh.imageUrl ||
                fresh.product?.images?.[0]?.url ||
                item.variant.imageUrl ||
                "";

              return {
                ...item,
                quantity: safeQuantity,
                variant: {
                  ...item.variant,
                  price: Number(fresh.price),
                  compareAtPrice:
                    fresh.compareAtPrice != null
                      ? Number(fresh.compareAtPrice)
                      : null,
                  stock: fresh.stock,
                  imageUrl: fallbackImage,
                },
              };
            })
            .filter(Boolean);

          set({ items: updatedItems });
        } catch (error) {
          console.error("Failed to refresh local prices:", error);
        }
      },

      addItem: async (product, variant, quantity = 1, authenticated = false) => {
        const stockCap = typeof variant.stock === "number" ? variant.stock : 99;
        if (stockCap <= 0) return;

        const requestedQty = Math.max(1, Number.parseInt(String(quantity), 10) || 1);
        let updatedItems = [...get().items];
        const existingItemIndex = updatedItems.findIndex(
          (item) => item.variant.id === variant.id
        );

        let finalQuantity = Math.min(requestedQty, stockCap);

        if (existingItemIndex >= 0) {
          const newQty = Math.min(
            updatedItems[existingItemIndex].quantity + requestedQty,
            stockCap
          );
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: newQty,
          };
          finalQuantity = newQty;
          set({ items: updatedItems });
        } else {
          updatedItems = [...updatedItems, { product, variant, quantity: finalQuantity }];
          set({ items: updatedItems });
        }

        if (authenticated) {
          try {
            await fetch("/api/user/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "set",
                item: {
                  productId: product.id,
                  variantId: variant.id,
                  quantity: finalQuantity,
                },
              }),
            });
          } catch (error) {
            console.error("Sync add cart failed:", error);
          }
        }
      },

      removeItem: async (variantId, authenticated = false) => {
        set((state) => ({
          items: state.items.filter((item) => item.variant.id !== variantId),
        }));

        if (authenticated) {
          try {
            await fetch("/api/user/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "remove", item: { variantId } }),
            });
          } catch (error) {
            console.error("Sync remove cart failed:", error);
          }
        }
      },

      updateQuantity: async (variantId, newQuantity, authenticated = false) => {
        const currentItems = get().items;
        const item = currentItems.find((i) => i.variant.id === variantId);
        if (!item) return;

        if (newQuantity < 1) {
          await get().removeItem(variantId, authenticated);
          return;
        }

        const checkedQty = Math.min(
          newQuantity,
          typeof item.variant.stock === "number" ? item.variant.stock : 99
        );

        if (checkedQty < 1) {
          await get().removeItem(variantId, authenticated);
          return;
        }

        set((state) => ({
          items: state.items.map((i) => {
            if (i.variant.id === variantId) {
              return { ...i, quantity: checkedQty };
            }
            return i;
          }),
        }));

        if (authenticated) {
          try {
            await fetch("/api/user/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "set",
                item: {
                  productId: item.product.id,
                  variantId,
                  quantity: checkedQty,
                },
              }),
            });
          } catch (error) {
            console.error("Sync update qty failed:", error);
          }
        }
      },

      clearCart: async (authenticated = false) => {
        cartRefreshSeq += 1;
        set({ items: [] });
        if (authenticated) {
          try {
            await fetch("/api/user/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "clear" }),
            });
          } catch (error) {
            console.error("Sync clear cart failed:", error);
          }
        }
      },

      getCartTotal: () => {
        return get().items.reduce((total, item) => {
          return total + item.variant.price * item.quantity;
        }, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "niez-cart-storage",
      onRehydrateStorage: () => (state) => {
        if (state) state.refreshLocalPrices();
      },
    }
  )
);
