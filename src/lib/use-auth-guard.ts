"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type GuardRole = "admin" | "partner" | "authenticated";

interface UseAuthGuardOptions {
  requiredRole: GuardRole;
  redirectTo?: string;
}

interface AuthGuardState {
  allowed: boolean;
  loading: boolean;
  user: { id: string; email: string; role: string } | null;
}

/**
 * Server-verified auth guard hook.
 * Calls /api/auth/me to validate the session and check role.
 * While loading, returns a loading state so the page can show a spinner/skeleton.
 * If unauthorized, redirects to the specified path (or "/" by default).
 */
export function useAuthGuard({
  requiredRole,
  redirectTo = "/",
}: UseAuthGuardOptions): AuthGuardState {
  const router = useRouter();
  const [state, setState] = useState<AuthGuardState>({
    allowed: false,
    loading: true,
    user: null,
  });

  const verify = useCallback(async () => {
    const token = localStorage.getItem("experio-auth-token");
    if (!token) {
      setState({ allowed: false, loading: false, user: null });
      router.replace(redirectTo);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setState({ allowed: false, loading: false, user: null });
        router.replace(redirectTo);
        return;
      }

      const data = await res.json();
      const user = {
        id: String(data.id ?? ""),
        email: String(data.email ?? ""),
        role: String(data.role ?? data.profile?.role ?? "user"),
      };

      // Check role requirement
      if (requiredRole === "admin" && user.role !== "admin") {
        setState({ allowed: false, loading: false, user });
        router.replace(redirectTo);
        return;
      }

      if (requiredRole === "partner" && user.role !== "partner") {
        setState({ allowed: false, loading: false, user });
        router.replace(redirectTo);
        return;
      }

      if (requiredRole === "authenticated" && !user.id) {
        setState({ allowed: false, loading: false, user: null });
        router.replace(redirectTo);
        return;
      }

      setState({ allowed: true, loading: false, user });
    } catch {
      // Network error — don't redirect, let the UI handle it
      setState({ allowed: false, loading: false, user: null });
    }
  }, [requiredRole, redirectTo, router]);

  useEffect(() => {
    verify();
  }, [verify]);

  return state;
}
