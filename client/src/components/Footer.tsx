import { Link } from "wouter";
import { ClayButton } from "./brand/ClayButton";
import { StatusDot } from "./brand/StatusDot";

const Footer = () => {
  return (
    <footer className="bg-charcoal text-cream rounded-t-[4rem] pt-24 pb-12 px-6 mt-24">
      <div className="max-w-7xl mx-auto mb-24 text-center">
        <h2 className="font-heading text-4xl md:text-6xl tracking-tight mb-10">
          Begin the Training.
        </h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/programs">
            <ClayButton className="px-8 py-4 text-[11px] uppercase tracking-[0.18em]">
              Explore Programs
            </ClayButton>
          </Link>
          <Link href="/contact">
            <button className="px-8 py-4 rounded-full border border-cream/20 text-cream text-[11px] uppercase tracking-[0.18em] hover:bg-cream/10 transition-colors">
              Contact Us
            </button>
          </Link>
          <Link href="/programs">
            <button className="px-8 py-4 rounded-full border border-transparent text-cream/70 hover:text-cream text-[11px] uppercase tracking-[0.18em] transition-colors">
              About Us
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start mb-20 gap-10 border-t border-cream/10 pt-20">
        <div className="max-w-xs">
          <div className="font-heading tracking-[0.15em] text-xl uppercase mb-6">
            Sunnah Skills
          </div>
          <p className="text-xs font-body text-cream/70 leading-relaxed">
            Building confident, skilled, and resilient young people through traditional martial arts and outdoor
            education.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <StatusDot ariaLabel="Enrollment Open" />
            <span className="font-mono-label text-[10px] text-cream/50 uppercase tracking-widest">
              Enrollment Open
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 md:gap-24 text-xs font-body text-cream/70">
          <div className="flex flex-col gap-4">
            <span className="font-mono-label uppercase text-moss tracking-wider mb-2 text-[10px]">
              Programs
            </span>
            <ul className="space-y-3">
              <li>
                <Link href="/programs/bjj" className="hover:text-cream transition-colors">
                  Brazilian Jiu-Jitsu
                </Link>
              </li>
              <li>
                <Link href="/programs/archery" className="hover:text-cream transition-colors">
                  Archery
                </Link>
              </li>
              <li>
                <Link href="/programs/outdoor" className="hover:text-cream transition-colors">
                  Outdoor Workshops
                </Link>
              </li>
              <li>
                <Link href="/programs/bullyproofing" className="hover:text-cream transition-colors">
                  Bullyproofing
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <span className="font-mono-label uppercase text-moss tracking-wider mb-2 text-[10px]">
              Locations
            </span>
            <ul className="space-y-3">
              <li>
                <span className="text-cream font-medium">BJJ &amp; Most Programs:</span>
                <br />
                918 Dundas St E
              </li>
              <li>
                <span className="text-cream font-medium">Archery:</span>
                <br />
                E.T. Seaton Range
              </li>
              <li>
                <span className="text-cream font-medium">Outdoor Program:</span>
                <br />
                Coming Soon
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-cream/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono-label text-cream/30 uppercase tracking-widest">
        <p>
          &copy; 2024 Sunnah Skills. All rights reserved. Building character through traditional skills.
        </p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-cream/80 transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-cream/80 transition-colors">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
