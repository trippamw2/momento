"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Logo from "@/components/Logo";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [nearbyActive, setNearbyActive] = useState(false);

  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("momento-auth-token") : null;
    setSignedIn(!!token);
  }, []);

  const navItems = [
    { label: "Discover", href: "/" },
    { label: "Experiences", href: "/experiences" },
    { label: "Gift", href: "/gift" },
    { label: "Saved", href: "/saved" },
    { label: "Memories", href: "/bookings" },
    ...(signedIn ? [{ label: "Profile", href: "/profile" }] : []),
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-navbar bg-white border-b border-[#dddddd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
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
                          ? "bg-[#f7f7f7] text-[#222222]"
                          : "text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]"
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
                className={`px-4 py-2 rounded-xl text-body-sm font-medium transition-all duration-200 ${
                  nearbyActive
                    ? "bg-[#ff385c] text-white"
                    : "text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]"
                }`}
              >
                Near Me
              </button>

              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative px-3 py-2 rounded-xl text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7] transition-all font-medium"
              >
                Notifications
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ff385c]" />
              </button>

              <button
                onClick={() => setAuthOpen(true)}
                className="px-3 py-2 rounded-xl text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7] transition-all font-medium"
              >
                Profile
              </button>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#f7f7f7] transition-colors"
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

        {menuOpen && (
          <div className="md:hidden border-t border-[#dddddd] bg-white">
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
                        ? "bg-[#f7f7f7] text-[#222222]"
                        : "text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <hr className="my-2 border-[#dddddd]" />
              {[
                { label: "Near Me", href: "/experiences?nearby=true" },
                { label: "Notifications", href: "#notifications" },
                { label: "Profile", href: "#auth" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setMenuOpen(false);
                    if (item.href === "#auth") setAuthOpen(true);
                    else if (item.href === "#notifications") setNotifOpen(!notifOpen);
                  }}
                  className="w-full px-4 py-3 rounded-xl text-body-sm text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7] transition-colors font-medium"
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
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-white border border-[#dddddd] p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-body font-semibold text-[#222222]">Notifications</h2>
              <button onClick={() => setNotifOpen(false)} className="text-[#6a6a6a] hover:text-[#222222] font-bold text-heading">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {[
                { title: "New experiences near you", desc: "5 new experiences added in Lilongwe", time: "2h ago" },
                { title: "Weekend flash sale", desc: "Up to 30% off selected experiences", time: "1d ago" },
              ].map((n, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#f7f7f7] border border-[#ebebeb]">
                  <p className="text-body-sm font-medium text-[#222222]">{n.title}</p>
                  <p className="text-caption text-[#6a6a6a] mt-0.5">{n.desc}</p>
                  <p className="text-caption text-[#929292] mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
