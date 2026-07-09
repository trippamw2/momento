"use client";

import { useState } from "react";

// â”€â”€â”€ Card Color Variants â”€â”€â”€
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
    glowColor: "rgba(255,255,255,0.08)",
    chipBorder: "border-white/20",
  },
  {
    id: "rose-gold",
    label: "Rose Gold",
    gradient: "from-rose-400 via-rose-500 to-pink-500",
    accent: "from-rose-300 to-pink-400",
    textColor: "text-white",
    textColorSecondary: "text-rose-50",
    chipColor: "from-yellow-200 to-yellow-400",
    badgeBg: "bg-white/20",
    glowColor: "rgba(244,114,182,0.2)",
    chipBorder: "border-rose-300/30",
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
    glowColor: "rgba(148,163,184,0.15)",
    chipBorder: "border-slate-300",
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
    glowColor: "rgba(251,191,36,0.25)",
    chipBorder: "border-amber-200/30",
  },
  {
    id: "signature",
    label: "Experio Signature",
    gradient: "from-[#FF0F73] via-[#FF5B3A] to-[#FFA22C]",
    accent: "from-[#FF0F73] to-[#FF7A1A]",
    textColor: "text-white",
    textColorSecondary: "text-white/80",
    chipColor: "from-yellow-200 to-yellow-400",
    badgeBg: "bg-white/15",
    glowColor: "rgba(255,15,115,0.25)",
    chipBorder: "border-white/20",
  },
  {
    id: "ocean",
    label: "Ocean Blue",
    gradient: "from-blue-800 via-blue-700 to-cyan-600",
    accent: "from-blue-400 to-cyan-400",
    textColor: "text-white",
    textColorSecondary: "text-blue-100",
    chipColor: "from-yellow-200 to-yellow-400",
    badgeBg: "bg-white/10",
    glowColor: "rgba(59,130,246,0.2)",
    chipBorder: "border-blue-300/20",
  },
] as const;

export type GiftCardVariantId = (typeof GIFT_CARD_VARIANTS)[number]["id"];
type Variant = (typeof GIFT_CARD_VARIANTS)[number];

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

function DecorativeGlow({ variant }: { variant: Variant }) {
  return (
    <div
      className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-60 blur-2xl pointer-events-none"
      style={{ background: variant.glowColor }}
    />
  );
}

function GlassCircle({ className, size }: { className?: string; size: number }) {
  return (
    <div
      className={`absolute rounded-full backdrop-blur-sm bg-white/[0.04] border border-white/[0.06] ${className || ""}`}
      style={{ width: size, height: size }}
    />
  );
}

function CardChip({ variant }: { variant: Variant }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`w-9 h-6 rounded bg-gradient-to-br ${variant.chipColor} shadow-inner border ${variant.chipBorder}`} />
      <div className="flex -space-x-1">
        <div className={`w-5 h-3.5 rounded border ${variant.chipBorder}`} />
        <div className={`w-5 h-3.5 rounded border ${variant.chipBorder}`} />
      </div>
    </div>
  );
}

function SelectedBadge() {
  return (
    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center z-20 backdrop-blur-md border border-white/20 shadow-lg">
      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

export default function GiftCard({
  valueLabel,
  description,
  variantId,
  selected,
  onSelect,
  isCompact = false,
  cardNumber = "â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ 4829",
  expiry = "12/27",
  holderName = "Your Gift",
}: GiftCardProps) {
  const [flipped, setFlipped] = useState(false);
  const variant = GIFT_CARD_VARIANTS.find((v) => v.id === variantId) || GIFT_CARD_VARIANTS[0];

  // â”€â”€â”€ Compact Mode (for smaller grid cards) â”€â”€â”€
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
            selected
              ? "ring-2 ring-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              : "shadow-md"
          }`}
        >
          {/* Glass decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/[0.06] rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
          <DecorativeGlow variant={variant} />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-4.5 rounded bg-gradient-to-br ${variant.chipColor} shadow-inner`} />
                <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${variant.textColorSecondary}`}>
                  Experio
                </span>
              </div>
            </div>
            <p className={`text-lg font-bold ${variant.textColor} mb-0.5`}>{valueLabel}</p>
            <p className={`text-[10px] ${variant.textColorSecondary} line-clamp-1`}>{description}</p>
          </div>

          {selected && <SelectedBadge />}
        </div>
      </button>
    );
  }

  // â”€â”€â”€ Full Card Mode (premium credit-card style) â”€â”€â”€
  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left transition-all duration-500 perspective-[1000px] group ${
        selected ? "scale-[1.02]" : ""
      }`}
      onMouseEnter={() => setFlipped(false)}
    >
      {/* Outer glow ring when selected */}
      {selected && (
        <div
          className="absolute -inset-[3px] rounded-2xl opacity-70 blur-md transition-all duration-500"
          style={{
            background: `linear-gradient(135deg, ${variant.glowColor.replace("0.08", "0.4")}, ${variant.glowColor.replace("0.08", "0.1")})`,
          }}
        />
      )}

      {/* 3D Card Container */}
      <div
        className={`relative w-full overflow-hidden rounded-2xl transition-all duration-500 preserve-3d ${
          selected
            ? "ring-2 ring-white/40 shadow-[0_0_30px_rgba(255,255,255,0.08)]"
            : "shadow-lg group-hover:shadow-xl group-hover:rotate-y-[-5deg]"
        }`}
        style={{ minHeight: isCompact ? "auto" : "200px" }}
      >
        {/* Card Front */}
        <div
          className={`relative w-full bg-gradient-to-br ${variant.gradient} p-5 sm:p-6`}
          style={{ aspectRatio: "1.586 / 1", minHeight: isCompact ? "auto" : "200px" }}
        >
          {/* Base decorative elements */}
          <GlassCircle size={120} className="-top-10 -right-10" />
          <GlassCircle size={80} className="-bottom-6 -left-6" />
          <GlassCircle size={60} className="bottom-8 right-8" />

          {/* Radial light sweep */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />

          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: "40px 40px",
            }}
          />

          <DecorativeGlow variant={variant} />

          {/* Card content */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            {/* Top: Chip + Brand */}
            <div className="flex items-start justify-between">
              <CardChip variant={variant} />
              <div className="text-right">
                <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${variant.textColorSecondary}`}>
                  Experio
                </p>
                <div className={`h-px w-full mt-0.5 mb-0.5 ${variant.textColor.includes("white") ? "bg-white/10" : "bg-black/10"}`} />
                <p className={`text-[7px] ${variant.textColorSecondary} opacity-60 uppercase tracking-[0.1em]`}>
                  Gift Card
                </p>
              </div>
            </div>

            {/* Middle: Value + Card Number area */}
            <div className="mt-2 space-y-1">
              {/* Decorative line before card number */}
              <p className={`text-sm sm:text-base md:text-lg tracking-[0.25em] font-mono font-light ${variant.textColor} opacity-90`}>
                {cardNumber}
              </p>
            </div>

            {/* Bottom: Expiry + Holder */}
            <div className="flex items-end justify-between mt-2">
              <div>
                <p className={`text-[8px] uppercase tracking-[0.15em] ${variant.textColorSecondary} opacity-50`}>
                  Valid Thru
                </p>
                <p className={`text-sm font-mono font-semibold ${variant.textColor}`}>{expiry}</p>
              </div>
              <div className="text-right">
                <p className={`text-[8px] uppercase tracking-[0.15em] ${variant.textColorSecondary} opacity-50`}>
                  Card Holder
                </p>
                <p className={`text-sm font-semibold ${variant.textColor}`}>{holderName}</p>
              </div>
            </div>
          </div>

          {/* Experio watermark */}
          <div
            className={`absolute bottom-3 right-4 text-[40px] font-bold opacity-[0.03] select-none pointer-events-none ${variant.textColor}`}
            style={{ lineHeight: 1 }}
          >
            E
          </div>

          {/* Selection indicator */}
          {selected && <SelectedBadge />}
        </div>
      </div>

      {/* Value Label Below */}
      <div className="mt-3">
        <p className="text-heading-sm font-bold text-[#F1F5F9]">{valueLabel}</p>
        <p className="text-caption text-[#CBD5E1] mt-0.5">{description}</p>
      </div>
    </button>
  );
}
