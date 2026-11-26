// store/useAuthStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserProfileResponse, AddressInput } from "@/types";
import { apiFetch } from "@/lib/api/api";

interface AuthState {
  isAdmin: boolean;
  user: UserProfileResponse | null;
  guestAddress: AddressInput | null;
  loading: boolean;
  _hasHydrated: boolean;
  setAuth: (user: UserProfileResponse | null) => void;
  setGuestAddress: (address: AddressInput | null) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAdmin: false,
      user: null,
      guestAddress: null,
      loading: true,
      _hasHydrated: false,
      setAuth: (user) =>
        set({
          user,
          isAdmin: user?.role === "ADMIN" || user?.role === "SUPERADMIN",
          loading: false,
        }),
      setGuestAddress: (guestAddress) => set({ guestAddress }),
      clearAuth: () =>
        set({
          user: null,
          isAdmin: false,
          loading: false,
        }),
      logout: async () => {
        try {
          await apiFetch("/api/auth/signout", { method: "POST" });
        } finally {
          set({
            user: null,
            isAdmin: false,
            loading: false,
          });
        }
      },
      setLoading: (loading) => set({ loading }),
      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
    }),
    {
      name: "auth-session-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAdmin: state.isAdmin,
        guestAddress: state.guestAddress,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);