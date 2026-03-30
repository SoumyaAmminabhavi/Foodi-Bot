"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatPage } from "~/app/_components/ChatPage";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/sign-in");
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <p className="text-[var(--muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <ChatPage /> : null;
}

