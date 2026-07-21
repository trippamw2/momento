import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizeClasses = {
  sm: "h-4 sm:h-5",
  md: "h-6 sm:h-7",
  lg: "h-8 sm:h-10",
};

export default function Logo({ size = "md", showTagline = false }: LogoProps) {
  return (
    <Link href="/" className="flex items-center group">
      <Image
        src="/experio-logo.png"
        alt="Momento"
        width={1280}
        height={683}
        className={`w-auto ${sizeClasses[size]} transition-transform duration-300 group-hover:scale-105 object-contain`}
        priority
      />
    </Link>
  );
}