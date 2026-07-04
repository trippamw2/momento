"use client";

import Link from "next/link";

const faqs = [
  {
    q: "How do I book an experience?",
    a: "Browse experiences on the home page or explore page, select one that catches your eye, choose your preferred date and number of guests, then complete the secure checkout. You'll receive a confirmation via email and in your bookings dashboard.",
  },
  {
    q: "Can I cancel or reschedule a booking?",
    a: "Yes â€” you can reschedule any booking up to 48 hours before the start time at no charge. Cancellations made more than 48 hours in advance are fully refunded. See our cancellation policy for details.",
  },
  {
    q: "How do gift cards work?",
    a: "Purchase a gift card for any amount, and the recipient receives a unique code via SMS or email. They can redeem it at checkout toward any experience on Momento. Gift cards never expire.",
  },
  {
    q: "Is my payment information secure?",
    a: "Absolutely. All payments are processed through encrypted, PCI-compliant gateways. We never store your full card details on our servers.",
  },
  {
    q: "How do I become a partner?",
    a: "Visit the Partner Dashboard from your profile page to submit your experience for review. Our team evaluates each listing for quality, safety, and uniqueness before it goes live.",
  },
  {
    q: "What if I have issues during an experience?",
    a: "Contact us immediately through the in-app support chat or email help@momento.life. We'll work with you and the host to resolve any issues. Your safety and satisfaction are our priority.",
  },
];

export default function HelpPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-display-sm font-bold text-[#222222] mb-3">Help Center</h1>
          <p className="text-[#6a6a6a] text-body-lg max-w-lg mx-auto">
            Everything you need to know about booking, gifting, and partnering with Momento.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-[#dddddd] bg-white overflow-hidden"
            >
              <summary className="list-none flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-[#f7f7f7] transition-colors duration-200">
                <span className="text-[#222222] font-semibold text-body pr-4">{faq.q}</span>
                <svg
                  className="w-5 h-5 text-[#6a6a6a] flex-shrink-0 group-open:rotate-180 transition-transform duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-5 border-t border-[#ebebeb]">
                <p className="text-[#6a6a6a] text-body-sm leading-relaxed mt-4">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 text-center p-8 rounded-2xl bg-[#f7f7f7] border border-[#dddddd]">
          <h2 className="text-heading-sm font-bold text-[#222222] mb-2">Still need help?</h2>
          <p className="text-[#6a6a6a] text-body-sm mb-5">
            Reach out to our support team and we&apos;ll get back to you within 24 hours.
          </p>
          <a
            href="mailto:help@momento.life"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF0F73] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255, 15, 115, 0.3)] transition-all duration-300"
          >
            Email Support
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
