import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizes = {
  sm: { logo: "h-7", tagline: "text-[10px]" },
  md: { logo: "h-9", tagline: "text-xs" },
  lg: { logo: "h-12", tagline: "text-sm" },
};

export default function Logo({ size = "md", showTagline = false }: LogoProps) {
  const s = sizes[size];

  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <Image
        src="/experio-logo.png"
        alt="Experio"
        width={0}
        height={0}
        className={`${s.logo} w-auto transition-transform duration-300 group-hover:scale-105`}
        priority
        unoptimized
      />
      {showTagline && (
        <span className={`${s.tagline} text-[#94A3B8] tracking-[0.15em] uppercase mt-0.5 hidden sm:block`}>
          LIVE THE MOMENT
        </span>
      )}
    </Link>
  );
}
