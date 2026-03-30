import React from "react";
import { useToast } from "@/hooks/use-toast";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WaitlistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  programName: string;
};

export function WaitlistDialog({ open, onOpenChange, programId, programName }: WaitlistDialogProps) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) return;
    setName("");
    setEmail("");
    setSubmitting(false);
  }, [open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          programId,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Couldn't add you to the waitlist. Try again?");
      }

      toast({
        title: "Added to the waitlist",
        description: `${name.trim()} has been saved for ${programName}.`,
      });
      onOpenChange(false);
    } catch (caught) {
      toast({
        title: "Waitlist submission failed",
        description: caught instanceof Error ? caught.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-charcoal/10 bg-cream text-charcoal shadow-[0_30px_80px_rgba(26,26,26,0.18)]">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl tracking-tight text-charcoal">
            Join the waitlist
          </DialogTitle>
          <DialogDescription className="font-body text-sm leading-relaxed text-charcoal/65">
            Leave your name and email and we&apos;ll keep you updated for {programName}.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm text-charcoal">
            Name
            <Input
              className="mt-2 bg-white border-charcoal/10"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
              required
            />
          </label>

          <label className="block text-sm text-charcoal">
            Email
            <Input
              className="mt-2 bg-white border-charcoal/10"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <OutlineButton
              type="button"
              className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </OutlineButton>
            <ClayButton
              type="submit"
              className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Join waitlist"}
            </ClayButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
