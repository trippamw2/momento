"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import AuthModal from "./AuthModal";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("experio-auth-token") : null;
    setSignedIn(!!token);
  }, []);

  const navItems = [
    {
      href: "/discover",
      label: "Discover",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      href: "/saved",
      label: "Saved",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      onClick: !signedIn ? (e: React.MouseEvent) => { e.preventDefault(); setAuthOpen(true); } : undefined,
    },
    {
      href: "/wallet",
      label: "Wallet",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <rect x="2" y="7" width="20" height="13" rx="2" ry="2" />
          <path d="M16 12a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      onClick: !signedIn ? (e: React.MouseEvent) => { e.preventDefault(); setAuthOpen(true); } : undefined,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: !signedIn ? (e: React.MouseEvent) => { e.preventDefault(); setAuthOpen(true); } : undefined,
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[1000] bg-[#111827]/95 backdrop-blur-xl border-t border-white/[0.08] safe-area-bottom">
        <div className="grid grid-cols-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/discover" && item.href !== "#" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={item.onClick}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 transition-all duration-200 ${
                  isActive
                    ? "text-[#FF0F73]"
                    : "text-[#64748B] active:text-white/70"
                }`}
              >
                <span className="w-6 h-6 flex items-center justify-center">{item.icon}</span>
                <span className="text-[10px] font-semibold tracking-wide leading-none">{item.label}</span>
                {isActive && (
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FF0F73]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
