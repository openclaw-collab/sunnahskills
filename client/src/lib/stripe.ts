import { loadStripe } from "@stripe/stripe-js";
import type { Appearance } from "@stripe/stripe-js";

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

export const stripeAppearance: Appearance = {
  theme: "flat",
  variables: {
    colorPrimary: "#2E4036",
    colorBackground: "#F2F0E9",
    colorText: "#1A1A1A",
    colorDanger: "#CC5833",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(46, 64, 54, 0.2)",
      boxShadow: "none",
      padding: "12px 16px",
    },
    ".Input:focus": {
      border: "1px solid #2E4036",
      boxShadow: "0 0 0 1px #2E4036",
    },
    ".Label": {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: "13px",
      fontWeight: "500",
    },
  },
};

