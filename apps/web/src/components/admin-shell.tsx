"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ADMIN_NAV, type AdminNavGroup } from "@/lib/admin-nav";
import { LogOut, GraduationCap, Loader2, ChevronDown, Menu, X, Clock3 } from "lucide-react";

function isGroupActive(group: AdminNavGroup, pathname: string): boolean {
  if (group.href) return pathname === group.href || pathname.startsWith(group.href + "/");
  return (group.children || []).some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
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
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${indent ? "pl-9" : ""} ${
        active ? "bg-academic text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="flex-1 truncate">{label}</span>
      {comingSoon && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-gold-light">
          <Clock3 className="h-2.5 w-2.5" />
          Soon
        </span>
      )}
    </Link>
  );
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of ADMIN_NAV) {
      if (group.children) initial[group.label] = isGroupActive(group, pathname);
    }
    return initial;
  });

  const toggleGroup = (label: string) => setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
      {ADMIN_NAV.map((group) => {
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
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
                active ? "text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white"
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
        <GraduationCap className="h-5 w-5 text-gold" />
        <div>
          <div className="font-display text-sm font-bold leading-tight">Nalanda Cloud</div>
          <div className="text-[10px] uppercase tracking-widest text-gold">Admin Portal</div>
        </div>
      </div>
      <AdminNav onNavigate={onNavigate} />
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
  const authorized = !!user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN");

  useEffect(() => {
    if (!loading && user && !authorized) {
      logout();
    }
  }, [loading, user, authorized, logout]);

  if (loading || !user || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <Loader2 className="h-6 w-6 animate-spin text-academic" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-navy text-white md:flex">
        <SidebarContents />
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
            <SidebarContents onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
