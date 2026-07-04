import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizeClasses = {
  sm: "max-w-[140px] sm:max-w-[180px]",
  md: "max-w-[200px] sm:max-w-[260px]",
  lg: "max-w-[280px] sm:max-w-[340px]",
};

export default function Logo({ size = "md", showTagline = false }: LogoProps) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <Image
        src="/experio-logo.png"
        alt="Experio"
        width={600}
        height={320}
        className={`w-full h-auto ${sizeClasses[size]} transition-transform duration-300 group-hover:scale-105`}
        priority
      />
      {showTagline && (
        <span className="text-xs sm:text-sm text-[#94A3B8] tracking-[0.15em] uppercase mt-0.5 hidden sm:block">
          Live Life.
        </span>
      )}
    </Link>
  );
}