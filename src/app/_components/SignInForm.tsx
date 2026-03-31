"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Sign in failed");
        setLoading(false);
        return;
      }

      // Store token in localStorage
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userName", data.name);

      // Redirect to home
      router.push("/");
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
      <div className="mb-8 text-center">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
          BiteBot 🍽️
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sign in to order your food
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text)]">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text)]">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--muted)]">
          Don't have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-[var(--accent)] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center text-xs text-[var(--muted)]">
        <p>Demo: use email <code>test@example.com</code></p>
        <p>password: <code>password123</code></p>
      </div> */}
    </div>
  );
}
