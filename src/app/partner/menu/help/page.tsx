"use client";

import { useState } from "react";
import { useAuthGuard } from "@/lib/use-auth-guard";

const faqs = [
  {
    category: "Getting Started",
    items: [
      {
        question: "How do I become a host on Experio?",
        answer: "To become a host, sign up for a partner account, complete the onboarding wizard, verify your identity, and create your first experience listing. Our team will review your listing within 3-5 business days.",
      },
      {
        question: "What are the requirements to host experiences?",
        answer: "You must be at least 18 years old, have a valid ID, pass our background check, and have the necessary skills or qualifications for your experience type. Some categories (like adventure sports) require additional certifications.",
      },
      {
        question: "Can I host experiences part-time?",
        answer: "Absolutely! Many of our hosts start part-time. You set your own availability and can host as frequently or infrequently as you'd like. There's no minimum commitment.",
      },
    ],
  },
  {
    category: "Bookings & Payments",
    items: [
      {
        question: "How do I get paid for my experiences?",
        answer: "Payments are processed automatically after each completed experience. Funds are deposited to your linked bank account or mobile money within 5-7 business days. You can track earnings in the Earnings & Payouts section.",
      },
      {
        question: "What happens if a guest cancels?",
        answer: "Cancellation policies are set per experience. Flexible: full refund 24h before. Moderate: full refund 5 days before. Strict: 50% refund 7 days before. Very Strict: no refund. You keep the earnings based on the policy you chose.",
      },
      {
        question: "How do I handle a booking modification request?",
        answer: "Guests can request date/time changes up to the cutoff time. You'll receive a notification and can accept or decline. If you accept, the booking is updated automatically. If you decline, the original booking stands.",
      },
    ],
  },
  {
    category: "Listing Management",
    items: [
      {
        question: "Can I edit my listing after it's published?",
        answer: "Yes! You can edit most details (description, photos, pricing, availability) anytime from the Listings section. Major changes like category or location may require re-review. Live bookings are never affected by edits.",
      },
      {
        question: "How do I pause or unlist my experience?",
        answer: "Go to Listing Settings for any experience. You can 'Pause' to temporarily stop new bookings while honoring existing ones, or 'Unlist' to remove from search completely. Both can be reversed anytime.",
      },
      {
        question: "What photos should I include?",
        answer: "Minimum 7 photos required. Include: cover photo (experience in action), location/venue, what guests will do, host photo, equipment/materials, and 2+ detail shots. High-quality, well-lit photos get more bookings.",
      },
    ],
  },
  {
    category: "Account & Safety",
    items: [
      {
        question: "How do I update my payment details?",
        answer: "Go to Menu > Account Settings > Payment Details. Add or update your bank account or mobile money number. Changes take effect for future payouts.",
      },
      {
        question: "What safety measures are in place for hosts?",
        answer: "All guests are verified with ID and phone. You can review guest profiles before accepting. We provide liability insurance for eligible experiences. Our 24/7 support line is available for emergencies.",
      },
      {
        question: "How do I report a problem with a guest?",
        answer: "During or after an experience, use the 'Report Issue' button in the booking details. For urgent safety concerns, call our emergency line. All reports are reviewed by our trust & safety team.",
      },
    ],
  },
];

export default function HelpPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isPartner) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-display-sm font-bold text-white mb-2">Get Help</h1>
        <p className="text-[#64748B] text-body-lg">Support center, FAQs, and contact information</p>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-4">
        {faqs.map((section) => (
          <div key={section.category} className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-heading-sm font-bold text-white">{section.category}</h3>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {section.items.map((faq, idx) => (
                <div key={idx}>
                  <button
                    onClick={() => setOpenFaq(openFaq === `${section.category}-${idx}` ? null : `${section.category}-${idx}`)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-body-sm font-medium text-white pr-4">{faq.question}</span>
                    <svg className={`w-5 h-5 text-[#64748B] flex-shrink-0 transition-transform ${openFaq === `${section.category}-${idx}` ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {openFaq === `${section.category}-${idx}` && (
                    <div className="px-5 pb-5 animate-slide-down">
                      <p className="text-[#CBD5E1] text-body-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Support */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#FF0F73]/10 to-[#FF7A1A]/10 p-6">
        <h3 className="text-heading-sm font-bold text-white mb-4">Still need help?</h3>
        <p className="text-[#CBD5E1] text-body-sm leading-relaxed mb-6">
          Can't find the answer you're looking for? Our support team is here to help.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="mailto:support@experio.com" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#FF0F73]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#FF0F73]" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
            </div>
            <div>
              <p className="text-caption text-[#64748B]">Email Us</p>
              <p className="text-body-sm font-medium text-white">support@experio.com</p>
            </div>
          </a>
          <a href="tel:+265888123456" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
            </div>
            <div>
              <p className="text-caption text-[#64748B]">Call Us</p>
              <p className="text-body-sm font-medium text-white">+265 888 123 456</p>
            </div>
          </a>
        </div>
        <div className="mt-6 pt-6 border-t border-white/[0.1]">
          <p className="text-caption text-[#64748B]">Support hours: Mon-Fri 8am-6pm, Sat 9am-2pm (CAT)</p>
        </div>
      </div>
    </div>
  );
}