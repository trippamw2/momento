"use client";

import { useState } from "react";

// ─── Card Color Variants ───
export const GIFT_CARD_VARIANTS = [
  {
    id: "midnight",
    label: "Midnight Black",
    gradient: "from-gray-900 via-gray-800 to-gray-900",
    accent: "from-gray-600 to-gray-500",
    textColor: "text-white",
    textColorSecondary: "text-gray-300",
    chipColor: "from-yellow-300 to-yellow-500",
    badgeBg: "bg-white/10",
  },
  {
    id: "rose-gold",
    label: "Rose Gold",
    gradient: "from-rose-300 via-rose-400 to-pink-400",
    accent: "from-rose-200 to-pink-300",
    textColor: "text-white",
    textColorSecondary: "text-rose-50",
    chipColor: "from-yellow-200 to-yellow-400",
    badgeBg: "bg-white/20",
  },
  {
    id: "platinum",
    label: "Platinum",
    gradient: "from-slate-100 via-gray-50 to-slate-200",
    accent: "from-slate-300 to-slate-400",
    textColor: "text-gray-800",
    textColorSecondary: "text-gray-500",
    chipColor: "from-yellow-400 to-amber-500",
    badgeBg: "bg-black/5",
  },
  {
    id: "gold",
    label: "Gold",
    gradient: "from-amber-400 via-yellow-400 to-amber-500",
    accent: "from-amber-300 to-yellow-300",
    textColor: "text-white",
    textColorSecondary: "text-amber-50",
    chipColor: "from-yellow-200 to-yellow-400",
    badgeBg: "bg-white/20",
  },
  {
    id: "signature",
    label: "Experio Signature",
    gradient: "from-[#DD2A7B] via-[#e00b41] to-[#F58529]",
    accent: "from-[#ff6b81] to-[#ff9055]",
    textColor: "text-white",
    textColorSecondary: "text-white/80",
    chipColor: "from-yellow-200 to-yellow-400",
    badgeBg: "bg-white/15",
  },
  {
    id: "ocean",
    label: "Ocean Blue",
    gradient: "from-blue-700 via-blue-600 to-cyan-600",
    accent: "from-blue-400 to-cyan-400",
    textColor: "text-white",
    textColorSecondary: "text-blue-100",
    chipColor: "from-yellow-200 to-yellow-400",
    badgeBg: "bg-white/10",
  },
] as const;

export type GiftCardVariantId = (typeof GIFT_CARD_VARIANTS)[number]["id"];

interface GiftCardProps {
  valueLabel: string;
  description: string;
  variantId: GiftCardVariantId;
  selected: boolean;
  onSelect: () => void;
  isCompact?: boolean;
  cardNumber?: string;
  expiry?: string;
  holderName?: string;
}

export default function GiftCard({
  valueLabel,
  description,
  variantId,
  selected,
  onSelect,
  isCompact = false,
  cardNumber = "•••• •••• •••• 4829",
  expiry = "12/27",
  holderName = "Your Gift",
}: GiftCardProps) {
  const [flipped, setFlipped] = useState(false);
  const variant = GIFT_CARD_VARIANTS.find((v) => v.id === variantId) || GIFT_CARD_VARIANTS[0];

  if (isCompact) {
    return (
      <button
        onClick={onSelect}
        className={`relative w-full text-left transition-all duration-300 perspective-[1000px] ${
          selected ? "scale-[1.02]" : "hover:scale-[1.02]"
        }`}
      >
        <div
          className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${variant.gradient} ${
            selected ? "ring-2 ring-white/30 shadow-xl" : "shadow-md"
          }`}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/[0.06] rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.1)_0%,transparent_60%)]" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-5 rounded bg-gradient-to-br ${variant.chipColor} shadow-inner`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${variant.textColorSecondary}`}>
                  Experio
                </span>
              </div>
            </div>
            <p className={`text-lg font-bold ${variant.textColor} mb-1`}>{valueLabel}</p>
            <p className={`text-[10px] ${variant.textColorSecondary} line-clamp-1`}>{description}</p>
          </div>

          {selected && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center z-10 backdrop-blur-sm">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left transition-all duration-500 perspective-[1000px] group ${
        selected ? "scale-[1.02]" : ""
      }`}
      onMouseEnter={() => setFlipped(false)}
    >
      {/* 3D Card Container */}
      <div
        className={`relative w-full overflow-hidden rounded-2xl transition-all duration-500 preserve-3d ${
          selected
            ? "ring-2 ring-white/30 shadow-2xl"
            : "shadow-lg group-hover:shadow-xl group-hover:rotate-y-[-5deg]"
        }`}
        style={{ minHeight: isCompact ? "auto" : "200px" }}
      >
        {/* Card Front */}
        <div
          className={`relative w-full bg-gradient-to-br ${variant.gradient} p-5 sm:p-6`}
          style={{ aspectRatio: "1.586 / 1", minHeight: isCompact ? "auto" : "200px" }}
        >
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.05] rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-black/[0.04] rounded-full translate-y-1/3 -translate-x-1/3" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
          <div className="absolute bottom-4 right-4 w-16 h-16 bg-white/[0.03] rounded-full" />

          {/* Card content */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            {/* Top: Chip + Brand */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <div className={`w-10 h-7 rounded bg-gradient-to-br ${variant.chipColor} shadow-inner`} />
                <div className="flex -space-x-1.5">
                  <div className={`w-6 h-4 rounded border ${variant.textColor.includes("white") ? "border-white/30" : "border-gray-400"}`} />
                  <div className={`w-6 h-4 rounded border ${variant.textColor.includes("white") ? "border-white/30" : "border-gray-400"}`} />
                </div>
              </div>
              <div className="text-right">
                <p className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${variant.textColorSecondary}`}>Experio</p>
                <p className={`text-[8px] ${variant.textColorSecondary} opacity-70`}>Gift Card</p>
              </div>
            </div>

            {/* Middle: Card Number */}
            <div className="mt-2">
              <p className={`text-sm sm:text-base md:text-lg tracking-[0.2em] font-mono font-medium ${variant.textColor}`}>
                {cardNumber}
              </p>
            </div>

            {/* Bottom: Expiry + Holder */}
            <div className="flex items-end justify-between mt-2">
              <div>
                <p className={`text-[9px] uppercase tracking-wider ${variant.textColorSecondary} opacity-70`}>Valid Thru</p>
                <p className={`text-sm font-mono font-medium ${variant.textColor}`}>{expiry}</p>
              </div>
              <div className="text-right">
                <p className={`text-[9px] uppercase tracking-wider ${variant.textColorSecondary} opacity-70`}>Card Holder</p>
                <p className={`text-sm font-medium ${variant.textColor}`}>{holderName}</p>
              </div>
            </div>
          </div>

          {/* Selection checkmark */}
          {selected && (
            <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center z-10 backdrop-blur-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
          )}
        </div>
      </div>

      {/* Value Label Below */}
      <div className="mt-3">
        <p className={`text-heading-sm font-bold ${variant.textColor.includes("white") ? "text-[#222222]" : "text-[#222222]"}`}>
          {valueLabel}
        </p>
        <p className="text-caption text-[#6a6a6a] mt-0.5">{description}</p>
      </div>
    </button>
  );
}
