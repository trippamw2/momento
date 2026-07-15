"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthGuard } from "@/lib/use-auth-guard";

const resources = [
  {
    id: "getting-started",
    title: "Getting Started as a Host",
    description: "Everything you need to know to list your first experience on Experio. From account setup to your first booking.",
    category: "Getting Started",
    readTime: "5 min read",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
    ),
  },
  {
    id: "creating-memorable",
    title: "Creating Memorable Experiences",
    description: "Learn how to design experiences that guests love. Tips on storytelling, pacing, and creating 'wow' moments.",
    category: "Experience Design",
    readTime: "8 min read",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 11-2.165-5.276L13 8H9v2h4v2h2V8z" /><path d="M4.995 3.834a.997.997 0 00-.563-.147A.996.996 0 004 4.5c0 .47.278.863.663.984.301.095.597.07.854-.098.276-.173.52-.45.703-.752.173-.28.173-.622 0-.905a2.99 2.99 0 01-.416-1.863A9.92 9.92 0 014 3.198a9.818 9.818 0 01.995-.636zm.27 8.072a.997.997 0 00-.564.147A.996.996 0 004 15.5c0 .47.278-.863.663-.984.301-.095.597-.07.854.098.276.173.52.45.703.752.173.28.173.622 0 .905a2.99 2.99 0 01-.416 1.863A9.92 9.92 0 014 16.802a9.818 9.818 0 01-.995.636zm10.535-2.82a.997.997 0 00-.563-.147A.996.996 0 0014 15.5c0 .47.278-.863.663-.984.301-.095.597-.07.854.098.276.173.52.45.703.752.173.28.173.622 0 .905a2.99 2.99 0 01-.416 1.863A9.92 9.92 0 0114 16.802a9.818 9.818 0 01-.995.636zm.27-8.072a.997.997 0 00-.564-.147A.996.996 0 0014 4.5c0 .47.278.863.663.984.301.095.597.07.854-.098.276-.173.52-.45.703-.752.173-.28.173-.622 0-.905a2.99 2.99 0 01-.416-1.863A9.92 9.92 0 0114 3.198a9.818 9.818 0 01.995-.636z" /></svg>
    ),
  },
  {
    id: "pricing",
    title: "Pricing Your Experiences",
    description: "Strategies for setting competitive prices that maximize earnings while attracting guests. Dynamic pricing tips included.",
    category: "Business",
    readTime: "6 min read",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm0 4v8a2 2 0 002 2h12a2 2 0 002-2V8H4zm2-2h12v2H6V6zm0 4h12v2H6v-2z" /></svg>
    ),
  },
  {
    id: "safety",
    title: "Safety Guidelines for Hosts",
    description: "Essential safety protocols, emergency procedures, and risk management for every experience type.",
    category: "Safety",
    readTime: "7 min read",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
    ),
  },
  {
    id: "reviews",
    title: "Understanding & Leveraging Reviews",
    description: "How to get more 5-star reviews, respond professionally to feedback, and use reviews to improve your offerings.",
    category: "Growth",
    readTime: "5 min read",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
    ),
  },
  {
    id: "marketing",
    title: "Marketing Your Listing",
    description: "Proven strategies to increase visibility, optimize your listing for search, and attract your ideal guests.",
    category: "Growth",
    readTime: "6 min read",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.293 5.707a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L12.586 6H5a1 1 0 110-2h7.586l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414z" /><path d="M4 12a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.586l1.293-1.293a1 1 0 10-1.414-1.414l-4 4a1 1 0 000 1.414l4 4a1 1 0 001.414-1.414L13.414 12H16a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2h2.586z" /></svg>
    ),
  },
  {
    id: "bookings",
    title: "Handling Bookings & Communication",
    description: "Best practices for managing inquiries, confirmations, pre-arrival communication, and post-experience follow-up.",
    category: "Operations",
    readTime: "6 min read",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
    ),
  },
  {
    id: "community",
    title: "Host Community Guidelines",
    description: "Our community standards, code of conduct, and how to connect with fellow hosts for support and collaboration.",
    category: "Community",
    readTime: "4 min read",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a1 1 0 011 1v2.586l3.293 3.293a1 1 0 01-1.414 1.414L13 10.414V13a1 1 0 11-2 0v-2a1 1 0 011-1z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
    ),
  },
];

export default function ResourcesPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const [search, setSearch] = useState("");

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isPartner) return null;

  const filtered = resources.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-display-sm font-bold text-white mb-2">Host Resources</h1>
        <p className="text-[#64748B] text-body-lg">Guides, tips, and best practices for successful hosting</p>
      </div>

      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 118 0 4 4 0 01-8 0zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources by title, description, or category..."
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF0F73]/30 focus:border-[#FF0F73] text-body-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-white/10 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
          </svg>
          <p className="text-body-sm text-[#64748B]">No resources match your search</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((resource) => (
            <Link
              key={resource.id}
              href={`#${resource.id}`}
              className="group flex flex-col md:flex-row items-start md:items-center gap-5 p-5 rounded-2xl border border-white/[0.08] bg-[#111827] hover:border-[#FF0F73]/30 hover:bg-white/[0.02] transition-all"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${resource.category === "Getting Started" ? "bg-[#FF0F73]/20" : resource.category === "Experience Design" ? "bg-emerald-500/20" : resource.category === "Business" ? "bg-amber-500/20" : resource.category === "Safety" ? "bg-red-500/20" : resource.category === "Growth" ? "bg-purple-500/20" : resource.category === "Operations" ? "bg-blue-500/20" : "bg-cyan-500/20"} group-hover:scale-110`}>
                <span className="text-white">{resource.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-caption font-medium bg-white/10 text-white/70">{resource.category}</span>
                  <span className="text-caption text-[#64748B]">{resource.readTime}</span>
                </div>
                <h3 className="text-body-lg font-semibold text-white mb-1 group-hover:text-[#FF0F73] transition-colors">{resource.title}</h3>
                <p className="text-[#64748B] text-body-sm leading-relaxed">{resource.description}</p>
              </div>
              <svg className="w-5 h-5 text-white/30 group-hover:text-[#FF0F73] transition-colors flex-shrink-0 mt-1 md:mt-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}