"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        <h1 className="text-display-sm font-bold text-[#222222] mb-2">Terms of Service</h1>
        <p className="text-[#929292] text-body-sm mb-8">Last updated: June 23, 2026</p>

        <div className="prose-custom space-y-6 text-[#6a6a6a] text-body-sm leading-relaxed">
          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Experio (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">2. Description of Service</h2>
            <p>
              Experio is a marketplace that connects people with curated experiences. We facilitate bookings, payments, and communication between experience hosts and guests but are not a party to the experience itself.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to create an account. All information you provide must be accurate and current.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">4. Bookings & Payments</h2>
            <p>
              All bookings are subject to availability. Prices are displayed in Malawi Kwacha (MK) and include applicable taxes unless stated otherwise. Payment is due at the time of booking. Experio uses third-party payment processors and does not store full payment card details.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">5. Cancellations & Refunds</h2>
            <p>
              Cancellations made more than 48 hours before the experience start time are eligible for a full refund. Cancellations within 48 hours are non-refundable. Hosts may set their own cancellation policies for certain experiences, which will be clearly displayed at checkout.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">6. Host Obligations</h2>
            <p>
              Hosts agree to provide experiences as described, maintain appropriate licenses and insurance, and comply with all applicable laws. Experio reserves the right to remove listings that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">7. Prohibited Conduct</h2>
            <p>
              Users agree not to: use the Platform for any unlawful purpose, harass or harm others, submit false information, manipulate reviews, or engage in any activity that disrupts the Platform or community.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">8. Limitation of Liability</h2>
            <p>
              Experio provides the Platform on an &quot;as is&quot; basis. To the maximum extent permitted by law, Experio disclaims all warranties and shall not be liable for any damages arising from your use of the Platform or any experience booked through it.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">9. Changes to Terms</h2>
            <p>
              We may update these terms at any time. Continued use of the Platform after changes constitutes acceptance of the new terms. We will notify users of material changes via email or Platform notice.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">10. Contact</h2>
            <p>
              For questions about these terms, contact us at <a href="mailto:legal@experio.life" className="text-[#DD2A7B] hover:underline">legal@experio.life</a>.
            </p>
          </section>
        </div>

        <div className="mt-10 text-center">
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
