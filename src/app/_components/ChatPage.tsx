"use client";

import { useState } from "react";
import { CartProvider } from "./CartStore";
import { Header } from "./Header";
import { MenuSidebar } from "./MenuSidebar";
import { ChatWindow } from "./ChatWindow";
import { CartPanel } from "./CartPanel";

export function ChatPage() {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  return (
    <CartProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-[var(--bg)]">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <MenuSidebar onSelectMessage={setSelectedMessageId} />
          <ChatWindow selectedMessageId={selectedMessageId} />
        </div>
        <CartPanel />
      </div>
    </CartProvider>
  );
}
