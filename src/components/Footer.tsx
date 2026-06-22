import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" showTagline />
          </div>
          <div>
            <h4 className="text-text-primary font-semibold text-body-sm mb-4">Explore</h4>
            <ul className="space-y-2.5 text-body-sm text-text-secondary">
              <li>
                <Link href="/experiences" className="hover:text-text-primary transition-colors duration-200">
                  All Experiences
                </Link>
              </li>
              <li>
                <Link href="/gift" className="hover:text-text-primary transition-colors duration-200">
                  Gift Cards
                </Link>
              </li>
              <li>
                <Link href="/saved" className="hover:text-text-primary transition-colors duration-200">
                  Saved
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-text-primary font-semibold text-body-sm mb-4">Company</h4>
            <ul className="space-y-2.5 text-body-sm text-text-secondary">
              <li>
                <a href="#" className="hover:text-text-primary transition-colors duration-200">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text-primary transition-colors duration-200">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text-primary transition-colors duration-200">
                  Press
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-text-primary font-semibold text-body-sm mb-4">Support</h4>
            <ul className="space-y-2.5 text-body-sm text-text-secondary">
              <li>
                <a href="#" className="hover:text-text-primary transition-colors duration-200">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text-primary transition-colors duration-200">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text-primary transition-colors duration-200">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-caption text-text-tertiary">
          <p>&copy; {new Date().getFullYear()} Momento. All rights reserved.</p>
          <p>Live The Moment.</p>
        </div>
      </div>
    </footer>
  );
}
