import HostSidebar from "./components/HostSidebar";

export const metadata = {
  title: "Partner Dashboard — Experio",
  description: "Manage your experiences, bookings, and host profile on Experio.",
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05070B]">
      <HostSidebar />
      <div className="pl-[72px] md:pl-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-[#05070B]/95 backdrop-blur-xl border-b border-white/[0.06] h-16 flex items-center px-4 md:px-8">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <h1 className="text-heading-sm font-bold text-white hidden md:block">Partner Dashboard</h1>
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <a
                href="https://airbnb.com/help"
                target="_blank"
                rel="noopener noreferrer"
                className="text-body-sm text-[#64748B] hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Help</span>
              </a>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
