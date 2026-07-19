"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Logo from "@/components/Logo";
import AuthModal from "./AuthModal";
import LoyaltyBadge from "./LoyaltyBadge";
import { getUnreadCount, getNotifications } from "@/lib/notifications-engine";

export default function Navbar() {
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("experio-auth-token") : null;
    setSignedIn(!!token);
    getUnreadCount().then(setUnreadCount);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    const token = localStorage.getItem("experio-auth-token");
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch { /* still clear local state */ }
    localStorage.removeItem("experio-auth-token");
    localStorage.removeItem("experio-user-role");
    localStorage.removeItem("experio-signup-role");
    setSignedIn(false);
    setProfileOpen(false);
    window.location.reload();
  };

  // Hide Navbar on discover (has its own header) + partner pages
  if (pathname === "/discover" || pathname.startsWith("/partner")) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[999] bg-[#111827]/90 backdrop-blur-xl border-b border-white/[0.08] h-[64px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <Logo size="sm" />

          {/* Right: minimal actions */}
          <div className="flex items-center gap-2">
            {/* Notifications bell */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#FF0F73] text-[10px] font-bold text-white ring-2 ring-white px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  if (signedIn) {
                    setProfileOpen((prev) => !prev);
                  } else {
                    setAuthOpen(true);
                  }
                }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(255,15,115,0.25)] hover:shadow-[0_4px_12px_rgba(255,15,115,0.35)] transition-all hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {profileOpen && signedIn && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#111827] border border-white/[0.1] shadow-[0_4px_24px_rgba(0,0,0,0.4)] py-2 z-[1000]">
                  <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors">
                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Profile
                  </Link>
                  <Link href="/bookings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors">
                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    My Bookings
                  </Link>
                  <Link href="/saved" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors">
                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    Saved
                  </Link>
                  <div className="px-4 py-2">
                    <LoyaltyBadge minimal />
                  </div>
                  <hr className="my-2 border-white/[0.1]" />
                  <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#FF0F73] hover:bg-white/5 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
