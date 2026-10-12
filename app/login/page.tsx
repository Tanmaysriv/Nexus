"use client";

import { FormEvent, useState } from "react";
import {
  Loader2,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ?? "Unable to sign in."
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to NEXUS.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Developer Command Center
            </p>

            <h1 className="text-2xl font-semibold text-white">
              NEXUS
            </h1>
          </div>
        </div>

        <p className="mt-6 text-sm leading-6 text-white/50">
          Sign in to access your career intelligence,
          interview data, projects, and Copilot workspace.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          <label className="block">
            <span className="mb-2 block text-sm text-white/60">
              Email
            </span>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-primary"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-white/60">
              Password
            </span>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-primary"
                placeholder="Enter your password"
              />
            </div>
          </label>

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            className="text-primary hover:underline"
          >
            Create one
          </a>
        </p>
      </div>
    </main>
  );
}
