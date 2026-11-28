"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, GraduationCap, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { href: "/notices", label: "Notices", icon: Bell },
  { href: "/admission", label: "Admission", icon: GraduationCap, primary: true },
  { href: "/contact", label: "Contact", icon: Phone },
];

/** Thumb-reach quick actions on phones; hidden on desktop. */
export function MobileActionBar() {
  const path = usePathname();
  return (
    <nav
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy-950/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {actions.map(({ href, label, icon: Icon, primary }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                  active ? "text-gold-400" : primary ? "text-gold-500" : "text-white/80"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
