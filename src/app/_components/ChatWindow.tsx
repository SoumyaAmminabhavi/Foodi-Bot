"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { useCart, type CartDish } from "./CartStore";

interface Dish {
  id: number;
  name: string;
  emoji: string;
  price: number;
  description: string;
}

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  dishes?: Dish[];
  isTyping?: boolean;
}

const QUICK_REPLIES = [
  "Today's specials 🔥",
  "I want something spicy",
  "What's vegetarian?",
  "Track my order",
  "Surprise me!",
  "Show bestsellers",
];

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-2 w-2 rounded-full bg-[var(--muted)]"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function DishChips({
  dishes,
  onAdd,
}: {
  dishes: Dish[];
  onAdd: (d: Dish) => void;
}) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {dishes.map((d) => (
        <button
          key={d.id}
          onClick={() => onAdd(d)}
          className="rounded-full border border-[var(--accent)] bg-[var(--card)] px-3 py-1 font-[family-name:var(--font-syne)] text-[0.78rem] font-bold text-[var(--accent)] transition-all hover:bg-[var(--accent)] hover:text-black"
        >
          {d.emoji} {d.name} ₹{d.price / 100}
        </button>
      ))}
    </div>
  );
}

interface ChatWindowProps {
  selectedMessageId: string | null;
}

export function ChatWindow({ selectedMessageId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { dispatch } = useCart();

  const sendChat = api.chat.send.useMutation({
    onSuccess: (data, variables) => {
      // Remove typing indicator, add bot reply
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => !m.isTyping);
        return [
          ...withoutTyping,
          {
            id: crypto.randomUUID(),
            role: "bot",
            content: data.replyText,
            dishes: data.dishes as Dish[],
          },
        ];
      });
    },
  });

  // Initial greeting
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(Number(storedUserId));
    }
  }, []);

  const historyQuery = api.chat.getHistory.useQuery(
    { userId: userId ?? undefined },
    { enabled: userId !== null }
  );

  useEffect(() => {
    if (historyQuery.data && historyQuery.data.length > 0) {
      setMessages(
        historyQuery.data.map((item) => ({
          id: String(item.id),
          role: item.role as "user" | "bot",
          content: item.content,
        }))
      );
    } else {
      setMessages([
        {
          id: "welcome",
          role: "bot",
          content:
            "Welcome to BiteBot 🍽️ — your AI-powered food companion!\n\nI can recommend dishes based on your mood, help you browse the menu, and track your order in real time.\n\nWhat are you craving today?",
        },
      ]);
    }
  }, [historyQuery.data]);

  // Handle selected message scroll
  useEffect(() => {
    if (selectedMessageId) {
      const el = document.getElementById(`msg-${selectedMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-[var(--accent)]", "ring-offset-2", "ring-offset-[var(--bg)]", "transition-all");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-[var(--accent)]", "ring-offset-2", "ring-offset-[var(--bg)]");
        }, 2000);
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedMessageId, messages]);

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sendChat.isPending) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: msg },
    ]);

    // Show typing indicator
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: "typing", role: "bot", content: "", isTyping: true },
      ]);
    }, 100);

    sendChat.mutate({ message: msg, userId: userId ?? undefined });
  };

  const handleAddDish = (dish: CartDish) => {
    dispatch({ type: "ADD", dish });
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "bot",
        content: `Added ${dish.emoji} **${dish.name}** to your cart! Want anything else?`,
      },
    ]);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 py-6">
        {messages.map((msg) => (
          <div
            id={`msg-${msg.id}`}
            key={msg.id}
            className={`animate-fadeUp flex gap-2.5 rounded-2xl p-1 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] text-base ${
                msg.role === "bot"
                  ? "bg-[var(--accent2)]"
                  : "bg-[var(--accent)]"
              }`}
            >
              {msg.role === "bot" ? "🤖" : "👤"}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[0.88rem] leading-relaxed ${
                msg.role === "bot"
                  ? "rounded-tl-[4px] border border-[var(--border)] bg-[var(--card)]"
                  : "rounded-tr-[4px] bg-[var(--accent)] text-black"
              }`}
            >
              {msg.isTyping ? (
                <TypingIndicator />
              ) : (
                <>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\n/g, "<br/>")
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  />
                  {msg.dishes && msg.dishes.length > 0 && (
                    <DishChips dishes={msg.dishes} onAdd={handleAddDish} />
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      <div className="flex flex-shrink-0 flex-wrap gap-2 border-t border-[var(--border)] bg-[var(--surface)] px-5 py-2.5">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-[0.76rem] text-[var(--muted)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="flex flex-shrink-0 items-end gap-2.5 border-t border-[var(--border)] bg-[var(--surface)] px-5 py-3.5">
          <div className="flex flex-1 items-center rounded-[14px] border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 focus-within:border-[var(--accent)] transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything — order, recommend, track…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-[0.9rem] text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
              style={{ maxHeight: 120 }}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || sendChat.isPending}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px] bg-[var(--accent)] text-lg text-black transition-all hover:bg-[#e09510] hover:scale-105 active:scale-95 disabled:opacity-40"
          >
            ➤
          </button>
        </div>
    </div>
  );
}
