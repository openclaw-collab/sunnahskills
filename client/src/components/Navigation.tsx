import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClayButton } from "./brand/ClayButton";

const navSections = [
  // Use real SPA paths so navigation works from any route.
  { label: "Schedule", href: "/schedule" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const programLinks = [
  { label: "Brazilian Jiu-Jitsu", href: "/programs/bjj" },
  { label: "Traditional Archery", href: "/programs/archery" },
  { label: "Outdoor Workshops", href: "/programs/outdoor" },
  { label: "Bullyproofing Workshops", href: "/programs/bullyproofing" },
];

const REGISTER_HREF = "/register";

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isHome = location === "/";
  const useLightSurface = scrolled || !isHome;

  const navClasses = cn(
    "fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500",
    "rounded-full px-6 py-3 flex items-center justify-between w-[90%] max-w-5xl",
    useLightSurface
      ? "bg-white/80 backdrop-blur-md text-charcoal border border-charcoal/10 shadow-sm"
      : "bg-charcoal/25 backdrop-blur-md text-cream border border-cream/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)]",
  );

  return (
    <nav className={navClasses} data-studio-component="nav" data-studio-label="Navigation">
      <Link href="/">
        <button className="flex items-center gap-2 focus-visible:outline-none">
          <span className="font-mono-label text-xs uppercase tracking-[0.18em]">
            Sunnah Skills
          </span>
        </button>
      </Link>

      <div className="hidden md:flex items-center gap-8 font-sans text-[11px] tracking-[0.18em] uppercase">
        <div className="relative group">
          <div className="flex items-center gap-1">
            <Link href="/programs">
              <a className="hover:opacity-70 transition-opacity">Programs</a>
            </Link>
            <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
          </div>

          <div
            role="menu"
            className={cn(
              "pointer-events-none opacity-0 translate-y-1 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-150 absolute left-0 mt-3 w-[320px] rounded-3xl border shadow-2xl overflow-hidden",
              useLightSurface
                ? "bg-white text-charcoal border-charcoal/10"
                : "bg-charcoal/95 text-cream border-cream/10",
            )}
          >
            <div
              className={cn(
                "px-5 py-4 border-b font-mono-label text-[10px] uppercase tracking-[0.18em]",
                useLightSurface ? "border-charcoal/10 text-charcoal/60" : "border-cream/10 text-cream/70",
              )}
            >
              Browse programs
            </div>
            <div className="p-2">
              <Link href="/programs">
                <a
                  role="menuitem"
                  className={cn(
                    "block rounded-2xl px-4 py-3 text-[11px] tracking-[0.18em] uppercase transition-colors",
                    useLightSurface ? "hover:bg-cream" : "hover:bg-cream/10",
                  )}
                >
                  All Programs
                </a>
              </Link>
              {programLinks.map((item) => (
                <Link href={item.href} key={item.href}>
                  <a
                    role="menuitem"
                    className={cn(
                      "block rounded-2xl px-4 py-3 text-[11px] tracking-[0.18em] uppercase transition-colors",
                      useLightSurface ? "hover:bg-cream" : "hover:bg-cream/10",
                    )}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {navSections.map((item) => (
          <a key={item.label} href={item.href} className="hover:opacity-70 transition-opacity">
            {item.label}
          </a>
        ))}
      </div>

      <div className="hidden md:block">
        <Link href={REGISTER_HREF}>
          <ClayButton
            className={cn(
              "text-[11px] uppercase tracking-[0.18em] px-5 py-2.5",
              useLightSurface ? "bg-charcoal text-cream" : "bg-clay text-cream",
            )}
          >
            Register Now
          </ClayButton>
        </Link>
      </div>

      {/* Mobile toggle */}
      <button
        className={cn(
          "md:hidden inline-flex items-center justify-center rounded-full p-2",
          scrolled ? "border border-charcoal/15 text-charcoal" : "border border-cream/30 text-cream",
        )}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen && (
        <div className="absolute top-full mt-3 left-0 right-0 rounded-3xl bg-charcoal/95 text-cream border border-cream/10 shadow-xl md:hidden">
          <div className="flex flex-col gap-3 px-4 py-4 text-xs uppercase tracking-[0.18em]">
            <div className="py-1.5 border-b border-cream/5">
              <Link href="/programs">
                <a className="mb-2 block">Programs</a>
              </Link>
              <div className="space-y-1">
                {programLinks.map((item) => (
                  <Link href={item.href} key={item.href}>
                    <a
                      className="block text-[11px] text-cream/80"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </a>
                  </Link>
                ))}
              </div>
            </div>

            {navSections.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="py-1.5 border-b border-cream/5 last:border-0"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link href={REGISTER_HREF}>
              <ClayButton className="w-full mt-1 text-[11px] tracking-[0.18em]">
                Register Now
              </ClayButton>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
