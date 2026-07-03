import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.1] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-2">
            <Logo size="md" showTagline />
            <p className="text-body-sm text-[#CBD5E1] mt-4 max-w-xs leading-relaxed">
              Discover, book, gift and enjoy unforgettable real-life experiences curated for every mood and occasion across Malawi.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://instagram.com/experio"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#111827] border border-white/[0.1] flex items-center justify-center text-[#94A3B8] hover:text-white hover:border-white/[0.2] transition-all"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 2.25h-9A5.25 5.25 0 002.25 7.5v9a5.25 5.25 0 005.25 5.25h9a5.25 5.25 0 005.25-5.25v-9A5.25 5.25 0 0016.5 2.25zM12 8.25a3.75 3.75 0 110 7.5 3.75 3.75 0 010-7.5z" /></svg>
              </a>
              <a
                href="https://twitter.com/experio"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#111827] border border-white/[0.1] flex items-center justify-center text-[#94A3B8] hover:text-white hover:border-white/[0.2] transition-all"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
              </a>
              <a
                href="https://facebook.com/experio"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#111827] border border-white/[0.1] flex items-center justify-center text-[#94A3B8] hover:text-white hover:border-white/[0.2] transition-all"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-body-sm mb-4">Explore</h4>
            <ul className="space-y-2.5 text-body-sm text-[#CBD5E1]">
              <li><Link href="/" className="hover:text-white transition-colors duration-200">Discover</Link></li>
              <li><Link href="/gift" className="hover:text-white transition-colors duration-200">Gift Cards</Link></li>
              <li><Link href="/saved" className="hover:text-white transition-colors duration-200">Saved</Link></li>
              <li><Link href="/bookings" className="hover:text-white transition-colors duration-200">Bookings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-body-sm mb-4">For Partners</h4>
            <ul className="space-y-2.5 text-body-sm text-[#CBD5E1]">
              <li><Link href="/profile" className="hover:text-white transition-colors duration-200">Partner Dashboard</Link></li>
              <li><Link href="/partner/list-experience" className="hover:text-white transition-colors duration-200">List Your Experience</Link></li>
              <li><Link href="/partner/resources" className="hover:text-white transition-colors duration-200">Partner Resources</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-body-sm mb-4">Support</h4>
            <ul className="space-y-2.5 text-body-sm text-[#CBD5E1]">
              <li><Link href="/help" className="hover:text-white transition-colors duration-200">Help Center</Link></li>
              <li><Link href="/safety" className="hover:text-white transition-colors duration-200">Safety</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors duration-200">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.1] flex flex-col sm:flex-row items-center justify-between gap-4 text-caption text-[#94A3B8]">
          <p>&copy; {new Date().getFullYear()} Experio. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <span className="text-[#FF0F73]">♥</span> in Malawi
          </p>
        </div>
      </div>
    </footer>
  );
}
