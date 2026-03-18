import { Link } from "wouter";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";

export default function NotFound() {
  return (
    <div className="bg-cream min-h-[80vh] pb-24">
      <div className="noise-overlay" />
      <main className="max-w-5xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="404" title="Page not found" className="mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <PremiumCard className="bg-white border border-charcoal/10">
            <p className="font-body text-sm text-charcoal/70 leading-relaxed">
              The route you requested doesn’t exist (or the site was updated). Use the links below to get back to the
              curriculum.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/">
                <ClayButton className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                  Return home
                </ClayButton>
              </Link>
              <Link href="/programs">
                <button className="px-7 py-3.5 rounded-full border border-charcoal/15 text-charcoal text-[11px] uppercase tracking-[0.18em] hover:bg-charcoal/5 transition-colors">
                  Browse programs
                </button>
              </Link>
            </div>
          </PremiumCard>

          <DarkCard>
            <div className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em] mb-4">
              System status
            </div>
            <div className="text-cream/70 font-body text-sm leading-relaxed">
              If you reached this page from a saved link, try refreshing after deployment. SPA deep-links are handled
              via Cloudflare Pages redirects.
            </div>
          </DarkCard>
        </div>
      </main>
    </div>
  );
}
