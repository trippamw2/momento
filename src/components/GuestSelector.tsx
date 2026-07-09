export default function GuestSelector({ value, onChange, maxGuests }: { value: number; onChange: (v: number) => void; maxGuests: number }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#111827] border border-white/[0.1]">
      <span className="text-body-sm text-white font-medium">Guests</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
        </button>
        <span className="w-6 text-center text-body font-semibold text-white">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          disabled={value >= maxGuests}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
    </div>
  );
}
