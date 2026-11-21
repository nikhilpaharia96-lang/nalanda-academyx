"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Bell, Menu, LogOut, Loader2, X } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function initials(name: string) {
  return name
    .replace("(DEMO) ", "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** Mobile-app style shell shared by the student and teacher portals: white
 * top bar, bottom tab bar and a slide-in drawer with the full menu. On
 * desktop the full menu is a blue sidebar. */
export function MobileShell({
  children,
  navItems,
  loginPath,
  allowedRoles,
  portalLabel,
  bottomNav,
  profileHref,
  profileEndpoint,
  notificationsHref,
}: {
  bottomNav: NavItem[];
  profileHref: string;
  /** API path prefix returning `{ name }` for the signed-in profile, e.g. "/students" */
  profileEndpoint: string;
  /** Omit to hide the bell (portals without a notifications page). */
  notificationsHref?: string;
  children: React.ReactNode;
  navItems: NavItem[];
  loginPath: string;
  allowedRoles: string[];
  portalLabel: string;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (loading) return;
    if (!user || !allowedRoles.includes(user.role)) router.replace(loginPath);
  }, [loading, user, router, loginPath, allowedRoles]);

  useEffect(() => {
    if (!user?.profileId) return;
    api.get<{ name: string }>(`${profileEndpoint}/${user.profileId}`).then((p) => setName(p.name)).catch(() => {});
  }, [user?.profileId, profileEndpoint]);

  useEffect(() => setDrawerOpen(false), [pathname]);

  if (loading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-6 w-6 animate-spin text-portal" />
      </div>
    );
  }

  const avatar = (
    <Link
      href={profileHref}
      aria-label="Profile"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-portal text-sm font-bold text-white ring-2 ring-portal-soft"
    >
      {initials(name || user.email) || "S"}
    </Link>
  );

  const menu = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-white text-portal-dark shadow-sm" : "text-blue-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2 px-5 py-5">
      <Image src="/images/brand/nalanda-academy-logo.webp" alt="Nalanda Academy" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
      <div>
        <div className="font-display text-sm font-bold leading-tight text-white">Nalanda Cloud</div>
        <div className="text-[10px] uppercase tracking-widest text-blue-200">{portalLabel}</div>
      </div>
    </div>
  );

  const signOut = (
    <div className="border-t border-white/10 p-3">
      <div className="mb-2 truncate px-2 text-xs text-blue-200">{user.email}</div>
      <button
        onClick={() => logout()}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-blue-100 transition hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-portal-dark md:flex">
        {brand}
        {menu}
        {signOut}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-portal-dark hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="flex-1 font-display text-lg font-bold text-portal-dark sm:text-xl">{portalLabel}</h1>
          {notificationsHref && (
            <Link href={notificationsHref} aria-label="Notifications" className="rounded-full p-2 text-portal-dark hover:bg-slate-100">
              <Bell className="h-5 w-5" />
            </Link>
          )}
          {avatar}
        </header>

        <main className="flex-1 pb-24 md:pb-8">{children}</main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex bg-portal-dark text-blue-200 md:hidden" aria-label="Primary">
        {bottomNav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active ? "text-white" : ""}`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button onClick={() => setDrawerOpen(true)} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium">
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </nav>

      {/* Drawer (mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-portal-dark shadow-xl">
            <div className="flex items-center justify-between">
              {brand}
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="mr-3 rounded-lg p-1.5 text-blue-100 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            {menu}
            {signOut}
          </aside>
        </div>
      )}
    </div>
  );
}
