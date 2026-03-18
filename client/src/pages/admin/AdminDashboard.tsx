import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { RegistrationsTable } from "@/components/admin/RegistrationsTable";
import { RegistrationDetail } from "@/components/admin/RegistrationDetail";
import { PaymentsSummary } from "@/components/admin/PaymentsSummary";
import { DiscountsManager } from "@/components/admin/DiscountsManager";
import { PricingManager } from "@/components/admin/PricingManager";
import { SessionManager } from "@/components/admin/SessionManager";
import { ContactsTable } from "@/components/admin/ContactsTable";

type AdminMe = { ok: true; user: { email: string; name: string | null; role: string } } | { ok: false };

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [me, setMe] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      const json = (await res.json().catch(() => null)) as AdminMe | null;
      if (!res.ok || !json || (json as any).ok === false) {
        setLocation("/admin");
        return;
      }
      setMe(json);

      const [regRes, payRes] = await Promise.all([
        fetch("/api/admin/registrations"),
        fetch("/api/admin/payments"),
      ]);
      setRegistrations(((await regRes.json().catch(() => null)) as any)?.registrations ?? []);
      setPayments(((await payRes.json().catch(() => null)) as any)?.payments ?? []);

      setLoading(false);
    })();
  }, [setLocation]);

  if (loading) {
    return (
      <div className="bg-cream min-h-screen pb-24">
        <div className="noise-overlay" />
        <main className="max-w-6xl mx-auto px-6 pt-28">
          <SectionHeader eyebrow="Admin" title="Dashboard" className="mb-10" />
          <PremiumCard className="bg-white border border-charcoal/10">
            <div className="font-body text-sm text-charcoal/70">Loading…</div>
          </PremiumCard>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-6xl mx-auto px-6 pt-28">
        <div className="flex items-start justify-between gap-6 flex-wrap mb-10">
          <SectionHeader eyebrow="Admin" title="Dashboard" />
          <ClayButton
            className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              setLocation("/admin");
            }}
          >
            Sign out
          </ClayButton>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="discounts">Discounts</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview registrations={registrations} payments={payments} />
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
              <div className="font-body text-sm text-charcoal/70 mb-6">
                Download a CSV export of registrations.
              </div>
              <a href="/api/admin/export">
                <ClayButton className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                  Download CSV
                </ClayButton>
              </a>
            </PremiumCard>
          </TabsContent>
        </Tabs>

        <RegistrationDetail
          registrationId={detailId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onUpdated={async () => {
            const [regRes, payRes] = await Promise.all([
              fetch("/api/admin/registrations"),
              fetch("/api/admin/payments"),
            ]);
            setRegistrations(((await regRes.json().catch(() => null)) as any)?.registrations ?? []);
            setPayments(((await payRes.json().catch(() => null)) as any)?.payments ?? []);
          }}
        />
      </main>
    </div>
  );
}

