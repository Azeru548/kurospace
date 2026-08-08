"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CatalogItem } from "@/types";

export interface CartLine {
  item: CatalogItem;
  quantity: number;
}

interface CartState {
  vendorId: string;
  vendorSlug: string;
  lines: CartLine[];
}

interface CartContextValue extends CartState {
  addItem: (item: CatalogItem, vendorId: string, vendorSlug: string, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const STORAGE_KEY = "kurospace_cart_v1";

function loadState(): CartState {
  if (typeof window === "undefined") {
    return { vendorId: "", vendorSlug: "", lines: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartState;
      if (parsed && Array.isArray(parsed.lines) && parsed.vendorId) {
        return parsed;
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { vendorId: "", vendorSlug: "", lines: [] };
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(loadState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state]);

  const addItem = useCallback(
    (item: CatalogItem, vendorId: string, vendorSlug: string, quantity = 1) => {
      setState((prev) => {
        // Cart is single-vendor (one order = one store). Switching stores resets the cart.
        if (prev.vendorId && prev.vendorId !== vendorId) {
          return { vendorId, vendorSlug, lines: [{ item, quantity }] };
        }
        const existing = prev.lines.find((l) => l.item.id === item.id);
        const lines = existing
          ? prev.lines.map((l) =>
              l.item.id === item.id
                ? { ...l, quantity: Math.min(99, l.quantity + quantity) }
                : l
            )
          : [...prev.lines, { item, quantity }];
        return { vendorId, vendorSlug, lines };
      });
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      lines: prev.lines.filter((l) => l.item.id !== itemId),
    }));
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    setState((prev) => ({
      ...prev,
      lines: prev.lines
        .map((l) => (l.item.id === itemId ? { ...l, quantity: Math.min(99, Math.max(1, quantity)) } : l))
        .filter((l) => l.quantity > 0),
    }));
  }, []);

  const clear = useCallback(() => {
    setState({ vendorId: "", vendorSlug: "", lines: [] });
  }, []);

  const { total, count } = useMemo(() => {
    return {
      total: state.lines.reduce((s, l) => s + l.item.price * l.quantity, 0),
      count: state.lines.reduce((s, l) => s + l.quantity, 0),
    };
  }, [state.lines]);

  const value = useMemo(
    () => ({
      ...state,
      addItem,
      removeItem,
      setQuantity,
      clear,
      total,
      count,
    }),
    [state, addItem, removeItem, setQuantity, clear, total, count]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
