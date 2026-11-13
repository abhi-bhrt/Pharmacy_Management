// store/useAuthStore.ts
import { create } from "zustand";

export interface UserAddress {
  area?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mob_no: string;
  role?: string;
  status?: string;
  is_profile_complete?: boolean;
  address?: UserAddress;
}

interface AuthState {
  isAdmin: boolean;
  user: UserProfile | null;
  guestAddress: UserAddress | null;
  loading: boolean;
  setAuth: (user: UserProfile | null) => void;
  setGuestAddress: (address: UserAddress | null) => void;
  clearAuth: () => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAdmin: false,
  user: null,
  guestAddress: null,
  loading: true,
  setAuth: (user) => {
    if (user) {
      sessionStorage.setItem("auth_user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("auth_user");
    }
    set({
      user,
      isAdmin: user?.role === "ADMIN" || user?.role === "SUPERADMIN",
      loading: false,
    });
  },
  setGuestAddress: (address) => {
    if (address) {
      sessionStorage.setItem("guest_address", JSON.stringify(address));
    } else {
      sessionStorage.removeItem("guest_address");
    }
    set({ guestAddress: address });
  },
  clearAuth: () => {
    sessionStorage.removeItem("auth_user");
    set({ user: null, isAdmin: false, loading: false });
  },
  logout: () => {
    sessionStorage.removeItem("auth_user");
    set({ user: null, isAdmin: false, loading: false });
  },
  setLoading: (loading) => set({ loading }),
}));