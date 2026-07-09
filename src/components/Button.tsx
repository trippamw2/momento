import Link from "next/link";

interface ButtonBaseProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}

interface ButtonAsButton extends ButtonBaseProps {
  href?: undefined;
  onClick?: () => void;
  type?: "button" | "submit";
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string;
  onClick?: undefined;
  type?: undefined;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles = {
  primary:
    "bg-gradient-to-r from-brand-hot-pink to-brand-sunset-orange text-white font-semibold hover:shadow-brand-glow active:opacity-90",
  secondary:
    "bg-white/10 text-white font-semibold hover:bg-white/15 active:bg-white/20 border border-border-default",
  outline:
    "border border-white/20 text-white font-semibold hover:bg-white/5 active:bg-white/10",
  ghost:
    "text-text-secondary font-medium hover:text-white hover:bg-white/5 active:bg-white/10",
  glass:
    "glass text-white font-semibold hover:bg-white/[0.08] active:bg-white/[0.12]",
};

const sizeStyles = {
  sm: "px-4 py-2 text-xs rounded-lg gap-1.5",
  md: "px-6 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-8 py-3.5 text-base rounded-xl gap-2.5",
};

export default function Button(props: ButtonProps) {
  const { children, variant = "primary", size = "md", fullWidth, className = "" } = props;

  const base =
    "inline-flex items-center justify-center font-medium transition-all duration-300 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-brand-hot-pink focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const classes = `${base} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`;

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      className={classes}
    >
      {children}
    </button>
  );
}
