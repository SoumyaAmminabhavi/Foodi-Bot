"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { useCart, useCartTotal } from "./CartStore";

interface TrackingProps {
  orderId: number;
  onClose: () => void;
}

function OrderTracking({ orderId, onClose }: TrackingProps) {
  const { data: order } = api.order.getStatus.useQuery(
    { orderId },
    { refetchInterval: 5000 }
  );

  const advanceOrder = api.order.advance.useMutation();

  const steps = ["CONFIRMED", "PREPARING", "READY", "ON_WAY", "DELIVERED"];
  const stepLabels = ["Confirmed", "Preparing", "Ready", "On Way", "Delivered"];
  const stepIcons = ["✓", "🔥", "📦", "🛵", "✓"];

  useEffect(() => {
    if (!order || order.status === "DELIVERED" || advanceOrder.isPending) return;

    const timerId = window.setTimeout(() => {
      advanceOrder.mutate({ orderId });
    }, 4500);

    return () => window.clearTimeout(timerId);
  }, [order?.status, orderId, advanceOrder]);

  const currentIdx = steps.indexOf(order?.status ?? "CONFIRMED");

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-syne)] font-bold text-[var(--accent)]">
          Order #{orderId} — Live Tracking
        </h3>
        <button onClick={onClose} className="text-[var(--muted)] text-sm hover:text-[var(--text)]">
          ✕
        </button>
      </div>

      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step} className="relative flex flex-1 flex-col items-center">
            {i < steps.length - 1 && (
              <div
                className={`absolute top-3 left-1/2 h-[2px] w-full transition-colors ${
                  i < currentIdx ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                }`}
              />
            )}
            <div
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[0.6rem] transition-all ${
                i < currentIdx
                  ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                  : i === currentIdx
                  ? "border-[var(--accent2)] bg-[var(--bg)] animate-pulse"
                  : "border-[var(--border)] bg-[var(--bg)]"
              }`}
            >
              {stepIcons[i]}
            </div>
            <div
              className={`mt-1 text-center text-[0.58rem] ${
                i <= currentIdx ? "text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
            >
              {stepLabels[i]}
            </div>
          </div>
        ))}
      </div>

      {order?.status === "DELIVERED" && (
        <p className="text-center text-sm text-[var(--muted)]">
          🎉 Delivered! Enjoy your meal.
        </p>
      )}
    </div>
  );
}

export function CartPanel() {
  const { state, dispatch } = useCart();
  const total = useCartTotal(state.items);
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);

  const placeOrder = api.order.place.useMutation({
    onSuccess: (order) => {
      setPlacedOrderId(order.id);
      dispatch({ type: "CLEAR" });
    },
  });

  const handleCheckout = () => {
    if (state.items.length === 0) return;

    // Group items by dishId
    const grouped = state.items.reduce(
      (acc, item) => {
        acc[item.id] = (acc[item.id] ?? 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    placeOrder.mutate({
      items: Object.entries(grouped).map(([dishId, quantity]) => ({
        dishId: Number(dishId),
        quantity,
      })),
    });
  };

  return (
    <>
      {/* Backdrop */}
      {state.isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => dispatch({ type: "SET_OPEN", open: false })}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-dvh w-[330px] flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl transition-transform duration-300 ease-in-out ${
          state.isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-extrabold">
            Your Order
          </h2>
          <button
            onClick={() => dispatch({ type: "SET_OPEN", open: false })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm hover:bg-[var(--border)]"
          >
            ✕
          </button>
        </div>

        {/* Order tracking if order placed */}
        {placedOrderId && (
          <div className="border-b border-[var(--border)] bg-[var(--card)]">
            <OrderTracking
              orderId={placedOrderId}
              onClose={() => setPlacedOrderId(null)}
            />
          </div>
        )}

        {/* Items */}
        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3.5">
          {state.items.length === 0 && !placedOrderId && (
            <p className="mt-8 text-center text-sm text-[var(--muted)]">
              No items yet.
              <br />
              Ask BiteBot for a recommendation!
            </p>
          )}

          {state.items.map((dish, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5"
            >
              <span className="text-[1.4rem]">{dish.emoji}</span>
              <span className="flex-1 font-[family-name:var(--font-syne)] text-[0.84rem] font-bold">
                {dish.name}
              </span>
              <span className="font-[family-name:var(--font-syne)] text-[0.84rem] font-bold text-[var(--accent)]">
                ₹{dish.price / 100}
              </span>
              <button
                onClick={() => dispatch({ type: "REMOVE", index: i })}
                className="text-[var(--muted)] hover:text-[var(--text)]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-[var(--border)] p-5">
          <div className="mb-3.5 flex items-center justify-between font-[family-name:var(--font-syne)] text-base font-extrabold">
            <span>Total</span>
            <span className="text-[var(--accent)]">₹{total / 100}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={state.items.length === 0 || placeOrder.isPending}
            className="w-full rounded-[12px] bg-[var(--accent)] py-3.5 font-[family-name:var(--font-syne)] text-[0.88rem] font-extrabold tracking-wider text-black transition-all hover:bg-[#e09510] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {placeOrder.isPending ? "Placing…" : "PLACE ORDER →"}
          </button>
        </div>
      </div>
    </>
  );
}
