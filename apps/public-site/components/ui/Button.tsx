import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-navy-950 text-white hover:bg-blue-600 shadow-[var(--shadow-sm)]",
  secondary:
    "bg-transparent text-navy-950 border border-navy-950/20 hover:border-navy-950 hover:bg-navy-950 hover:text-white",
  ghost: "bg-transparent text-navy-950 hover:text-blue-600",
};

interface ButtonProps {
  href?: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  withArrow?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function Button({
  href,
  variant = "primary",
  className,
  children,
  withArrow,
  onClick,
  type = "button",
  disabled,
}: ButtonProps) {
  const classes = cn(base, variants[variant], disabled && "opacity-60 pointer-events-none", className);

  const content = (
    <>
      {children}
      {withArrow && <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(classes, "group")}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn(classes, "group")}>
      {content}
    </button>
  );
}
