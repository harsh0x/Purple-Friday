"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  items: string[]; // product slugs
  isOpen: boolean;
  toggleWishlist: (slug: string) => void;
  isInWishlist: (slug: string) => boolean;
  clearWishlist: () => void;
  openWishlist: () => void;
  closeWishlist: () => void;
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: ["round-gloss-badge-58mm", "classic-crewneck-tshirt"],
      isOpen: false,

      toggleWishlist: (slug) => {
        set((state) => {
          const exists = state.items.includes(slug);
          if (exists) {
            return { items: state.items.filter((s) => s !== slug) };
          }
          return { items: [...state.items, slug] };
        });
      },

      isInWishlist: (slug) => {
        return get().items.includes(slug);
      },

      clearWishlist: () => set({ items: [] }),
      openWishlist: () => set({ isOpen: true }),
      closeWishlist: () => set({ isOpen: false }),
    }),
    {
      name: "purple-friday-wishlist",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

