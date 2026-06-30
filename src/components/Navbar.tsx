"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Logo from "@/components/Logo";
import AuthModal from "./AuthModal";
import LoyaltyBadge from "./LoyaltyBadge";
import { getUnreadCount, getNotifications, markAsRead } from "@/lib/notifications-engine";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [signedIn, setSignedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifList, setNotifList] = useState<ReturnType<typeof getNotifications>>([]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("experio-auth-token") : null;
    const role = typeof window !== "undefined" ? localStorage.getItem("experio-user-role") : null;
    setSignedIn(!!token);
    setUserRole(role);
    setUnreadCount(getUnreadCount());
  }, []);

  useEffect(() => {
    if (notifOpen) {
      setNotifList(getNotifications().slice(0, 5));
    }
  }, [notifOpen]);

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

  const navItems = [
    { label: "Discover", href: "/discover" },
    { label: "Experiences", href: "/experiences" },
    { label: "ASK AI", href: "/ask-ai" },
    { label: "Gift", href: "/gift" },
    { label: "Saved", href: "/saved" },
    { label: "Memories", href: "/bookings" },
  ];

  const handleSignOut = () => {
    localStorage.removeItem("experio-auth-token");
    setSignedIn(false);
    setProfileOpen(false);
    window.location.reload();
  };

  // Hide Navbar on the discover feed page (it has its own header)
  if (pathname === "/discover") return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[999] bg-[#111827]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-8">
              <Logo size="lg" />

              <nav className="hidden md:flex items-center gap-0.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/discover" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative px-3.5 py-2 rounded-xl text-body-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "text-white after:absolute after:bottom-0 after:left-1/4 after:w-1/2 after:h-0.5 after:bg-[#FF2D7A] after:rounded-full"
                          : "text-[#94A3B8] hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/ask-ai"
                className="px-4 py-2 rounded-xl text-body-sm font-semibold transition-all duration-200 bg-gradient-to-r from-[#DD2A7B]/20 to-[#8134AF]/20 text-[#DD2A7B] hover:from-[#DD2A7B]/30 hover:to-[#8134AF]/30 hover:text-[#DD2A7B] flex items-center gap-1.5 border border-[#DD2A7B]/20 hover:border-[#DD2A7B]/30"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
                ASK AI
              </Link>

              <Link
                href="/experiences?nearby=true"
                className="px-4 py-2 rounded-xl text-body-sm font-semibold transition-all duration-200 text-[#94A3B8] hover:text-white hover:bg-white/[0.05] flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Near Me
              </Link>

              <Link
                href="/notifications"
                onClick={(e) => { e.preventDefault(); setNotifOpen(!notifOpen); }}
                className="relative px-3 py-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/[0.05] transition-all font-semibold"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#FF2D7A] text-[10px] font-bold text-white ring-2 ring-white px-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Become a Host */}
              {signedIn && userRole !== "partner" && userRole !== "admin" && (
                <button
                  onClick={() => {
                    localStorage.setItem("experio-signup-role", "partner");
                    setAuthOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-body-sm font-semibold transition-all duration-200 bg-gradient-to-r from-[#8134AF]/20 to-[#DD2A7B]/20 text-[#8134AF] hover:from-[#8134AF]/30 hover:to-[#DD2A7B]/30 hover:text-[#8134AF] flex items-center gap-1.5 border border-[#8134AF]/20 hover:border-[#8134AF]/30"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Become a Host
                </button>
              )}

              {/* Profile / Auth Button */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    if (signedIn) {
                      setProfileOpen((prev) => !prev);
                    } else {
                      setAuthOpen(true);
                    }
                  }}
                  className="ml-1 w-9 h-9 rounded-full bg-gradient-to-br from-[#FF2D7A] to-[#FF7A18] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(255,45,122,0.25)] hover:shadow-[0_4px_12px_rgba(255,45,122,0.35)] transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </button>

                {/* Airbnb-style Profile Dropdown */}
                {profileOpen && signedIn && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#111827] border border-white/[0.1] shadow-[0_4px_24px_rgba(0,0,0,0.4)] py-2 z-[1000]">
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-white hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Profile
                    </Link>
                    <Link
                      href="/bookings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-white hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      My Bookings
                    </Link>
                    <Link
                      href="/saved"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-white hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      Saved
                    </Link>
                    <Link
                      href="/loyalty"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-white hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      Loyalty
                    </Link>
                    {userRole === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-white hover:bg-white/5 transition-colors"
                      >
                        <svg className="w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Admin Dashboard
                      </Link>
                    )}
                    {userRole === "partner" && (
                      <Link
                        href="/partner/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-white hover:bg-white/5 transition-colors"
                      >
                        <svg className="w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        Host Dashboard
                      </Link>
                    )}
                    <div className="px-4 py-2">
                      <LoyaltyBadge minimal />
                    </div>
                    <hr className="my-2 border-white/[0.1]" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm text-[#FF2D7A] hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.05] transition-colors"
              aria-label="Toggle menu"
            >
              <div className="w-5 flex flex-col gap-1">
                <span className={`block h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`block h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu — cinematic lifestyle overlay */}
        {menuOpen && (
          <div className="md:hidden fixed inset-x-0 top-18 bottom-0 z-[998] overflow-y-auto">
            {/* Cinematic background image */}
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=85"
                alt=""
                className="w-full h-full object-cover"
              />
              {/* Dark gradient overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/50" />
              <div className="absolute inset-0 backdrop-blur-[2px]" />
            </div>
            <nav className="relative z-10 px-4 py-6 space-y-2 min-h-full">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-body-sm font-semibold transition-all ${
                      isActive
                        ? "bg-white/15 text-white backdrop-blur-md border border-white/10"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <hr className="my-3 border-white/10" />
              <Link
                href="/ask-ai"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-body-sm font-semibold text-[#DD2A7B] hover:bg-white/10 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
                ASK AI
              </Link>
              <Link
                href="/experiences?nearby=true"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-body-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Near Me
              </Link>
              {signedIn ? (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setNotifOpen(!notifOpen);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-body-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    Notifications
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-body-sm font-semibold text-[#ff6b6b] hover:bg-white/10 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setAuthOpen(true);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255,45,122,0.4)] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                  Sign In / Register
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {notifOpen && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-20 bg-black/20 backdrop-blur-xs" onClick={() => setNotifOpen(false)}>
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-[#111827] border border-white/[0.1] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-body font-semibold text-white">Notifications</h2>
              <button onClick={() => setNotifOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5 text-[#94A3B8] transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-2">
              {notifList.length === 0 ? (
                <p className="text-caption text-[#64748B] text-center py-6">No notifications yet</p>
              ) : (
                notifList.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-[#0A0E17] border border-white/[0.06]">
                    <p className="text-body-sm font-medium text-white">{n.title}</p>
                    <p className="text-caption text-[#CBD5E1] mt-0.5 line-clamp-1">{n.description}</p>
                    <p className="text-caption text-[#94A3B8] mt-1">{n.time}</p>
                  </div>
                ))
              )}
            </div>
            {notifList.length > 0 && (
              <Link
                href="/notifications"
                onClick={() => setNotifOpen(false)}
                className="block mt-3 text-center text-caption font-semibold text-[#FF2D7A] hover:text-[#FF2D7A]/80 pt-2 border-t border-white/[0.08] transition-colors"
              >
                View All Notifications →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
