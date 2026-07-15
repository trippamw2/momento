"use client";

import { useState } from "react";
import { useAuthGuard } from "@/lib/use-auth-guard";

export default function LegalPage() {
  const { allowed: isPartner, loading: authLoading } = useAuthGuard({ requiredRole: "partner" });
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "host-agreement">("terms");

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF0F73]/30 border-t-[#FF0F73] animate-spin" />
      </div>
    );
  }

  if (!isPartner) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-display-sm font-bold text-white mb-2">Legal Information</h1>
        <p className="text-[#64748B] text-body-lg">Terms of service, privacy policy, and host agreements</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.08] overflow-x-auto">
        <button
          onClick={() => setActiveTab("terms")}
          className={`px-6 py-3 text-body-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "terms"
              ? "border-[#FF0F73] text-[#FF0F73]"
              : "border-transparent text-[#64748B] hover:text-white"
          }`}
        >
          Terms of Service
        </button>
        <button
          onClick={() => setActiveTab("privacy")}
          className={`px-6 py-3 text-body-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "privacy"
              ? "border-[#FF0F73] text-[#FF0F73]"
              : "border-transparent text-[#64748B] hover:text-white"
          }`}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => setActiveTab("host-agreement")}
          className={`px-6 py-3 text-body-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "host-agreement"
              ? "border-[#FF0F73] text-[#FF0F73]"
              : "border-transparent text-[#64748B] hover:text-white"
          }`}
        >
          Host Agreement
        </button>
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 md:p-8">
        {activeTab === "terms" && (
          <div className="space-y-6 text-[#94A3B8] text-body-sm leading-relaxed">
            <h2 className="text-heading-lg font-bold text-white">Terms of Service</h2>
            <p className="text-caption text-[#64748B]">Last updated: January 1, 2024</p>

            <div className="space-y-4">
              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing or using the Experio platform (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;).
                  If you do not agree to all of these Terms, you may not use the Service.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">2. Description of Service</h3>
                <p>
                  Experio is a platform that connects experience providers (&quot;Hosts&quot;) with travelers and guests (&quot;Guests&quot;).
                  The Service includes the website, mobile applications, and all related services and tools.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">3. User Accounts</h3>
                <p>
                  You must provide accurate, current, and complete information during registration.
                  You are responsible for safeguarding your password and all activities that occur under your account.
                  You must notify Experio immediately of any unauthorized use of your account.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">4. Host Obligations</h3>
                <p>
                  Hosts are responsible for providing accurate descriptions, fair pricing, and delivering experiences as listed.
                  Hosts must comply with all applicable laws and regulations, including local business licensing requirements.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">5. Booking and Payments</h3>
                <p>
                  Bookings are subject to availability. Prices are set by Hosts and displayed in the local currency.
                  Experio charges a platform fee on each transaction, which is deducted from Host payouts.
                  Cancellations are governed by the cancellation policy set by each Host.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">6. Content</h3>
                <p>
                  Users retain ownership of content they submit. By submitting content, you grant Experio a worldwide, non-exclusive license to use, reproduce, and display the content in connection with the Service.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">7. Limitation of Liability</h3>
                <p>
                  Experio is not liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Service.
                  The Service is provided &quot;as is&quot; without warranties of any kind, whether express or implied.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">8. Changes to Terms</h3>
                <p>
                  Experio reserves the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
                </p>
              </section>
            </div>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="space-y-6 text-[#94A3B8] text-body-sm leading-relaxed">
            <h2 className="text-heading-lg font-bold text-white">Privacy Policy</h2>
            <p className="text-caption text-[#64748B]">Last updated: January 1, 2024</p>

            <div className="space-y-4">
              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">1. Information We Collect</h3>
                <p>
                  We collect information you provide directly, including name, email, phone number, payment information, and profile details.
                  We automatically collect device information, usage data, and location information when you use the Service.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">2. How We Use Information</h3>
                <p>
                  We use information to provide, maintain, and improve the Service; to process transactions; to send communications;
                  to detect and prevent fraud; and to comply with legal obligations.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">3. Information Sharing</h3>
                <p>
                  We share information with Hosts and Guests as necessary to facilitate bookings.
                  We may share information with service providers, for legal reasons, or with your consent.
                  We do not sell personal information to third parties.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">4. Data Security</h3>
                <p>
                  We implement appropriate security measures to protect your personal information.
                  However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">5. Your Rights</h3>
                <p>
                  You may access, correct, or delete your personal information through your account settings.
                  You may opt out of non-essential communications at any time.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">6. Cookies</h3>
                <p>
                  We use cookies and similar technologies to improve user experience, analyze usage, and assist in marketing efforts.
                  You may control cookies through your browser settings.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">7. Contact Us</h3>
                <p>
                  For questions about this Privacy Policy, please contact us at privacy@experio.com.
                </p>
              </section>
            </div>
          </div>
        )}

        {activeTab === "host-agreement" && (
          <div className="space-y-6 text-[#94A3B8] text-body-sm leading-relaxed">
            <h2 className="text-heading-lg font-bold text-white">Host Agreement</h2>
            <p className="text-caption text-[#64748B]">Last updated: January 1, 2024</p>

            <div className="space-y-4">
              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">1. Eligibility</h3>
                <p>
                  To become a Host, you must be at least 18 years old and have the legal capacity to enter into binding agreements.
                  You must provide accurate identification and contact information.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">2. Host Responsibilities</h3>
                <p>
                  Hosts must provide accurate and complete descriptions of their experiences.
                  Hosts must honor all confirmed bookings and deliver experiences as described.
                  Hosts are responsible for obtaining all necessary permits, licenses, and insurance.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">3. Pricing and Fees</h3>
                <p>
                  Hosts set their own prices for experiences. Experio charges a platform fee of 15% on each transaction.
                  This fee is deducted from Host payouts automatically. Hosts are responsible for applicable taxes.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">4. Payouts</h3>
                <p>
                  Payouts are processed within 7 business days of experience completion.
                  Hosts must have a valid bank account or mobile money account in their registered country.
                  Minimum payout amount is MK 10,000.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">5. Cancellations</h3>
                <p>
                  Hosts set their own cancellation policies (flexible, moderate, strict).
                  Experio may impose penalties for excessive cancellations or no-shows.
                  Guests may cancel according to the Host&apos;s cancellation policy for a full or partial refund.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">6. Quality Standards</h3>
                <p>
                  Hosts must maintain high quality standards as measured by guest ratings and reviews.
                  Consistently low ratings may result in reduced visibility or suspension from the platform.
                  Hosts must respond to booking requests within 24 hours.
                </p>
              </section>

              <section>
                <h3 className="text-heading-sm font-bold text-white mb-2">7. Termination</h3>
                <p>
                  Either party may terminate this agreement with 30 days written notice.
                  Experio may terminate immediately for violation of these terms, fraudulent activity, or conduct that harms the platform or other users.
                </p>
              </section>
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-caption text-[#64748B]">
          Questions about our legal policies?{" "}
          <a href="/partner/menu/help" className="text-[#FF0F73] hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}