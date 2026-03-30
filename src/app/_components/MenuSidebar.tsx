"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { useCart } from "./CartStore";

export interface MenuSidebarProps {
  onSelectMessage: (id: string | null) => void;
}

export function MenuSidebar({ onSelectMessage }: MenuSidebarProps) {
  const [userId, setUserId] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(Number(stored));
  }, []);

  const { data: history } = api.chat.getHistory.useQuery(
    { userId: userId ?? undefined },
    { enabled: userId !== null }
  );
  
  const userSearches = history?.filter((m) => m.role === "user").reverse().slice(0, 5) || [];
  
  const { data: categories, isLoading } = api.menu.getAll.useQuery();
  const { dispatch } = useCart();

  const handleAdd = (dish: {
    id: number;
    name: string;
    emoji: string;
    price: number;
    description: string;
  }) => {
    dispatch({ type: "ADD", dish });
  };

  return (
    <aside className="hidden md:flex w-[290px] flex-shrink-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--surface)]">
      <button
        onClick={() => setIsHistoryOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between flex-shrink-0 border-b border-[var(--border)] px-5 py-4 font-[family-name:var(--font-syne)] text-[0.68rem] uppercase tracking-[2px] text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]"
      >
        <span>Your Search History</span>
        <span className="text-[0.6rem]">{isHistoryOpen ? "▼" : "▶"}</span>
      </button>
      {isHistoryOpen && (
        <div className="flex-shrink-0 max-h-[160px] overflow-y-auto border-b border-[var(--border)] p-3 flex flex-col gap-1">
          {userSearches.length === 0 && (
            <div className="text-[0.7rem] text-[var(--muted)] px-3 py-2">No history yet</div>
          )}
          {userSearches.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMessage(String(m.id))}
              className="group flex w-full cursor-pointer items-center gap-2 rounded-[14px] px-3 py-2 text-left transition-all hover:bg-[var(--card)]"
            >
              <span className="flex-shrink-0 text-[1.1rem]">🔍</span>
              <span className="truncate font-[family-name:var(--font-syne)] text-[0.8rem] text-[var(--text)]">{m.content}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-shrink-0 border-b border-[var(--border)] px-5 py-4 font-[family-name:var(--font-syne)] text-[0.68rem] uppercase tracking-[2px] text-[var(--muted)]">
        Full Menu
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {isLoading && (
          <div className="mt-8 text-center text-sm text-[var(--muted)]">
            Loading menu…
          </div>
        )}

        {categories?.map((cat) => (
          <div key={cat.id}>
            <div className="px-2 pb-1 pt-3 font-[family-name:var(--font-syne)] text-[0.62rem] uppercase tracking-[2px] text-[var(--accent)]">
              {cat.emoji} {cat.name}
            </div>

            {cat.dishes.map((dish) => (
              <button
                key={dish.id}
                onClick={() => handleAdd(dish)}
                className="group flex w-full cursor-pointer items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-left transition-all hover:translate-x-0.5 hover:border-[var(--accent)] mb-1.5"
              >
                <span className="flex-shrink-0 text-[1.7rem]">
                  {dish.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-[family-name:var(--font-syne)] text-[0.85rem] font-bold">
                    {dish.name}
                  </div>
                  <div className="truncate text-[0.7rem] text-[var(--muted)]">
                    {dish.description}
                  </div>
                </div>
                <div className="flex-shrink-0 font-[family-name:var(--font-syne)] text-[0.82rem] font-bold text-[var(--accent)]">
                  ₹{dish.price / 100}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
