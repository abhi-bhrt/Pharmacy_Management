// components/layout/NavbarView.tsx
import type { RefObject } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Menu,
  X,
  FileText,
  LogOut,
  Store,
  Settings,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";
import type { UserProfileResponse } from "@/types";

export interface NavLinkItem {
  name: string;
  href: string;
}

interface NavbarViewProps {
  pathname: string;
  navLinks: NavLinkItem[];
  mounted: boolean;
  user: UserProfileResponse | null;
  isAdmin: boolean;
  isVisible: boolean;
  mobileMenuOpen: boolean;
  userDropdownOpen: boolean;
  dropdownRef: RefObject<HTMLDivElement | null>;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
  onToggleUserDropdown: () => void;
  onCloseUserDropdown: () => void;
  onSignOut: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function NavbarView({
  pathname,
  navLinks,
  mounted,
  user,
  isAdmin,
  isVisible,
  mobileMenuOpen,
  userDropdownOpen,
  dropdownRef,
  onToggleMobileMenu,
  onCloseMobileMenu,
  onToggleUserDropdown,
  onCloseUserDropdown,
  onSignOut,
}: NavbarViewProps) {
  const { name: brandName, LogoIcon } = BRAND_CONFIG;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-300 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 h-16 flex items-center justify-between gap-4 lg:gap-8">
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-9 h-9 rounded-sm bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 group-hover:bg-teal-700 group-hover:text-white group-hover:border-teal-700 transition-colors">
            <LogoIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 uppercase leading-none">
              {brandName}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
              Healthcare & POS
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "text-teal-800 bg-teal-50 border border-teal-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          {mounted && isAdmin && (
            <Link
              href="/dashboard"
              aria-label="Shop Dashboard"
              className="relative p-2 text-slate-700 hover:text-teal-700 rounded-sm border border-transparent hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Store className="w-4 h-4" />
            </Link>
          )}

          {mounted && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={onToggleUserDropdown}
                className="flex items-center gap-2 p-1 pr-2.5 rounded-sm border border-slate-300 hover:border-slate-400 transition-colors bg-slate-50 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-sm bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-xs uppercase">
                  {user.name ? user.name.charAt(0) : <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs font-semibold text-slate-800 max-w-[90px] truncate hidden sm:inline">
                  {user.name?.split(" ")[0] || "Account"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-sm shadow-md border border-slate-300 py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/60">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user.name || "Customer"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                    {user.role && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-sm text-[9px] font-bold tracking-wider uppercase bg-slate-900 text-teal-400">
                        {user.role}
                      </span>
                    )}
                  </div>

                  <div className="py-1 text-xs text-slate-700">
                    <Link
                      href="/profile"
                      onClick={onCloseUserDropdown}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-100 font-medium transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Profile Settings</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/dashboard"
                        onClick={onCloseUserDropdown}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-100 font-medium transition-colors"
                      >
                        <Store className="w-3.5 h-3.5 text-teal-700" />
                        <span>Shop Dashboard</span>
                      </Link>
                    )}

                    <Link
                      href="/subscriptions"
                      onClick={onCloseUserDropdown}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-100 font-medium transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                      <span>Subscriptions</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-200 pt-1">
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-700 hover:bg-red-50 font-semibold text-left transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-sm transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-white" />
              <span>Sign In</span>
            </Link>
          )}

          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-sm border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-300 bg-white px-4 sm:px-6 py-4 space-y-3 shadow-md">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={onCloseMobileMenu}
                  className={`block py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-800 border-l-2 border-teal-700"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <Link
              href="/prescription"
              onClick={onCloseMobileMenu}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wider border border-slate-300 transition-colors"
            >
              <FileText className="w-4 h-4 text-teal-700" />
              <span>Upload Prescription</span>
            </Link>

            {mounted && user ? (
              <>
                <Link
                  href="/profile"
                  onClick={onCloseMobileMenu}
                  className="flex items-center px-3 py-2 text-xs font-medium text-slate-700 rounded-sm hover:bg-slate-100"
                >
                  <UserIcon className="w-4 h-4 mr-2.5 text-slate-500" />
                  <span>Profile Settings</span>
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={onCloseMobileMenu}
                      className="flex items-center px-3 py-2 text-xs font-medium text-slate-700 rounded-sm hover:bg-slate-100"
                    >
                      <Store className="w-4 h-4 mr-2.5 text-teal-700" />
                      <span>Shop Dashboard</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={onCloseMobileMenu}
                      className="flex items-center px-3 py-2 text-xs font-medium text-slate-700 rounded-sm hover:bg-slate-100"
                    >
                      <Settings className="w-4 h-4 mr-2.5 text-slate-500" />
                      <span>Settings</span>
                    </Link>
                  </>
                )}

                <Link
                  href="/subscriptions"
                  onClick={onCloseMobileMenu}
                  className="flex items-center px-3 py-2 text-xs font-medium text-slate-700 rounded-sm hover:bg-slate-100"
                >
                  <CreditCard className="w-4 h-4 mr-2.5 text-slate-500" />
                  <span>Subscriptions</span>
                </Link>

                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex items-center justify-center gap-2 w-full py-2 mt-1 rounded-sm bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold uppercase tracking-wider border border-red-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                onClick={onCloseMobileMenu}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-sm bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}