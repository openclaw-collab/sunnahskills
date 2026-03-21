import { loadStripe } from "@stripe/stripe-js";
import type { Appearance } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();

export const stripePromise = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);

export const stripeAppearance: Appearance = {
  theme: "night",
  variables: {
    colorBackground: "#1A1A1A",
    colorText: "#F5F0E8",
    colorPrimary: "#CE5833",
    colorDanger: "#CE5833",
    colorTextSecondary: "rgba(245, 240, 232, 0.6)",
    colorTextPlaceholder: "rgba(245, 240, 232, 0.3)",
    borderRadius: "12px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(245, 240, 232, 0.12)",
      boxShadow: "none",
      padding: "12px 16px",
      backgroundColor: "rgba(255,255,255,0.04)",
    },
    ".Input:focus": {
      border: "1px solid #CE5833",
      boxShadow: "0 0 0 1px #CE5833",
    },
    ".Label": {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: "12px",
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "rgba(245, 240, 232, 0.5)",
    },
  },
};
