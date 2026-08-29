"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { LogOut, GraduationCap, Loader2 } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PortalShell({
  children,
  navItems,
  loginPath,
  allowedRoles,
  portalLabel,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  loginPath: string;
  allowedRoles: string[];
  portalLabel: string;
}) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(loginPath);
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace(loginPath);
    }
  }, [loading, user, router, loginPath, allowedRoles]);

  if (loading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <Loader2 className="h-6 w-6 animate-spin text-academic" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      <aside className="flex w-56 flex-col border-r border-neutral-200 bg-navy text-white">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
          <GraduationCap className="h-5 w-5 text-gold" />
          <div>
            <div className="font-display text-sm font-bold leading-tight">Nalanda Cloud</div>
            <div className="text-[10px] uppercase tracking-widest text-gold">{portalLabel}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  active ? "bg-academic text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 px-2 text-xs text-neutral-400">{user.email}</div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
