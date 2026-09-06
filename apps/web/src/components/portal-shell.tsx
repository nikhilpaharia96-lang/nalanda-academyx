"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { LogOut, GraduationCap, Loader2, Menu, X } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Shared sidebar markup for both the always-visible desktop rail and the
 * slide-in mobile drawer — kept in one place so the two stay in sync. */
function SidebarContents({
  navItems,
  portalLabel,
  onNavigate,
}: {
  navItems: NavItem[];
  portalLabel: string;
  onNavigate?: () => void;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <GraduationCap className="h-5 w-5 text-gold" />
        <div>
          <div className="font-display text-sm font-bold leading-tight">Nalanda Cloud</div>
          <div className="text-[10px] uppercase tracking-widest text-gold">{portalLabel}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                active ? "bg-academic text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 truncate px-2 text-xs text-neutral-400">{user?.email}</div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );
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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

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
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-neutral-200 bg-navy text-white md:flex">
        <SidebarContents navItems={navItems} portalLabel={portalLabel} />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-navy px-4 py-3 text-white md:hidden">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-gold" />
          <span className="font-display text-sm font-bold">Nalanda Cloud</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-1.5 text-neutral-200 hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-navy text-white shadow-xl">
            <div className="flex items-center justify-end px-3 pt-3">
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-neutral-200 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContents navItems={navItems} portalLabel={portalLabel} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
