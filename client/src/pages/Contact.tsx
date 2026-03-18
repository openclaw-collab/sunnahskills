import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertContactSchema, type InsertContact } from "@shared/schema.frontend";
import { Mail, Instagram, Clock, MapPin } from "lucide-react";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { TelemetryCard } from "@/components/brand/TelemetryCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { StatusDot } from "@/components/brand/StatusDot";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      // Check if we're in development mode
      if (import.meta.env.DEV) {
        // Mock response for local development
        console.log('Mock API call:', data);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              message: "Message sent successfully! (Mock response - will work on live site)"
            });
          }, 1000);
        });
      }
      
      // Real API call for production
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Message Sent!",
        description: data.message,
      });
      form.reset();
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: InsertContact) => {
    setIsSubmitting(true);
    contactMutation.mutate(data);
  };

  const subjects = [
    { value: "general-inquiry", label: "General Inquiry" },
    { value: "program-questions", label: "Program Questions" },
    { value: "scheduling", label: "Scheduling" },
    { value: "registration-help", label: "Registration Help" },
    { value: "other", label: "Other" },
  ];

  const contactInfo = [
    {
      title: "Email",
      content: (
        <a 
          href="mailto:mysunnahskill@gmail.com" 
          className="text-moss hover:text-charcoal transition-colors duration-200"
        >
          mysunnahskill@gmail.com
        </a>
      ),
    },
    {
      title: "Instagram",
      content: (
        <a 
          href="https://instagram.com/sunnahskills" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-moss hover:text-charcoal transition-colors duration-200"
        >
          @sunnahskills
        </a>
      ),
    },
    {
      title: "Response Time",
      content: <p className="text-charcoal/70">We typically respond within 24 hours</p>,
    },
  ];

  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-6xl mx-auto px-6 pt-28">
        <StudioBlock id="contact.header" label="Header + intro" page="Contact">
          <SectionHeader
            eyebrow={<StudioText k="contact.eyebrow" defaultText="Contact" as="span" className="inline" />}
            title={<StudioText k="contact.title" defaultText="Get in Touch" as="span" className="inline" />}
            className="mb-10"
          />
        <p className="font-body text-sm text-charcoal/70 max-w-2xl mb-12">
          <StudioText
            k="contact.intro"
            defaultText="Ask anything—program fit, scheduling, registration help. We’ll respond with clear next steps and a specific recommendation for your family."
            as="span"
            className="inline"
            multiline
          />
        </p>
        </StudioBlock>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <PremiumCard className="bg-white border border-charcoal/10 space-y-6">
            <div className="flex items-center gap-2 font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
              <StatusDot ariaLabel="Contact channels" />
              Contact Channels
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-charcoal/10 bg-cream/60 px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-clay/10 text-clay flex-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
                      Email
                    </div>
                    <div className="text-sm font-body text-charcoal/85 truncate [&>a]:block [&>a]:truncate">
                      {contactInfo[0].content}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-charcoal/10 bg-cream/60 px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-moss/10 text-moss flex-none">
                    <Instagram className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
                      Instagram
                    </div>
                    <div className="text-sm font-body text-charcoal/85 truncate [&>a]:block [&>a]:truncate">
                      {contactInfo[1].content}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-charcoal/10 bg-cream/60 px-4 py-3 flex items-center justify-between gap-4 sm:col-span-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-charcoal/10 text-charcoal flex-none">
                    <Clock className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
                      Response time
                    </div>
                    <div className="text-sm font-body text-charcoal/80">{contactInfo[2].content}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-charcoal/10 bg-cream p-5 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="text-clay" size={18} />
                <div className="font-heading text-lg text-charcoal">Locations</div>
              </div>
              <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 font-body text-sm text-charcoal/80">
                <span className="font-semibold">Main Location:</span>
                <span>918 Dundas St E</span>
                <span className="font-semibold">Archery:</span>
                <span>E.T. Seaton Range</span>
                <span className="font-semibold">Outdoor Program:</span>
                <span className="text-moss font-semibold">Coming Soon</span>
              </div>
            </div>

            <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">
                When you reach out, you&apos;ll get
              </div>
              <ul className="font-body text-sm text-charcoal/70 space-y-1">
                <li>• A response from a coach or admin within one business day</li>
                <li>• Clear next steps for registration or waitlist placement</li>
                <li>• Honest guidance if a program is or isn&apos;t the right fit</li>
              </ul>
            </div>
          </PremiumCard>

          {/* Contact Form */}
          <PremiumCard className="bg-white border border-charcoal/10">
            <div className="font-heading text-2xl text-charcoal">Send a Message</div>
            <p className="mt-2 font-body text-sm text-charcoal/70">
              Share context so we can reply with the right schedule and next steps.
            </p>

            <div className="mt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.value} value={subject.value}>
                                {subject.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="How can we help you?"
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <ClayButton
                    type="submit"
                    className="w-full px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </ClayButton>
                </form>
              </Form>
            </div>
          </PremiumCard>
        </div>
      </main>
    </div>
  );
};

export default Contact;
