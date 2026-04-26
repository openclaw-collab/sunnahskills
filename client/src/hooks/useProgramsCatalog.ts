import { useQuery } from "@tanstack/react-query";

export type CatalogSession = {
  id: number;
  program_id: string;
  offer_id?: number | null;
  name: string;
  season?: string | null;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  age_group: string | null;
  gender_group: string | null;
  capacity: number | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type CatalogPrice = {
  id: number;
  program_id: string;
  offer_id?: number | null;
  age_group: string;
  label: string;
  amount: number;
  frequency: string;
  registration_fee: number | null;
  metadata: string | null;
};

export type CatalogOffer = {
  id: number;
  program_id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  confirmation_notes?: string | null;
  is_private: number;
  access_code?: string | null;
  active: number;
  audience_gender?: string | null;
  waiver_slug?: string | null;
  dates: string[];
  sessions: CatalogSession[];
  prices: CatalogPrice[];
};

/** Active semester from D1 (public catalog); drives kids per-class × N and default reg fee. */
export type CatalogActiveSemester = {
  id: number;
  name: string;
  program_id: string;
  start_date: string | null;
  end_date: string | null;
  classes_in_semester: number;
  price_per_class_cents: number | null;
  registration_fee_cents: number | null;
  later_payment_date: string | null;
  active: number;
};

export type CatalogProgram = {
  id: string;
  slug: string;
  name: string;
  status: string;
  sessions: CatalogSession[];
  prices: CatalogPrice[];
  offers: CatalogOffer[];
  active_semester: CatalogActiveSemester | null;
};

export function useProgramsCatalog() {
  return useQuery({
    queryKey: ["programs-catalog"],
    queryFn: async () => {
      const res = await fetch("/api/programs");
      if (!res.ok) throw new Error("Failed to load programs");
      const data = (await res.json()) as { programs: CatalogProgram[] };
      return data;
    },
    staleTime: 60_000,
  });
}
