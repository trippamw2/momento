"use client";

import Link from "next/link";

const guidelines = [
  {
    title: "Verified Hosts",
    desc: "Every experience host is vetted and verified before listing. We review credentials, safety protocols, and customer history to ensure quality and reliability.",
    icon: "🛡",
  },
  {
    title: "Secure Payments",
    desc: "All transactions are processed through encrypted, PCI-compliant gateways. Your financial information is never shared with hosts.",
    icon: "🔒",
  },
  {
    title: "Transparent Reviews",
    desc: "Every review comes from a confirmed booking. We do not allow fake or incentivized reviews, and our moderation team actively monitors for abuse.",
    icon: "⭐",
  },
  {
    title: "24/7 Support",
    desc: "Our support team is available around the clock to assist with any safety concerns before, during, or after your experience.",
    icon: "📞",
  },
  {
    title: "COVID-19 Precautions",
    desc: "We encourage all hosts to follow local health guidelines. Many experiences offer flexible cancellation if you or a guest feel unwell.",
    icon: "🩺",
  },
  {
    title: "Community Guidelines",
    desc: "We maintain a zero-tolerance policy for harassment, discrimination, or unsafe behavior. All participants agree to treat each other with respect.",
    icon: "🤝",
  },
];

export default function SafetyPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-display-sm font-bold text-[#222222] mb-3">Safety</h1>
          <p className="text-[#6a6a6a] text-body-lg max-w-xl mx-auto">
            Your safety is our foundation. Here&apos;s how we protect every member of the Momento community.
          </p>
        </div>

        {/* Guidelines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {guidelines.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#dddddd] bg-white p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-shadow"
            >
              <span className="text-2xl mb-3 block">{item.icon}</span>
              <h3 className="text-heading-sm font-bold text-[#222222] mb-2">{item.title}</h3>
              <p className="text-[#6a6a6a] text-body-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Report */}
        <div className="rounded-2xl border border-[#dddddd] bg-[#fafafa] p-8 text-center">
          <h2 className="text-heading-sm font-bold text-[#222222] mb-2">Report a Concern</h2>
          <p className="text-[#6a6a6a] text-body-sm mb-5 max-w-md mx-auto">
            If you experienced or witnessed something that violates our safety guidelines, please report it immediately.
          </p>
          <a
            href="mailto:safety@momento.life"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all duration-300"
          >
            Report
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
