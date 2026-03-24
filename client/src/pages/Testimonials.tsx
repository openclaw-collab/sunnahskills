import { Link } from "wouter";
import { Star } from "lucide-react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { ClayButton } from "@/components/brand/ClayButton";
import { StatusDot } from "@/components/brand/StatusDot";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";
import { MotionDiv, MotionPage } from "@/components/motion/PageMotion";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Mitchell",
      child: "Ahmed (12)",
      initials: "SM",
      bgColor: "bg-primary",
      content: "Ahmed has been attending BJJ classes for 8 months, and the transformation has been incredible. His confidence has soared, and he's learned valuable life skills about respect and perseverance. The instructors truly care about character development.",
    },
    {
      name: "Michael Abdullah",
      child: "Fatima (9)",
      initials: "MA",
      bgColor: "bg-earthGreen",
      content: "The outdoor workshops have been amazing for Fatima. She's learned practical skills like fire building and knot tying while developing a deep love for nature. The balance of fun and education is perfect, and she always comes home excited to share what she learned.",
    },
    {
      name: "Layla Hassan",
      child: "Omar (14)",
      initials: "LH",
      bgColor: "bg-secondary",
      content: "The archery program taught Omar focus and patience in a way that nothing else has. The traditional approach and emphasis on mindfulness has helped him in school too. We're so grateful for the positive influence this program has had on our son.",
    },
    {
      name: "Amina Ali",
      child: "Zainab (10)",
      initials: "AA",
      bgColor: "bg-primary",
      content: "The bullyproofing workshop was exactly what Zainab needed. She learned how to set boundaries and gained the confidence to handle difficult situations. The approach is practical and empowering without being aggressive. Highly recommend!",
    },
    {
      name: "Khalid Mohammed",
      child: "Yusuf (7)",
      initials: "KM",
      bgColor: "bg-earthGreen",
      content: "Yusuf was shy and hesitant when he started, but the instructors were so patient and encouraging. Now he's one of the most enthusiastic kids in his BJJ class. The program has built his physical skills and given him a strong sense of community.",
    },
    {
      name: "Fatima Qureshi",
      child: "Maryam (13)",
      initials: "FQ",
      bgColor: "bg-secondary",
      content: "As a mother, I love that Maryam is learning practical life skills while building physical and mental strength. The values-based approach aligns perfectly with what we teach at home. She's become more confident and self-reliant through these programs.",
    },
  ];

  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-6xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="Testimonials" title="What Families Say" className="mb-10" />
        <p className="font-body text-sm text-charcoal/70 max-w-2xl mb-12">
          Real notes from parents—how discipline, confidence, and practical skill-building show up at home.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <MotionDiv key={index} delay={index * 0.04}>
              <StudioBlock
                id={`testimonials.${index + 1}`}
                label={`Testimonial ${index + 1}`}
                page="Testimonials"
              >
                <PremiumCard className="bg-white border border-charcoal/10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 ${testimonial.bgColor} rounded-full flex items-center justify-center`}
                      aria-hidden="true"
                    >
                      <span className="text-white font-heading text-sm tracking-tight">{testimonial.initials}</span>
                    </div>
                    <div>
                      <StudioText
                        k={`testimonials.${index + 1}.author`}
                        defaultText={testimonial.name}
                        as="div"
                        className="font-heading text-lg text-charcoal"
                      />
                      <StudioText
                        k={`testimonials.${index + 1}.title`}
                        defaultText={`Parent of ${testimonial.child}`}
                        as="div"
                        className="font-body text-xs text-charcoal/60"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#CCB55E]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                </div>

                <p className="mt-5 font-body text-sm text-charcoal/70 leading-relaxed">
                  <span className="text-charcoal/50 font-serif-accent text-lg leading-none mr-2">“</span>
                  <StudioText
                    k={`testimonials.${index + 1}.quote`}
                    defaultText={testimonial.content}
                    as="span"
                    multiline
                  />
                  <span className="text-charcoal/50 font-serif-accent text-lg leading-none ml-2">”</span>
                </p>
                </PremiumCard>
              </StudioBlock>
            </MotionDiv>
          ))}
        </div>

        <div className="mt-14">
          <MotionDiv delay={0.04}>
            <PremiumCard className="bg-cream border border-charcoal/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                  <StatusDot ariaLabel="Enrollment open" />
                  Join our community
                </div>
                <h3 className="mt-2 font-heading text-3xl text-charcoal tracking-tight">
                  Ready to get started?
                </h3>
                <p className="mt-3 font-body text-sm text-charcoal/70 max-w-2xl">
                  Reach out with questions, or pick a program and begin a guided in-app registration.
                </p>
              </div>
              <div className="w-full md:w-auto">
                <ClayButton asChild className="w-full md:w-auto px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/contact">Get Started</Link>
                </ClayButton>
              </div>
            </div>
            </PremiumCard>
          </MotionDiv>
        </div>
      </main>
    </MotionPage>
  );
};

export default Testimonials;
