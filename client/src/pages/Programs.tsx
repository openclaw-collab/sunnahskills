import { Link } from "wouter";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";

const Programs = () => {
  const programs = [
    {
      id: "bjj",
      title: "Brazilian Jiu-Jitsu",
      image: "https://plus.unsplash.com/premium_photo-1713170701344-41076b018b59?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YmpqJTIwYmVsdHxlbnwwfHwwfHx8MA%3D%3D",
      description: "Our BJJ program teaches ground-based grappling techniques that emphasize leverage, technique, and strategy over strength. Students learn valuable life skills including patience, persistence, and problem-solving while developing physical fitness and self-confidence.",
      bullets: ["Separate boys' and girls' classes", "Ages 6-17, grouped by age and skill level", "Belt progression system with regular testing", "Focus on respect, discipline, and character building"],
      meta: ["Recurring", "Technique-first", "Confidence"],
    },
    {
      id: "archery",
      title: "Seasonal Archery",
      image: "https://images.unsplash.com/photo-1666816584311-ba40d5299760",
      description: "Traditional archery instruction during summer and fall seasons. Students learn proper form, safety protocols, and mental focus while connecting with this ancient skill. Our program emphasizes mindfulness, concentration, and the satisfaction of steady improvement.",
      bullets: ["Summer and fall seasonal sessions", "Comprehensive safety training included", "Progressive skill development with traditional bows", "Mental focus and concentration training"],
      meta: ["Seasonal", "Safety-first", "Focus"],
    },
    {
      id: "outdoor",
      title: "Outdoor Workshops",
      image: "https://images.unsplash.com/photo-1610029632807-589f1f0d7673?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2lsZGVybmVzcyUyMHNraWxsJTIwYnVpbGRpbmclMjBmaXJlJTIwbWF0Y2h8ZW58MHx8MHx8fDA%3D",
      description: "Hands-on wilderness education that teaches practical outdoor skills while fostering a deep connection with nature. Students gain confidence, problem-solving abilities, and environmental awareness through engaging, project-based learning experiences.",
      bullets: ["Fire building techniques and safety", "Essential knot tying and rope work", "Shelter building and outdoor construction", "Navigation skills and orienteering"],
      meta: ["Workshop", "Readiness", "Stewardship"],
    },
    {
      id: "bullyproofing",
      title: "Bullyproofing Workshops",
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=70",
      description: "Empowering workshops that teach children how to set boundaries, recognize dangerous situations, and use basic grappling techniques for self-protection. Our approach emphasizes de-escalation, verbal assertiveness, and building unshakeable confidence.",
      bullets: [
        "Verbal boundary setting and assertiveness",
        "Situational awareness and threat recognition",
        "Basic grappling and distance control",
      ],
      meta: ["Short series", "De-escalation", "Parent partnership"],
    },
  ];

  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-6xl mx-auto px-6 pt-28">
        <StudioBlock id="programs.header" label="Header + intro" page="Programs">
          <SectionHeader
            eyebrow={<StudioText k="programs.eyebrow" defaultText="Programs" as="span" className="inline" />}
            title={<StudioText k="programs.title" defaultText="Choose a Track" as="span" className="inline" />}
            className="mb-10"
          />
          <p className="font-body text-sm text-charcoal/70 max-w-2xl mb-12">
            <StudioText
              k="programs.intro"
              defaultText="Programs are built around calm discipline: clear standards, steady progression, and a community that makes character visible."
              as="span"
              className="inline"
              multiline
            />
          </p>
        </StudioBlock>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {programs.map((program) => (
            <Link href={`/programs/${program.id}`} key={program.id}>
              <PremiumCard className="bg-white border border-charcoal/10 overflow-hidden hover:shadow-[0_30px_80px_rgba(26,26,26,0.10)] transition-shadow cursor-pointer">
                <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-charcoal/10">
                  <img
                    src={program.image}
                    alt={program.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                    data-studio-image-slot={`program.${program.id}.image`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/45" />
                </div>

                <div className="mt-5">
                  <div className="font-heading text-2xl text-charcoal">{program.title}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {program.meta.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full border border-charcoal/10 px-2 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-charcoal/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 font-body text-sm text-charcoal/70 leading-relaxed">{program.description}</p>
                </div>

                <ul className="mt-6 space-y-2 font-body text-sm text-charcoal/70">
                  {program.bullets.map((b) => (
                    <li key={b} className="flex gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-clay flex-none" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                  Tap to view details →
                </div>
              </PremiumCard>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Programs;
