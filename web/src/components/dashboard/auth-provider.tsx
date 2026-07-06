"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type DashboardAuthContextValue = {
  supabase: SupabaseClient;
  session: Session;
  user: User;
};

const DashboardAuthContext = createContext<DashboardAuthContextValue | null>(null);

type AuthPhase = "loading" | "signed_out" | "signed_in" | "env_missing";

export function DashboardAuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [phase, setPhase] = useState<AuthPhase>(supabase ? "loading" : "env_missing");
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingAuthAction, setPendingAuthAction] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isActive = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isActive) {
          return;
        }

        if (error) {
          setPhase("signed_out");
          setAuthError(error.message);
          return;
        }

        const nextSession = data.session;
        if (nextSession?.user) {
          setSession(nextSession);
          setUser(nextSession.user);
          setPhase("signed_in");
          return;
        }

        setPhase("signed_out");
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setPhase("signed_out");
        setAuthError(error instanceof Error ? error.message : "Failed to load auth session");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession?.user) {
        setSession(nextSession);
        setUser(nextSession.user);
        setPhase("signed_in");
        setAuthError(null);
        return;
      }

      setSession(null);
      setUser(null);
      setPhase("signed_out");
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      return;
    }

    setPendingAuthAction(true);
    setAuthError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setPassword("");
    }

    setPendingAuthAction(false);
  };

  const signOut = async () => {
    if (!supabase) {
      return;
    }

    setSignOutPending(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
    }
    setSignOutPending(false);
  };

  if (phase === "env_missing") {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-700">
        Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
        <code className="mx-1 rounded bg-red-100 px-1 py-0.5">.env.local</code>
        to enable auth and live dashboard data.
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="rounded-2xl border border-[#e8c468]/40 bg-white p-5 text-sm text-zinc-600">
        Checking your session…
      </div>
    );
  }

  if (phase === "signed_out" || !session || !user || !supabase) {
    return (
      <div className="rounded-2xl border border-[#e8c468]/40 bg-white p-6">
        <h1 className="text-xl font-bold text-[#163a28]">Sign in to Lunchmate Admin</h1>
        <p className="mt-2 text-sm text-zinc-600">Use your Supabase auth account to access live dashboard data.</p>
        <form onSubmit={signIn} className="mt-5 space-y-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#2f6b4f]/30 focus:ring-2"
            required
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#2f6b4f]/30 focus:ring-2"
            required
          />
          {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
          <button
            type="submit"
            disabled={pendingAuthAction}
            className="rounded-full bg-[#2f6b4f] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pendingAuthAction ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-[#2f6b4f] underline-offset-2 hover:underline">
          Back to landing page
        </Link>
      </div>
    );
  }

  return (
    <DashboardAuthContext.Provider value={{ supabase, session, user }}>
      <div className="rounded-2xl border border-[#e8c468]/40 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-zinc-600">
            Signed in as <span className="font-semibold text-zinc-800">{user.email ?? "User"}</span>
          </p>
          <button
            type="button"
            onClick={signOut}
            disabled={signOutPending}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {signOutPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
      {children}
    </DashboardAuthContext.Provider>
  );
}

export function useDashboardAuth() {
  const context = useContext(DashboardAuthContext);
  if (!context) {
    throw new Error("useDashboardAuth must be used inside DashboardAuthProvider");
  }

  return context;
}

