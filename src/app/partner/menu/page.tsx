"use client";

import { useAuthGuard } from "@/lib/use-auth-guard";
import Link from "next/link";

const menuItems = [
  {
    id: "account",
    title: "Account Settings",
    description: "Manage your profile, contact info, and preferences",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
      </svg>
    ),
    href: "/partner/menu/account",
  },
  {
    id: "resources",
    title: "Host Resources",
    description: "Guides, tips, and best practices for hosting",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 0010 16.8a.997.997 0 011 .084 8.994 8.994 0 005.043-2.121 1 1 0 111.413 1.415c-2.178 2.52-5.131 4.172-8.454 4.172-.91 0-1.797-.17-2.605-.48a1 1 0 111.347-1.946zM14.343 13.524c-.442-.793-.613-1.305-.613-2.024 0-.719.171-1.23.613-2.024l.812-.814a1 1 0 111.415 1.414l-.813.814c-.443.792-.612 1.305-.612 2.024 0 .72.17 1.23.613 2.024l.813.814a1 1 0 11-1.414 1.415l-.812-.813zm1.82-12.844a1 1 0 101.415-1.415l-7.778-7.779a1 1 0 00-1.414 0l-.586.586a1 1 0 000 1.415l7.778 7.778zm-1.06 1.06l-7.778 7.778a1 1 0 000 1.415l.586.587a1 1 0 001.414 0l7.778-7.778a1 1 0 000-1.415l-.587-.586z" clipRule="evenodd" />
      </svg>
    ),
    href: "/partner/menu/resources",
  },
  {
    id: "help",
    title: "Get Help",
    description: "Support center, FAQs, and contact us",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
    href: "/partner/menu/help",
  },
  {
    id: "create",
    title: "Create New Listing",
    description: "List a new experience on Experio",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
    href: "/partner/menu/create",
    highlight: true,
  },
  {
    id: "refer",
    title: "Refer a Host",
    description: "Invite others to become hosts and earn rewards",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M15 8a3 3 0 11-2.165-5.276L13 8H9v2h4v2h2V8z" />
        <path d="M4.995 3.834a.997.997 0 00-.563-.147A.996.996 0 004 4.5c0 .47.278.863.663.984.301.095.597.07.854-.098.276-.173.52-.45.703-.752.173-.28.173-.622 0-.905a2.99 2.99 0 01-.416-1.863A9.92 9.92 0 014 3.198a9.818 9.818 0 01.995-.636zm.27 8.072a.997.997 0 00-.564.147A.996.996 0 004 15.5c0 .47.278-.863.663-.984.301-.095.597-.07.854.098.276.173.52.45.703.752.173.28.173.622 0 .905a2.99 2.99 0 01-.416 1.863A9.92 9.92 0 014 16.802a9.818 9.818 0 01-.995.636zm10.535-2.82a.997.997 0 00-.563-.147A.996.996 0 0014 15.5c0 .47.278-.863.663-.984.301-.095.597-.07.854.098.276.173.52.45.703.752.173.28.173.622 0 .905a2.99 2.99 0 01-.416 1.863A9.92 9.92 0 0114 16.802a9.818 9.818 0 01-.995.636zm.27-8.072a.997.997 0 00-.564-.147A.996.996 0 0014 4.5c0 .47.278.863.663.984.301.095.597.07.854-.098.276-.173.52-.45.703-.752.173-.28.173-.622 0-.905a2.99 2.99 0 01-.416-1.863A9.92 9.92 0 0114 3.198a9.818 9.818 0 01.995-.636z" />
      </svg>
    ),
    href: "/partner/menu/refer",
  },
  {
    id: "legal",
    title: "Legal",
    description: "Terms of service, privacy policy, and legal info",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10.293 5.707a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L12.586 6H5a1 1 0 110-2h7.586l-3-3a1 1 0 111.414-1.414z" clipRule="evenodd" />
        <path d="M14 11a2 2 0 11-4 0 2 2 0 014 0z" />
        <path d="M4 17a2 2 0 012-2h8a2 2 0 012 2v-2H4v2z" />
      </svg>
    ),
    href: "/partner/menu/legal",
  },
];

export default function MenuPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isPartner) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display-sm font-bold text-white mb-2">Menu</h1>
        <p className="text-[#64748B] text-body-lg">Manage your account and hosting tools</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`group rounded-2xl border p-6 transition-all ${
              item.highlight
                ? "bg-gradient-to-br from-[#FF0F73]/10 to-[#FF7A1A]/10 border-[#FF0F73]/30 hover:shadow-[0_8px_32px_rgba(255,15,115,0.2)]"
                : "bg-[#111827] border-white/[0.08] hover:border-[#FF0F73]/30 hover:bg-white/[0.02]"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${item.highlight ? "bg-gradient-to-br from-[#FF0F73] to-[#FF7A1A]" : "bg-white/5"} group-hover:scale-110`}>
              <span className="text-white">{item.icon}</span>
            </div>
            <h3 className="text-heading-sm font-bold text-white mb-2">{item.title}</h3>
            <p className="text-[#64748B] text-body-sm leading-relaxed">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}