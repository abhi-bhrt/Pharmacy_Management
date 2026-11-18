// components/layout/Navbar.tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import NavbarView, { type NavLinkItem } from "./NavbarView";

const NAV_LINKS: NavLinkItem[] = [
  { name: "Medicines", href: "/medicines" },
  { name: "Stores", href: "/stores" },
  { name: "Prescription", href: "/prescription" },
];

const HIDDEN_ROUTE_PREFIXES = [
  "/dashboard",
  "/billing",
  "/inventory",
  "/invoices",
  "/settings",
];

function NavbarContainer() {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const logout = useAuthStore((state) => state.logout);

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDashboardRoute = HIDDEN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const INACTIVITY_DELAY = 3000;

    const resetInactivityTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

      if (userDropdownOpen || mobileMenuOpen) return;

      inactivityTimer.current = setTimeout(() => {
        if (window.scrollY > 80) {
          setIsVisible(false);
        }
      }, INACTIVITY_DELAY);
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 80) {
        setIsVisible(true);
        resetInactivityTimer();
        lastScrollY.current = currentScrollY;
        return;
      }

      if (userDropdownOpen || mobileMenuOpen) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
        resetInactivityTimer();
      } else if (currentScrollY > lastScrollY.current + 5) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    const handleUserActivity = () => {
      setIsVisible(true);
      resetInactivityTimer();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });

    resetInactivityTimer();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [userDropdownOpen, mobileMenuOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isDashboardRoute) {
    return null;
  }

  const handleSignOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push("/signin");
    router.refresh();
  };

  return (
    <NavbarView
      pathname={pathname}
      navLinks={NAV_LINKS}
      mounted={mounted}
      user={user}
      isAdmin={isAdmin}
      isVisible={isVisible}
      mobileMenuOpen={mobileMenuOpen}
      userDropdownOpen={userDropdownOpen}
      dropdownRef={dropdownRef}
      onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
      onCloseMobileMenu={() => setMobileMenuOpen(false)}
      onToggleUserDropdown={() => setUserDropdownOpen((prev) => !prev)}
      onCloseUserDropdown={() => setUserDropdownOpen(false)}
      onSignOut={handleSignOut}
    />
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContainer />
    </Suspense>
  );
}