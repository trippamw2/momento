import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizeClasses = {
  sm: "h-5",
  md: "h-7",
  lg: "h-10",
};

export default function Logo({ size = "md", showTagline = false }: LogoProps) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <Image
        src="/experio-logo.svg"
        alt="Experio"
        width={120}
        height={36}
        className={`w-auto ${sizeClasses[size]} transition-transform duration-300 group-hover:scale-105`}
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