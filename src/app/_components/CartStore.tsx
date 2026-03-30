"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from "react";

export interface CartDish {
  id: number;
  name: string;
  emoji: string;
  price: number;
  description: string;
}

interface CartState {
  items: CartDish[];
  isOpen: boolean;
}

type CartAction =
  | { type: "ADD"; dish: CartDish }
  | { type: "REMOVE"; index: number }
  | { type: "CLEAR" }
  | { type: "TOGGLE_OPEN" }
  | { type: "SET_OPEN"; open: boolean };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD":
      return { ...state, items: [...state.items, action.dish] };
    case "REMOVE":
      return {
        ...state,
        items: state.items.filter((_, i) => i !== action.index),
      };
    case "CLEAR":
      return { ...state, items: [] };
    case "TOGGLE_OPEN":
      return { ...state, isOpen: !state.isOpen };
    case "SET_OPEN":
      return { ...state, isOpen: action.open };
    default:
      return state;
  }
}

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
  });
  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function useCartTotal(items: CartDish[]) {
  return items.reduce((sum, d) => sum + d.price, 0);
}
