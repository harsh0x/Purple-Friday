"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItemInput } from "@/lib/pricing";

export interface CartItem extends CartItemInput {
  name?: string;
  slug?: string;
  unitPrice?: number;
  template?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string;
  addItem: (item: CartItem) => void;
  removeItem: (optionKey: string) => void;
  updateQty: (optionKey: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setCouponCode: (code: string) => void;
  totalItemCount: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [
        // Seed initial sample cart item for immediate interactivity
        {
          productId: "structured-cotton-twill-cap",
          optionKey: "cap-matte-black",
          qty: 15,
          name: "Structured 6-Panel Cotton Twill Cap",
          slug: "structured-cotton-twill-cap",
          unitPrice: 225,
          template: "cap",
          options: { Colour: "Matte Black" },
        },
      ],
      isOpen: false,
      couponCode: "FIRSTORDER",

      addItem: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.optionKey === newItem.optionKey
          );

          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex].qty += newItem.qty;
            return { items: updated, isOpen: true };
          }

          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      removeItem: (optionKey) => {
        set((state) => ({
          items: state.items.filter((item) => item.optionKey !== optionKey),
        }));
      },

      updateQty: (optionKey, qty) => {
        if (qty <= 0) {
          get().removeItem(optionKey);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.optionKey === optionKey ? { ...item, qty } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setCouponCode: (couponCode) => set({ couponCode }),

      totalItemCount: () => {
        return get().items.reduce((acc, curr) => acc + curr.qty, 0);
      },
    }),
    {
      name: "purple-friday-cart",
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
      }),
    }
  )
);

