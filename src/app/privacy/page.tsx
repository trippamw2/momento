"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        <h1 className="text-display-sm font-bold text-[#222222] mb-2">Privacy Policy</h1>
        <p className="text-[#929292] text-body-sm mb-8">Last updated: June 23, 2026</p>

        <div className="space-y-6 text-[#6a6a6a] text-body-sm leading-relaxed">
          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide when creating an account, making a booking, or contacting support. This includes your name, email address, phone number, payment information, and preferences. We also automatically collect certain technical data such as IP address, browser type, and usage patterns.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">2. How We Use Your Information</h2>
            <p>
              We use your information to: process bookings and payments, personalize your experience, send booking confirmations and reminders, improve our Platform, and communicate with you about updates and promotions (with your consent).
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">3. Data Sharing</h2>
            <p>
              We share necessary information with experience hosts to fulfill your booking (name, guest count, special requests). We do not sell your personal data to third parties. Payment information is processed by our secure payment partners and is not stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">4. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit and at rest, regular security audits, and strict access controls. However, no method of electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">5. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data at any time. You can manage your data through your account settings or by contacting us. You may also opt out of marketing communications at any time.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">6. Cookies</h2>
            <p>
              We use essential cookies to operate the Platform and optional analytics cookies to improve your experience. You can manage cookie preferences in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">7. Third-Party Services</h2>
            <p>
              Our Platform may contain links to third-party websites or services. We are not responsible for their privacy practices. We encourage you to review their privacy policies before providing any personal data.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. Material changes will be communicated via email or Platform notice.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-bold text-[#222222] mb-3">9. Contact</h2>
            <p>
              For privacy-related inquiries, contact us at <a href="mailto:privacy@experio.life" className="text-[#DD2A7B] hover:underline">privacy@experio.life</a>.
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
