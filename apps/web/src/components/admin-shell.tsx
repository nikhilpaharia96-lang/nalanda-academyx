"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { navForRole, isAccountantPathAllowed, type AdminNavGroup } from "@/lib/admin-nav";
import { LogOut, Loader2, ChevronDown, Menu, X, Clock3 } from "lucide-react";

function isGroupActive(group: AdminNavGroup, pathname: string): boolean {
  if (group.href) return pathname === group.href || pathname.startsWith(group.href + "/");
  return (group.children || []).some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
}

const BOTTOM_TAB_LABELS = ["Dashboard", "Students", "Fees & Payments", "Attendance"];

/** Title for the top bar: the nav leaf (or group) whose href best matches the current path. */
function titleForPath(groups: AdminNavGroup[], pathname: string): string {
  let best: { label: string; len: number } | null = null;
  const consider = (href: string | undefined, label: string) => {
    if (!href) return;
    if ((pathname === href || pathname.startsWith(href + "/")) && (!best || href.length > best.len)) best = { label, len: href.length };
  };
  for (const g of groups) {
    consider(g.href, g.label);
    for (const c of g.children ?? []) consider(c.href, c.label);
  }
  return (best as { label: string } | null)?.label ?? "Admin Portal";
}

function initials(email: string) {
  return (email.split("@")[0].split(/[._-]/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "A");
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  comingSoon,
  indent,
  onNavigate,
}: {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  active: boolean;
  comingSoon?: boolean;
  indent?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${indent ? "pl-9" : ""} ${
        active ? "bg-white text-portal-dark shadow-sm" : "text-blue-100 hover:bg-white/10 hover:text-white"
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="flex-1 truncate">{label}</span>
      {comingSoon && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-blue-100">
          <Clock3 className="h-2.5 w-2.5" />
          Soon
        </span>
      )}
    </Link>
  );
}

function AdminNav({ onNavigate, groups }: { onNavigate?: () => void; groups: AdminNavGroup[] }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of groups) {
      if (group.children) initial[group.label] = isGroupActive(group, pathname);
    }
    return initial;
  });

  const toggleGroup = (label: string) => setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
      {groups.map((group) => {
        const Icon = group.icon;
        const active = isGroupActive(group, pathname);

        // Single-link item (no children) — e.g. Dashboard, Attendance, Parents.
        if (!group.children) {
          return (
            <NavLink
              key={group.label}
              href={group.href!}
              label={group.label}
              icon={Icon}
              active={active}
              comingSoon={group.comingSoon}
              onNavigate={onNavigate}
            />
          );
        }

        // Group with a collapsible list of children — e.g. Students, Teachers, Fees & Payments.
        const isOpen = openGroups[group.label] ?? active;
        return (
          <div key={group.label}>
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              aria-expanded={isOpen}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                active ? "bg-white/10 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{group.label}</span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="mt-1 space-y-1">
                {group.children.map((child) => {
                  const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
                  return (
                    <NavLink
                      key={child.href}
                      href={child.href}
                      label={child.label}
                      icon={child.icon}
                      active={childActive}
                      comingSoon={child.comingSoon}
                      indent
                      onNavigate={onNavigate}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarContents({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  return (
    <>
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <Image src="/images/brand/nalanda-academy-logo.webp" alt="Nalanda Academy" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
        <div>
          <div className="font-display text-sm font-bold leading-tight text-white">Nalanda Cloud</div>
          <div className="text-[10px] uppercase tracking-widest text-blue-200">{user?.role === "ACCOUNTANT" ? "Accounts Portal" : "Admin Portal"}</div>
        </div>
      </div>
      <AdminNav onNavigate={onNavigate} groups={navForRole(user?.role)} />
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 truncate px-2 text-xs text-blue-200">{user?.email}</div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-blue-100 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
  }, [loading, user, router]);

  // Admin/Super-admin only — matches the API's @Roles("SUPER_ADMIN","ADMIN") guard on
  // every /dashboard/admin* route, so a signed-in Teacher/Student/Parent (e.g. after
  // switching accounts in another tab) never sees the admin shell flash before their
  // API calls start failing with 403s.
  // Accountants may use the shell too, but only for the money screens (see isAccountantPathAllowed).
  const authorized = !!user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "ACCOUNTANT");
  const pathname = usePathname();
  useEffect(() => setMobileOpen(false), [pathname]);
  const blockedForAccountant = user?.role === "ACCOUNTANT" && !isAccountantPathAllowed(pathname);

  useEffect(() => {
    if (!loading && blockedForAccountant) router.replace("/admin/fees");
  }, [loading, blockedForAccountant, router]);

  useEffect(() => {
    if (!loading && user && !authorized) {
      logout();
    }
  }, [loading, user, authorized, logout]);

  if (loading || !user || !authorized || blockedForAccountant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-6 w-6 animate-spin text-portal" />
      </div>
    );
  }

  const groups = navForRole(user.role);
  const pageTitle = titleForPath(groups, pathname);
  const tabs = BOTTOM_TAB_LABELS.map((label) => groups.find((g) => g.label === label))
    .filter((g): g is AdminNavGroup => !!g)
    .map((g) => ({ label: g.label === "Fees & Payments" ? "Fees" : g.label, icon: g.icon, href: g.href ?? g.children![0].href, group: g }));

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-portal-dark md:flex">
        <SidebarContents />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-lg p-1.5 text-portal-dark hover:bg-slate-100 md:hidden">
            <Menu className="h-6 w-6" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="hidden text-[10px] font-semibold uppercase tracking-widest text-portal md:block">{user.role === "ACCOUNTANT" ? "Accounts Portal" : "Admin Portal"}</p>
            <h2 className="truncate font-display text-lg font-bold text-portal-dark sm:text-xl">{pageTitle}</h2>
          </div>
          <span title={user.email} className="flex h-10 w-10 items-center justify-center rounded-full bg-portal text-sm font-bold text-white ring-2 ring-portal-soft">
            {initials(user.email)}
          </span>
        </header>

        <main className="flex-1 pb-24 md:pb-0">{children}</main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex bg-portal-dark text-blue-200 md:hidden" aria-label="Primary">
        {tabs.map((t) => {
          const active = isGroupActive(t.group, pathname);
          const Icon = t.icon;
          return (
            <Link
              key={t.label}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`m-1 flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium ${active ? "bg-portal-soft text-portal-dark" : ""}`}
            >
              <Icon className="h-5 w-5" />
              {t.label}
            </Link>
          );
        })}
        <button onClick={() => setMobileOpen(true)} className="m-1 flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium">
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </nav>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-portal-dark shadow-xl">
            <div className="flex items-center justify-end px-3 pt-3">
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-blue-100 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContents onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}
