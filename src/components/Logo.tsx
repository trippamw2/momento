import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizes = {
  sm: { logo: "text-lg", tagline: "text-[10px]" },
  md: { logo: "text-2xl", tagline: "text-xs" },
  lg: { logo: "text-4xl", tagline: "text-sm" },
};

export default function Logo({ size = "md", showTagline = false }: LogoProps) {
  const s = sizes[size];

  return (
    <Link href="/" className="flex flex-col items-start">
      <span className={`${s.logo} font-serif font-bold leading-none tracking-tight`}>
        <span className="gradient-text">M</span>
        <span className="text-white">OMENTO</span>
      </span>
      {showTagline && (
        <span className={`${s.tagline} text-text-secondary tracking-widest uppercase mt-0.5`}>
          Live The Moment
        </span>
      )}
    </Link>
  );
}
