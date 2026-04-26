import React from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, LogOut, LayoutDashboard, ClipboardList, Wallet, BadgePercent, Gift, Tags, CalendarRange, Inbox, ScrollText, Users, Download } from "lucide-react";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { cn } from "@/lib/utils";

export type AdminPermissionLevel = "none" | "read" | "write";
export type AdminPermissionKey =
  | "dashboard"
  | "registrations"
  | "payments"
  | "discounts"
  | "offers"
  | "pricing"
  | "sessions"
  | "contacts"
  | "sequences"
  | "exports"
  | "users";

export type AdminPermissions = Record<AdminPermissionKey, AdminPermissionLevel>;

export type AdminUser = {
  email: string;
  name: string | null;
  role: "tech" | "admin" | string;
  permissions?: Partial<AdminPermissions> | null;
};

export type AdminSection =
  | "overview"
  | "registrations"
  | "trials"
  | "payments"
  | "discounts"
  | "offers"
  | "pricing"
  | "sessions"
  | "contacts"
  | "sequences"
  | "users"
  | "export";

type NavItem = {
  id: AdminSection;
  label: string;
  href: string;
  hint: string;
  permission: AdminPermissionKey;
  required?: Extract<AdminPermissionLevel, "read" | "write">;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/admin/dashboard",
    hint: "Live academy metrics",
    permission: "dashboard",
    required: "read",
    icon: <LayoutDashboard size={15} />,
  },
  {
    id: "registrations",
    label: "Registrations",
    href: "/admin/dashboard/registrations",
    hint: "Families and student records",
    permission: "registrations",
    required: "read",
    icon: <ClipboardList size={15} />,
  },
  {
    id: "trials",
    label: "Trials",
    href: "/admin/dashboard/trials",
    hint: "Free trial bookings and QR verification",
    permission: "registrations",
    required: "read",
    icon: <ClipboardList size={15} />,
  },
  {
    id: "payments",
    label: "Payments",
    href: "/admin/dashboard/payments",
    hint: "Charges and payment status",
    permission: "payments",
    required: "read",
    icon: <Wallet size={15} />,
  },
  {
    id: "discounts",
    label: "Discounts",
    href: "/admin/dashboard/discounts",
    hint: "Promo and family offers",
    permission: "discounts",
    required: "read",
    icon: <BadgePercent size={15} />,
  },
  {
    id: "offers",
    label: "Offers",
    href: "/admin/dashboard/offers",
    hint: "Program offers and private access codes",
    permission: "offers",
    required: "read",
    icon: <Gift size={15} />,
  },
  {
    id: "pricing",
    label: "Pricing",
    href: "/admin/dashboard/pricing",
    hint: "Programs and Stripe price ids",
    permission: "pricing",
    required: "read",
    icon: <Tags size={15} />,
  },
  {
    id: "sessions",
    label: "Sessions",
    href: "/admin/dashboard/sessions",
    hint: "Capacity and visibility",
    permission: "sessions",
    required: "read",
    icon: <CalendarRange size={15} />,
  },
  {
    id: "contacts",
    label: "Contacts",
    href: "/admin/dashboard/contacts",
    hint: "Incoming parent enquiries",
    permission: "contacts",
    required: "read",
    icon: <Inbox size={15} />,
  },
  {
    id: "sequences",
    label: "Sequences",
    href: "/admin/sequences",
    hint: "Technique curation and publishing",
    permission: "sequences",
    required: "read",
    icon: <ScrollText size={15} />,
  },
  {
    id: "users",
    label: "Users",
    href: "/admin/users",
    hint: "Staff access and activity",
    permission: "users",
    required: "read",
    icon: <Users size={15} />,
  },
  {
    id: "export",
    label: "Export",
    href: "/admin/dashboard/export",
    hint: "Download CSV snapshots",
    permission: "exports",
    required: "read",
    icon: <Download size={15} />,
  },
];

export function hasAdminAccess(
  user: AdminUser | null | undefined,
  key: AdminPermissionKey,
  required: "read" | "write" = "read",
) {
  if (!user) return false;
  if (user.role === "tech") return true;
  // Legacy admin accounts: full access when no granular permissions are stored
  if (
    user.role === "admin" &&
    (user.permissions == null || Object.keys(user.permissions).length === 0)
  ) {
    return true;
  }
  const level = user.permissions?.[key] ?? "none";
  if (required === "read") return level === "read" || level === "write";
  return level === "write";
}

export function getVisibleAdminNav(user: AdminUser | null | undefined) {
  return NAV_ITEMS.filter((item) => hasAdminAccess(user, item.permission, item.required ?? "read"));
}

export function AdminShell({
  title,
  eyebrow = "Admin",
  currentSection,
  user,
  summary,
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  currentSection: AdminSection;
  user: AdminUser;
  summary?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [, setLocation] = useLocation();
  const visibleNav = getVisibleAdminNav(user);

  return (
    <div className="min-h-screen bg-cream pb-24">
      <div className="noise-overlay" />
      <main className="mx-auto max-w-7xl px-6 pt-28">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <Link
              href="/"
              className="font-mono-label text-[11px] uppercase tracking-[0.2em] text-charcoal/55 transition-colors hover:text-moss"
            >
              Sunnah Skills
            </Link>
            <SectionHeader eyebrow={eyebrow} title={title} className="mt-3" />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="rounded-full border border-moss/20 bg-white/90 px-4 py-2 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-moss/10 text-moss">
                  <ShieldCheck size={16} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm text-charcoal">{user.name ?? user.email}</div>
                  <div className="truncate font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">
                    {user.role} access
                  </div>
                </div>
              </div>
            </div>

            {actions}

            <ClayButton
              className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                setLocation("/admin");
              }}
            >
              <span className="inline-flex items-center gap-2">
                <LogOut size={14} />
                Sign out
              </span>
            </ClayButton>
          </div>
        </div>

        <PremiumCard className="mb-6 border border-charcoal/10 bg-white/95 p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.22em] text-moss">
                  Sunnah Skills Operations
                </div>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
                  {summary ??
                    "Keep registrations, pricing, sessions, sequences, and staff access in one calm operating space."}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-charcoal/10 bg-cream/60 px-4 py-3 text-sm text-charcoal/70">
                Signed in as <span className="font-medium text-charcoal">{user.email}</span>
              </div>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2">
                {visibleNav.map((item) => {
                  const active = item.id === currentSection;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group block min-w-[168px] rounded-[1.4rem] border px-4 py-3 text-left transition-all",
                        active
                          ? "border-moss/30 bg-moss/10 shadow-sm"
                          : "border-charcoal/10 bg-cream/45 hover:border-moss/20 hover:bg-white",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                            active
                              ? "border-moss/25 bg-moss/15 text-moss"
                              : "border-charcoal/10 bg-white/80 text-charcoal/50 group-hover:text-moss",
                          )}
                        >
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm text-charcoal">{item.label}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-charcoal/50">
                            {item.hint}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </PremiumCard>

        {children}
      </main>
    </div>
  );
}
