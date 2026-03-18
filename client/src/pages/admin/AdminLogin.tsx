import React, { useState } from "react";
import { useLocation } from "wouter";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-3xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="Admin" title="Sign in" className="mb-10" />

        <PremiumCard className="bg-white border border-charcoal/10">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label htmlFor="admin-email" className="font-body text-sm text-charcoal">
                Email
              </label>
              <Input
                id="admin-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sunnahskills.com"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="font-body text-sm text-charcoal">
                Password
              </label>
              <Input
                id="admin-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
              />
            </div>

            <div className="pt-2">
              <ClayButton
                className="w-full px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch("/api/auth/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, password }),
                    });
                    const json = await res.json().catch(() => null);
                    if (!res.ok) {
                      throw new Error(json?.error ?? "Login failed");
                    }
                    setLocation("/admin/dashboard");
                  } catch (e) {
                    toast({
                      title: "Login failed",
                      description: e instanceof Error ? e.message : "Login failed",
                      variant: "destructive",
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </ClayButton>
            </div>
          </div>
        </PremiumCard>
      </main>
    </div>
  );
}

