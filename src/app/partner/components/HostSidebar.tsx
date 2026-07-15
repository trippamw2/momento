"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Today",
    href: "/partner/today",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Calendar",
    href: "/partner/calendar",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 016 0V4a1 1 0 00-2 0z" />
        <path d="M11 4a1 1 0 10-2 0v1.268a2 2 0 016 0V4a1 1 0 00-2 0z" />
        <path fillRule="evenodd" d="M4 12a2 2 0 012-2h8a2 2 0 012 2v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5zm2 1a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Listings",
    href: "/partner/listings",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/partner/messages",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Menu",
    href: "/partner/menu",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default function HostSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[72px] md:w-64 bg-[#0F0F0F] border-r border-white/[0.06] z-50 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-white/[0.06]">
        <Link href="/partner/today" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="hidden md:block text-heading-sm font-bold text-white">Experio</span>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 md:px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-[#64748B] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="hidden md:block text-body-sm font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: Switch to guest mode */}
      <div className="p-2 md:p-3 border-t border-white/[0.06]">
        <Link
          href="/"
          className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-3 rounded-xl text-[#64748B] hover:text-white hover:bg-white/[0.04] transition-all"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span className="hidden md:block text-body-sm font-semibold">Guest Mode</span>
        </Link>
      </div>
    </aside>
  );
}
