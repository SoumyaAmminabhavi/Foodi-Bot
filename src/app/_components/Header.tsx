"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, useCartTotal } from "./CartStore";

export function Header() {
  const router = useRouter();
  const { state, dispatch } = useCart();
  const total = useCartTotal(state.items);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setUserName(name);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    router.push("/sign-in");
  };

  return (
    <header className="flex flex-shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3.5">
      {/* Logo */}
      <div className="font-[family-name:var(--font-syne)] text-[1.35rem] font-extrabold tracking-tight">
        BITE<span className="text-[var(--accent)]">BOT</span>
      </div>

      {/* Status & User */}
      <div className="flex items-center gap-4 text-[0.76rem] text-[var(--muted)]">
        <div className="flex items-center gap-2">
          <span className="pulse-dot h-2 w-2 rounded-full bg-green-500" />
          AI Chef Online
        </div>
        {userName && (
          <span className="text-xs text-[var(--text)]">Hi, {userName}</span>
        )}
      </div>

      {/* Cart & Logout */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch({ type: "TOGGLE_OPEN" })}
          className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 font-[family-name:var(--font-syne)] text-[0.8rem] transition-colors hover:bg-[var(--border)]"
        >
          🛒 Cart
          {state.items.length > 0 && (
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--accent)] text-[0.68rem] font-bold text-black">
              {state.items.length}
            </span>
          )}
          {total > 0 && (
            <span className="text-[var(--accent)] text-[0.78rem] font-bold">
              ₹{total / 100}
            </span>
          )}
        </button>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-red-500 px-3 py-2 text-[0.8rem] font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
