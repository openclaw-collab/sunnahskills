import { useQuery } from "@tanstack/react-query";

export type CatalogSession = {
  id: number;
  program_id: string;
  name: string;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  age_group: string | null;
  gender_group: string | null;
  capacity: number | null;
};

export type CatalogPrice = {
  id: number;
  program_id: string;
  age_group: string;
  label: string;
  amount: number;
  frequency: string;
  registration_fee: number | null;
  metadata: string | null;
};

export type CatalogProgram = {
  id: string;
  slug: string;
  name: string;
  status: string;
  sessions: CatalogSession[];
  prices: CatalogPrice[];
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
