import Link from "next/link";

interface Props {
  title: string;
  bookedDate: string;
  guests: number;
  totalPrice: number;
  earnedPoints: number;
  tierUpgrade: string | null;
}

export default function BookingConfirmed({ title, bookedDate, guests, totalPrice, earnedPoints, tierUpgrade }: Props) {
  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center bg-[#05070B]">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 rounded-full bg-[#FF0F73] flex items-center justify-center mx-auto mb-6 shadow-[0_4px_16px_rgba(255, 15, 115, 0.2)]">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-display-sm font-bold text-white mb-3">Booking Confirmed!</h1>
        <p className="text-[#CBD5E1] text-body-lg mb-2">{title}</p>
        <p className="text-body-sm text-[#94A3B8] mb-1">{bookedDate} · {guests} guest{guests > 1 ? "s" : ""}</p>
        <p className="text-heading-md font-bold text-white mb-8">MK {totalPrice.toLocaleString()}</p>
        {earnedPoints > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#FF0F73]/10 to-[#FF7A1A]/10 border border-[#FF0F73]/20">
            <p className="text-body-sm font-bold text-[#F1F5F9] mb-1">
              🎉 You earned {earnedPoints.toLocaleString()} points!
            </p>
            {tierUpgrade ? (
              <p className="text-caption text-emerald-400 font-medium">
                🎊 You&apos;ve been upgraded to {tierUpgrade}!
              </p>
            ) : (
              <p className="text-caption text-[#CBD5E1]">
                Keep booking to unlock more rewards and higher tiers.
              </p>
            )}
          </div>
        )}
        <p className="text-caption text-[#94A3B8] mb-6">Check your email for the full confirmation and receipt.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/bookings" className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF0F73] to-[#FF7A1A] text-white font-semibold text-body-sm hover:shadow-[0_4px_24px_rgba(255, 15, 115, 0.25)] transition-all">
            View My Bookings
          </Link>
          <Link href="/loyalty" className="px-8 py-3 rounded-xl bg-[#111827] text-white font-semibold text-body-sm border border-white/[0.1] hover:bg-white/5 transition-all">
            View Rewards
          </Link>
          <Link href="/" className="px-8 py-3 rounded-xl bg-[#111827] text-white font-semibold text-body-sm border border-white/[0.1] hover:bg-white/5 transition-all">
            Discover More
          </Link>
        </div>
      </div>
    </div>
  );
}
