import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f6]">
      <div className="text-center px-4">
        <div className="text-[120px] leading-none font-bold bg-gradient-to-br from-[#ff385c] to-[#FF7A18] bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-heading-xl font-bold text-[#222222] mb-2">Lost your way?</h1>
        <p className="text-[#6a6a6a] text-body mb-8 max-w-md mx-auto">
          This page doesn&apos;t exist. But don&apos;t worry — there are plenty of experiences waiting to be discovered.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff385c] to-[#FF7A18] text-white font-semibold text-body-sm hover:shadow-[0_4px_16px_rgba(255,56,92,0.3)] transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/experiences"
            className="px-6 py-3 rounded-xl bg-white text-[#222222] font-semibold text-body-sm border border-[#dddddd] hover:bg-[#f7f7f7] transition-all"
          >
            Browse Experiences
          </Link>
        </div>
      </div>
    </div>
  );
}
