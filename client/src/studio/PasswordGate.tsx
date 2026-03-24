import { useState } from "react";
import { useStudio } from "./useStudio";

export function PasswordGate() {
  const { state, authenticate } = useStudio();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Only show if in session mode, enabled, but not yet authed
  if (!state.enabled || state.mode !== "session" || state.authed) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const ok = await authenticate(password);
    setLoading(false);
    if (!ok) setError("Incorrect password. Try again.");
  };

  return (
    <div
      data-studio-ui="1"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-8">
        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">
          Stakeholder Studio
        </div>
        <h2 className="font-heading text-2xl text-charcoal mb-1">Password required</h2>
        <p className="font-body text-sm text-charcoal/60 mb-6">
          This review session is password-protected.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter session password"
            className="w-full rounded-2xl border border-charcoal/15 bg-cream/40 px-4 py-3 text-sm text-charcoal outline-none focus:ring-2 focus:ring-moss/30"
            autoFocus
          />
          {error && <p className="text-sm text-clay">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-full bg-charcoal text-cream py-3 text-[11px] font-mono-label uppercase tracking-[0.18em] disabled:opacity-50 transition-opacity"
          >
            {loading ? "Checking…" : "Enter Studio"}
          </button>
        </form>
      </div>
    </div>
  );
}
