// components/providers/AuthProvider.tsx
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserProfileResponse } from "@/types";
import { apiFetch } from "@/lib/api/api";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (!useAuthStore.getState().user) {
        setLoading(true);
      }

      try {
        const res = await apiFetch("/api/protected/users/profile", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          if (isMounted) clearAuth();
          return;
        }

        const data = await res.json();

        if (isMounted) {
          if (data?.success && data?.data?.user) {
            setAuth(data.data.user as UserProfileResponse);
          } else {
            clearAuth();
          }
        }
      } catch (error) {
        console.error("Session verification failed:", error);
        if (isMounted) clearAuth();
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [setAuth, clearAuth, setLoading]);

  return <>{children}</>;
}