import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CalendarDays, DollarSign, Download, ShieldCheck, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { TelemetryCard } from "@/components/brand/TelemetryCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { RegistrationsTable } from "@/components/admin/RegistrationsTable";
import { RegistrationDetail } from "@/components/admin/RegistrationDetail";
import { PaymentsSummary } from "@/components/admin/PaymentsSummary";
import { DiscountsManager } from "@/components/admin/DiscountsManager";
import { PricingManager } from "@/components/admin/PricingManager";
import { SessionManager } from "@/components/admin/SessionManager";
import { ContactsTable } from "@/components/admin/ContactsTable";
import { AdminShell, type AdminPermissionKey, type AdminSection, type AdminUser, hasAdminAccess } from "@/components/admin/AdminShell";
import { adminSequencesEnabled } from "@/lib/featureFlags";

type AdminMeResponse = { ok: true; user: AdminUser } | { ok: false };

type RegistrationRow = {
  registration_id: number;
  registration_status: string;
  created_at: string;
  program_name: string;
  program_slug: string;
  guardian_name: string;
  guardian_email: string;
  student_name: string;
  payment_status: string | null;
  payment_amount: number | null;
};

type PaymentRow = {
  order_id: number;
  order_status: string;
  manual_review_status: string;
  manual_review_reason: string | null;
  last_payment_error: string | null;
  last_payment_attempt_at: string | null;
  total_cents: number;
  amount_due_today_cents: number;
  later_amount_cents: number;
  later_payment_date: string | null;
  guardian_name: string | null;
  guardian_email: string | null;
  registration_count: number;
  student_names: string | null;
  paid_cents: number | null;
  latest_payment_status: string | null;
  first_registration_id: number | null;
  created_at: string;
};

type DashboardResponse = {
  metrics?: {
    registrations?: {
      total?: number | string | null;
      active?: number | string | null;
      pending_payment?: number | string | null;
      waitlisted?: number | string | null;
    };
    payments?: {
      total?: number | string | null;
      paid_revenue?: number | string | null;
      pending_revenue?: number | string | null;
    };
    contacts?: {
      total?: number | string | null;
    };
    sessions?: {
      total_sessions?: number | string | null;
      active_capacity?: number | string | null;
      enrolled_total?: number | string | null;
    };
    users?: {
      total_users?: number | string | null;
      tech_users?: number | string | null;
      active_users?: number | string | null;
    };
  };
  activity?: Array<{
    action: string;
    entity_type: string;
    created_at: string | null;
  }>;
};

type DashboardTab =
  | "overview"
  | "registrations"
  | "payments"
  | "discounts"
  | "pricing"
  | "sessions"
  | "contacts"
  | "export";

type DashboardTabConfig = {
  value: DashboardTab;
  label: string;
  permission: AdminPermissionKey;
  required?: "read" | "write";
};

const DASHBOARD_TABS: DashboardTabConfig[] = [
  { value: "overview", label: "Overview", permission: "dashboard", required: "read" },
  { value: "registrations", label: "Registrations", permission: "registrations", required: "read" },
  { value: "payments", label: "Payments", permission: "payments", required: "read" },
  { value: "discounts", label: "Discounts", permission: "discounts", required: "read" },
  { value: "pricing", label: "Pricing", permission: "pricing", required: "read" },
  { value: "sessions", label: "Sessions", permission: "sessions", required: "read" },
  { value: "contacts", label: "Contacts", permission: "contacts", required: "read" },
  { value: "export", label: "Export", permission: "exports", required: "read" },
];

function money(amountCents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function numberValue(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Just now";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAction(action: string, entityType: string) {
  return `${action.replace(/\./g, " ")} • ${entityType.replace(/_/g, " ")}`;
}

function dashboardPath(tab: DashboardTab) {
  return tab === "overview" ? "/admin/dashboard" : `/admin/dashboard/${tab}`;
}

function getTabFromLocation(location: string): DashboardTab {
  const pathOnly = location.split("?")[0];
  const pathMatch = pathOnly.match(/^\/admin\/dashboard\/([^/?#]+)/);
  const pathTab = pathMatch?.[1];
  if (
    pathTab === "registrations" ||
    pathTab === "payments" ||
    pathTab === "discounts" ||
    pathTab === "pricing" ||
    pathTab === "sessions" ||
    pathTab === "contacts" ||
    pathTab === "export"
  ) {
    return pathTab;
  }

  const searchSource = location.includes("?")
    ? location.split("?")[1]
    : typeof window !== "undefined"
      ? window.location.search.replace(/^\?/, "")
      : "";
  const params = new URLSearchParams(searchSource);
  const tab = params.get("tab");
  if (
    tab === "registrations" ||
    tab === "payments" ||
    tab === "discounts" ||
    tab === "pricing" ||
    tab === "sessions" ||
    tab === "contacts" ||
    tab === "export"
  ) {
    return tab;
  }
  return "overview";
}

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const [me, setMe] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const activeTab = useMemo(() => getTabFromLocation(location), [location]);

  const allowedTabs = useMemo(() => {
    if (!me) return [];
    return DASHBOARD_TABS.filter((tab) => hasAdminAccess(me, tab.permission, tab.required ?? "read"));
  }, [me]);

  const loadAdminDataForUser = useCallback(async (activeUser: AdminUser) => {
    setRefreshing(true);
    try {
      const requests: Array<Promise<Response>> = [];
      const parsers: Array<(payload: unknown) => void> = [];

      if (hasAdminAccess(activeUser, "dashboard", "read")) {
        requests.push(fetch("/api/admin/dashboard"));
        parsers.push((payload) => setDashboard((payload as DashboardResponse | null) ?? null));
      }

      if (hasAdminAccess(activeUser, "registrations", "read")) {
        requests.push(fetch("/api/admin/registrations"));
        parsers.push((payload) =>
          setRegistrations(((payload as { registrations?: RegistrationRow[] } | null)?.registrations ?? []) as RegistrationRow[]),
        );
      }

      if (hasAdminAccess(activeUser, "payments", "read")) {
        requests.push(fetch("/api/admin/orders"));
        parsers.push((payload) =>
          setPayments(((payload as { orders?: PaymentRow[] } | null)?.orders ?? []) as PaymentRow[]),
        );
      }

      const responses = await Promise.all(requests);
      const payloads = await Promise.all(responses.map((response) => response.json().catch(() => null)));
      payloads.forEach((payload, index) => {
        if (responses[index]?.ok) {
          parsers[index]?.(payload);
        }
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const refreshAdminData = useCallback(async () => {
    if (!me) return;
    await loadAdminDataForUser(me);
  }, [loadAdminDataForUser, me]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        const json = (await res.json().catch(() => null)) as AdminMeResponse | null;
        if (!res.ok || !json || json.ok === false) {
          setLocation("/admin");
          return;
        }
        if (cancelled) return;
        setMe(json.user);
        await loadAdminDataForUser(json.user);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAdminDataForUser, setLocation]);

  useEffect(() => {
    if (!me || allowedTabs.length === 0) return;
    if (allowedTabs.some((tab) => tab.value === activeTab)) return;
    const fallback = allowedTabs[0]?.value ?? "overview";
    setLocation(dashboardPath(fallback));
  }, [activeTab, allowedTabs, me, setLocation]);

  if (loading || !me) {
    return (
      <div className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-7xl px-6 pt-28">
          <PremiumCard className="bg-white border border-charcoal/10">
            <div className="text-sm text-charcoal/70">Loading dashboard…</div>
          </PremiumCard>
        </main>
      </div>
    );
  }

  const metrics = dashboard?.metrics;
  const registrationsTotal = numberValue(metrics?.registrations?.total);
  const activeRegistrations = numberValue(metrics?.registrations?.active);
  const pendingRegistrations = numberValue(metrics?.registrations?.pending_payment);
  const waitlistedRegistrations = numberValue(metrics?.registrations?.waitlisted);
  const paidRevenue = numberValue(metrics?.payments?.paid_revenue);
  const pendingRevenue = numberValue(metrics?.payments?.pending_revenue);
  const contactsTotal = numberValue(metrics?.contacts?.total);
  const sessionsTotal = numberValue(metrics?.sessions?.total_sessions);
  const sessionCapacity = numberValue(metrics?.sessions?.active_capacity);
  const enrolledTotal = numberValue(metrics?.sessions?.enrolled_total);
  const totalUsers = numberValue(metrics?.users?.total_users);
  const techUsers = numberValue(metrics?.users?.tech_users);
  const activeUsers = numberValue(metrics?.users?.active_users);

  const summary = adminSequencesEnabled
    ? `Live registration, payment, session, and staff data for the academy. Use the tabs below to move between daily operations, then jump straight into sequences or user management from the same rail.`
    : `Live registration, payment, session, and staff data for the academy. Use the tabs below to move between daily operations and user management from the same rail.`;

  return (
    <AdminShell
      title="Dashboard"
      eyebrow="Admin"
      currentSection={(activeTab === "overview" ? "overview" : activeTab) as AdminSection}
      user={me}
      summary={summary}
      actions={
        <OutlineButton
          className="px-5 py-3 text-[11px] uppercase tracking-[0.18em]"
          onClick={() => refreshAdminData()}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh data"}
        </OutlineButton>
      }
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const next = value as DashboardTab;
          setLocation(dashboardPath(next));
        }}
      >
        <div className="mb-6 overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max gap-1 rounded-[1.4rem] border border-charcoal/10 bg-white/90 p-1.5">
            {allowedTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-[1rem] px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] data-[state=active]:bg-moss/10 data-[state=active]:text-charcoal"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TelemetryCard title="Registrations" label="live total" icon={<Users size={18} />}>
              <div className="text-3xl font-heading text-charcoal">{registrationsTotal}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-charcoal/60">
                <span>{activeRegistrations} active</span>
                <span>{pendingRegistrations} pending payment</span>
                <span>{waitlistedRegistrations} waitlisted</span>
              </div>
            </TelemetryCard>
            <TelemetryCard title="Revenue" label="stripe paid" icon={<DollarSign size={18} />}>
              <div className="text-3xl font-heading text-charcoal">{money(paidRevenue)}</div>
              <div className="mt-2 text-xs text-charcoal/60">{money(pendingRevenue)} still pending</div>
            </TelemetryCard>
            <TelemetryCard title="Sessions" label="enrollment" icon={<CalendarDays size={18} />}>
              <div className="text-3xl font-heading text-charcoal">{enrolledTotal}</div>
              <div className="mt-2 text-xs text-charcoal/60">
                {sessionsTotal} visible sessions across {sessionCapacity} capacity
              </div>
            </TelemetryCard>
            <TelemetryCard title="Staff Access" label="admin users" icon={<ShieldCheck size={18} />}>
              <div className="text-3xl font-heading text-charcoal">{activeUsers}</div>
              <div className="mt-2 text-xs text-charcoal/60">
                {totalUsers} total staff users, {techUsers} tech-level account
              </div>
            </TelemetryCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <PremiumCard className="bg-white border border-charcoal/10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                    Operations Snapshot
                  </div>
                  <h3 className="mt-2 font-heading text-2xl text-charcoal">What needs attention today</h3>
                </div>
                <div className="rounded-[1.25rem] border border-charcoal/10 bg-cream/60 px-4 py-3 text-sm text-charcoal/70">
                  {contactsTotal} unread-style contact messages available for review
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.8rem] border border-charcoal/10 bg-cream/55 p-5">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">
                    Registration Queue
                  </div>
                  <div className="mt-3 text-sm leading-relaxed text-charcoal/75">
                    {pendingRegistrations > 0
                      ? `${pendingRegistrations} registrations are still waiting on payment confirmation.`
                      : "No registrations are waiting on payment right now."}
                  </div>
                  <OutlineButton
                    className="mt-4 px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
                    onClick={() => setLocation(dashboardPath("registrations"))}
                  >
                    Review registrations
                  </OutlineButton>
                </div>

                {adminSequencesEnabled ? (
                  <div className="rounded-[1.8rem] border border-charcoal/10 bg-cream/55 p-5">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">
                      Library Curation
                    </div>
                    <div className="mt-3 text-sm leading-relaxed text-charcoal/75">
                      Manage public technique sequencing, preview transitions, and publish new curation directly to the live techniques library.
                    </div>
                    <ClayButton
                      className="mt-4 px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
                      onClick={() => setLocation("/admin/sequences")}
                    >
                      Open sequence builder
                    </ClayButton>
                  </div>
                ) : null}

                <div className="rounded-[1.8rem] border border-charcoal/10 bg-cream/55 p-5">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">
                    Parent Enquiries
                  </div>
                  <div className="mt-3 text-sm leading-relaxed text-charcoal/75">
                    {contactsTotal > 0
                      ? `${contactsTotal} contact submissions are stored in the dashboard for follow-up.`
                      : "No new parent enquiries are waiting in the inbox."}
                  </div>
                  <OutlineButton
                    className="mt-4 px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
                    onClick={() => setLocation(dashboardPath("contacts"))}
                  >
                    Open contacts
                  </OutlineButton>
                </div>

                <div className="rounded-[1.8rem] border border-charcoal/10 bg-cream/55 p-5">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">
                    Staff Access
                  </div>
                  <div className="mt-3 text-sm leading-relaxed text-charcoal/75">
                    Review staff roles, last login information, and permission levels from one place.
                  </div>
                  <ClayButton
                    className="mt-4 px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
                    onClick={() => setLocation("/admin/users")}
                  >
                    Open user management
                  </ClayButton>
                </div>
              </div>
            </PremiumCard>

            <PremiumCard className="bg-white border border-charcoal/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                    Recent Activity
                  </div>
                  <h3 className="mt-2 font-heading text-2xl text-charcoal">Latest admin actions</h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {(dashboard?.activity ?? []).length === 0 ? (
                  <div className="rounded-[1.6rem] border border-dashed border-charcoal/15 bg-cream/45 p-5 text-sm text-charcoal/60">
                    No recent admin activity has been logged yet.
                  </div>
                ) : (
                  (dashboard?.activity ?? []).map((item, index) => (
                    <div
                      key={`${item.action}-${item.created_at}-${index}`}
                      className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-charcoal/10 bg-cream/45 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-charcoal">{formatAction(item.action, item.entity_type)}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-charcoal/50">
                          Activity log entry
                        </div>
                      </div>
                      <div className="shrink-0 text-xs text-charcoal/55">{formatDateTime(item.created_at)}</div>
                    </div>
                  ))
                )}
              </div>
            </PremiumCard>
          </div>
        </TabsContent>

        <TabsContent value="registrations">
          <RegistrationsTable
            initial={registrations}
            onOpen={(id) => {
              setDetailId(id);
              setDetailOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsSummary payments={payments} />
        </TabsContent>

        <TabsContent value="discounts">
          <DiscountsManager />
        </TabsContent>

        <TabsContent value="pricing">
          <PricingManager />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionManager />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsTable />
        </TabsContent>

        <TabsContent value="export">
          <PremiumCard className="bg-white border border-charcoal/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Export</div>
                <h3 className="mt-2 font-heading text-2xl text-charcoal">Registration CSV</h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal/70">
                  Download the current registration ledger as a CSV for reporting, reconciliation, or offline review with your team.
                </p>
              </div>
              <a href="/api/admin/export">
                <ClayButton className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                  <span className="inline-flex items-center gap-2">
                    <Download size={14} />
                    Download CSV
                  </span>
                </ClayButton>
              </a>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.6rem] border border-charcoal/10 bg-cream/55 p-4">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Rows ready</div>
                <div className="mt-2 text-2xl font-heading text-charcoal">{registrationsTotal}</div>
              </div>
              <div className="rounded-[1.6rem] border border-charcoal/10 bg-cream/55 p-4">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Paid revenue</div>
                <div className="mt-2 text-2xl font-heading text-charcoal">{money(paidRevenue)}</div>
              </div>
              <div className="rounded-[1.6rem] border border-charcoal/10 bg-cream/55 p-4">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Contact records</div>
                <div className="mt-2 text-2xl font-heading text-charcoal">{contactsTotal}</div>
              </div>
            </div>
          </PremiumCard>
        </TabsContent>
      </Tabs>

      <RegistrationDetail
        registrationId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={async () => {
          await refreshAdminData();
        }}
      />
    </AdminShell>
  );
}
