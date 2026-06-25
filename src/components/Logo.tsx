import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizes = {
  sm: { icon: "w-7 h-7", logo: "text-lg", tagline: "text-[10px]" },
  md: { icon: "w-9 h-9", logo: "text-2xl", tagline: "text-xs" },
  lg: { icon: "w-12 h-12", logo: "text-4xl", tagline: "text-sm" },
};

function HeartIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="heart-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF2D7A" />
          <stop offset="100%" stopColor="#FF7A18" />
        </linearGradient>
      </defs>
      <path
        d="M16 28C16 28 3 20 3 10.5C3 5.5 6.5 3 10 3C13 3 16 6 16 6C16 6 19 3 22 3C25.5 3 29 5.5 29 10.5C29 20 16 28 16 28Z"
        fill="url(#heart-grad)"
      />
      <path
        d="M16 26.5C16 26.5 4.5 19 4.5 10.5C4.5 6 7.5 4 10.5 4C13.5 4 16 7 16 7C16 7 18.5 4 21.5 4C24.5 4 27.5 6 27.5 10.5C27.5 19 16 26.5 16 26.5Z"
        fill="url(#heart-grad)"
        opacity="0.3"
      />
      <path
        d="M11 13C11 13 13.5 10.5 16 13C18.5 10.5 21 13 21 13"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

export default function Logo({ size = "md", showTagline = false }: LogoProps) {
  const s = sizes[size];

  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <HeartIcon className={`${s.icon} transition-transform duration-300 group-hover:scale-105`} />
      <div className="flex flex-col">
        <span className={`${s.logo} font-serif font-bold leading-none tracking-tight`}>
          <span className="bg-gradient-to-r from-[#FF2D7A] to-[#FF7A18] bg-clip-text text-transparent">E</span>
          <span className="text-white">XPERIO</span>
        </span>
        {showTagline && (
          <span className={`${s.tagline} text-[#94A3B8] tracking-[0.15em] uppercase mt-0.5`}>
            LIVE THE MOMENT
          </span>
        )}
      </div>
    </Link>
  );
}