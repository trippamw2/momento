"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const walletTabs = [
  { href: "/wallet", label: "Overview", icon: "🏦" },
  { href: "/wallet/top-up", label: "Top Up", icon: "💳" },
  { href: "/wallet/transfer", label: "Transfer", icon: "↔️" },
];

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 bg-dark-950/95 backdrop-blur-sm border-b border-dark-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-1 py-3 overflow-x-auto scrollbar-none">
            {walletTabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-gold/20 text-gold border border-gold/30"
                      : "text-gray-400 hover:text-white hover:bg-dark-800"
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
