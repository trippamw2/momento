"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import AuthModal from "./AuthModal";

const rightItems = [
  { label: "Near Me", icon: "compass", href: "/experiences?nearby=true" },
  { label: "Notifications", icon: "bell", href: "#notifications" },
  { label: "Profile", icon: "user", href: "#auth" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [nearbyActive, setNearbyActive] = useState(false);

  const navItems = [
    { label: "Discover", href: "/" },
    { label: "Gift", href: "/gift" },
    { label: "Saved", href: "/saved" },
    { label: "Bookings", href: "/bookings" },
    { label: "Partners", href: "/profile" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-navbar">
        <div className="absolute inset-0 bg-[#05070B]/80 backdrop-blur-2xl border-b border-[rgba(255,255,255,0.06)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-18">
            <div className="flex items-center gap-8">
              <Logo size="sm" />

              <nav className="hidden md:flex items-center gap-0.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-2 rounded-xl text-body-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-white/[0.08] text-white"
                          : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setNearbyActive(!nearbyActive)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-body-sm font-medium transition-all duration-200 ${
                  nearbyActive
                    ? "bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] text-white"
                    : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                Near Me
              </button>

              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2.5 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF2D7A]" />
              </button>

              <button
                onClick={() => setAuthOpen(true)}
                className="p-2.5 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.04] transition-colors"
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

        {menuOpen && (
          <div className="md:hidden border-t border-[rgba(255,255,255,0.06)] bg-[#05070B]/95 backdrop-blur-2xl">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-body-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <hr className="my-2 border-[rgba(255,255,255,0.06)]" />
              {[
                { label: "Near Me", href: "/experiences?nearby=true", icon: "compass" },
                { label: "Notifications", href: "#notifications", icon: "bell" },
                { label: "Profile", href: "#auth", icon: "user" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setMenuOpen(false);
                    if (item.href === "#auth") setAuthOpen(true);
                    else if (item.href === "#notifications") setNotifOpen(!notifOpen);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-body-sm text-[#A1A1AA] hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {notifOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={() => setNotifOpen(false)}>
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-[#0A101B] border border-[rgba(255,255,255,0.08)] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-body font-semibold text-white">Notifications</h2>
              <button onClick={() => setNotifOpen(false)} className="text-[#A1A1AA] hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              {[
                { title: "New experiences near you", desc: "5 new experiences added in Lilongwe", time: "2h ago" },
                { title: "Weekend flash sale", desc: "Up to 30% off selected experiences", time: "1d ago" },
              ].map((n, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.06)]">
                  <p className="text-body-sm font-medium text-white">{n.title}</p>
                  <p className="text-caption text-[#A1A1AA] mt-0.5">{n.desc}</p>
                  <p className="text-caption text-[#6B7280] mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}