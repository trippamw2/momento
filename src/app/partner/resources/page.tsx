"use client";

import Link from "next/link";

const resources = [
  {
    title: "Hosting Guide",
    desc: "Best practices for creating unforgettable guest experiences, from setting expectations to going the extra mile.",
    icon: "📖",
  },
  {
    title: "Pricing Tips",
    desc: "Learn how to price your experience competitively while ensuring a great value proposition for guests.",
    icon: "💰",
  },
  {
    title: "Photography Guide",
    desc: "Tips for capturing high-quality photos that showcase your experience and attract more bookings.",
    icon: "📸",
  },
  {
    title: "Safety Checklist",
    desc: "Essential safety protocols and best practices to ensure every guest has a safe and enjoyable experience.",
    icon: "✅",
  },
  {
    title: "Marketing Tools",
    desc: "Promote your experiences with custom links, social media templates, and seasonal campaign ideas.",
    icon: "📣",
  },
  {
    title: "Partner Dashboard",
    desc: "Manage your listings, view analytics, and track earnings through your partner dashboard.",
    icon: "📊",
    link: "/profile",
  },
];

export default function PartnerResourcesPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-display-sm font-bold text-[#222222] mb-3">Partner Resources</h1>
          <p className="text-[#6a6a6a] text-body-lg max-w-lg">
            Everything you need to succeed as an Experio host — from getting started to growing your business.
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {resources.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#dddddd] bg-white p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-shadow"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="text-heading-sm font-bold text-[#222222] mb-1">{item.title}</h3>
                  <p className="text-[#6a6a6a] text-body-sm leading-relaxed">{item.desc}</p>
                  {item.link && (
                    <Link
                      href={item.link}
                      className="inline-flex items-center gap-1 text-[#DD2A7B] text-body-sm font-medium hover:underline mt-2"
                    >
                      Go to Dashboard
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-[#dddddd] bg-[#fafafa] p-8 text-center">
          <h2 className="text-heading-sm font-bold text-[#222222] mb-2">Have questions?</h2>
          <p className="text-[#6a6a6a] text-body-sm mb-5 max-w-md mx-auto">
            Our partner support team is here to help you every step of the way.
          </p>
          <a
            href="mailto:partners@experio.life"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#DD2A7B] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all duration-300"
          >
            Contact Partner Support
          </a>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-body-sm text-[#6a6a6a] hover:text-[#222222] transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
