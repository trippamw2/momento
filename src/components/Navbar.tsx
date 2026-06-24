"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Logo from "@/components/Logo";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("momento-auth-token") : null;
    setSignedIn(!!token);
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

  const navItems = [
    { label: "Discover", href: "/" },
    { label: "Experiences", href: "/experiences" },
    { label: "Gift", href: "/gift" },
    { label: "Saved", href: "/saved" },
    { label: "Memories", href: "/bookings" },
  ];

  const handleSignOut = () => {
    localStorage.removeItem("momento-auth-token");
    setSignedIn(false);
    setProfileOpen(false);
    window.location.reload();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[999] bg-[#faf8f6]/90 backdrop-blur-xl border-b border-[#ebebeb] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-8">
              <Logo size="sm" />

              <nav className="hidden md:flex items-center gap-0.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative px-3.5 py-2 rounded-xl text-body-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "text-[#111111] after:absolute after:bottom-0 after:left-1/4 after:w-1/2 after:h-0.5 after:bg-[#ff385c] after:rounded-full"
                          : "text-[#4a4a4a] hover:text-[#111111] hover:bg-[#f0ece8]"
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
                href="/experiences?nearby=true"
                className="px-4 py-2 rounded-xl text-body-sm font-semibold transition-all duration-200 text-[#4a4a4a] hover:text-[#111111] hover:bg-[#f0ece8] flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Near Me
              </Link>

              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative px-3 py-2 rounded-xl text-[#4a4a4a] hover:text-[#111111] hover:bg-[#f0ece8] transition-all font-semibold"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff385c] ring-2 ring-[#faf8f6]" />
              </button>

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
                  className="ml-1 w-9 h-9 rounded-full bg-gradient-to-br from-[#ff385c] to-[#FF7A18] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(255,56,92,0.25)] hover:shadow-[0_4px_12px_rgba(255,56,92,0.35)] transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </button>

                {/* Airbnb-style Profile Dropdown */}
                {profileOpen && signedIn && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white border border-[#ebebeb] shadow-[0_4px_24px_rgba(0,0,0,0.08)] py-2 z-[1000]">
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-[#222222] hover:bg-[#f7f7f7] transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#6a6a6a]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Profile
                    </Link>
                    <Link
                      href="/bookings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-[#222222] hover:bg-[#f7f7f7] transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#6a6a6a]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      My Bookings
                    </Link>
                    <Link
                      href="/saved"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-[#222222] hover:bg-[#f7f7f7] transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#6a6a6a]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      Saved
                    </Link>
                    <hr className="my-2 border-[#ebebeb]" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm text-[#c13515] hover:bg-[#f7f7f7] transition-colors"
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
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#f0ece8] transition-colors"
              aria-label="Toggle menu"
            >
              <div className="w-5 flex flex-col gap-1">
                <span className={`block h-0.5 bg-[#222222] transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`block h-0.5 bg-[#222222] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 bg-[#222222] transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#ebebeb] bg-[#faf8f6]/95 backdrop-blur-xl">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-body-sm font-semibold transition-all ${
                      isActive
                        ? "bg-[#FFF0F3] text-[#ff385c]"
                        : "text-[#4a4a4a] hover:text-[#222222] hover:bg-[#f0ece8]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <hr className="my-2 border-[#ebebeb]" />
              <Link
                href="/experiences?nearby=true"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-body-sm font-semibold text-[#4a4a4a] hover:text-[#222222] hover:bg-[#f0ece8] transition-all"
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
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-body-sm font-semibold text-[#4a4a4a] hover:text-[#222222] hover:bg-[#f0ece8] transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    Notifications
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-body-sm font-semibold text-[#c13515] hover:bg-[#f0ece8] transition-all"
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
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#ff385c] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all"
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
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-white border border-[#ebebeb] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-body font-semibold text-[#222222]">Notifications</h2>
              <button onClick={() => setNotifOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#f5f2ef] text-[#6a6a6a] transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              {[
                { title: "New experiences near you", desc: "5 new experiences added in Lilongwe", time: "2h ago" },
                { title: "Weekend flash sale", desc: "Up to 30% off selected experiences", time: "1d ago" },
              ].map((n, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#f5f2ef] border border-[#ebebeb]">
                  <p className="text-body-sm font-medium text-[#222222]">{n.title}</p>
                  <p className="text-caption text-[#4a4a4a] mt-0.5">{n.desc}</p>
                  <p className="text-caption text-[#6a6a6a] mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
