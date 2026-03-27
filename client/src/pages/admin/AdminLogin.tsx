import React, { useState } from "react";
import { useLocation } from "wouter";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MotionDiv, MotionPage } from "@/components/motion/PageMotion";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextPath = (() => {
    try {
      const next = new URLSearchParams(window.location.search).get("next");
      if (next && next.startsWith("/") && !next.startsWith("//")) return next;
    } catch {
      /* ignore */
    }
    return "/admin/dashboard";
  })();

  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-3xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="Admin" title="Sign in" className="mb-10" />

        <MotionDiv delay={0.04}>
          <PremiumCard className="bg-white border border-charcoal/10">
          <form
            className="grid grid-cols-1 gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              try {
                const res = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, password }),
                });
                const json = await res.json().catch(() => null);
                if (!res.ok) {
                  const msg = json?.error ?? "Login failed";
                  setError(msg);
                  toast({
                    title: "Login failed",
                    description: msg,
                    variant: "destructive",
                  });
                  return;
                }
                setLocation(nextPath);
              } catch (e) {
                const msg = "Login failed";
                setError(msg);
                toast({
                  title: "Login failed",
                  description: msg,
                  variant: "destructive",
                });
              } finally {
                setLoading(false);
              }
            }}
            aria-busy={loading}
          >
            <div className="space-y-2">
              <label htmlFor="admin-email" className="font-body text-sm text-charcoal">
                Email
              </label>
              <Input
                id="admin-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="muadh@sunnahskills.com"
                type="email"
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p role="alert" className="font-body text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="pt-2">
              <ClayButton
                type="submit"
                className="w-full px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </ClayButton>
            </div>
          </form>
          </PremiumCard>
        </MotionDiv>
      </main>
    </MotionPage>
  );
}
