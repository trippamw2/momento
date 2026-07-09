import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Discover — Experio",
  description: "Swipe through unforgettable experiences. Save, gift, share, or book instantly.",
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Transparent overlay nav */}
      <header className="fixed top-0 left-0 right-0 z-[999] bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            <Logo size="sm" />
            <div className="flex items-center gap-3">
              <Link
                href="/experiences"
                className="text-caption text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10"
              >
                Browse All
              </Link>
              <Link
                href="/"
                className="text-caption text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      {children}
    </>
  );
}
