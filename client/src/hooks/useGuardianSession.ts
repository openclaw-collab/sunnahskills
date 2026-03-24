import { useQuery } from "@tanstack/react-query";

export type GuardianSession = {
  authenticated: boolean;
  email?: string;
  accountNumber?: string;
  fullName?: string | null;
  phone?: string | null;
};

export type SavedStudent = {
  id: number;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  medical_notes: string | null;
  created_at?: string;
};

export function useGuardianSession() {
  return useQuery({
    queryKey: ["/api/guardian/me"],
    queryFn: async () => {
      const res = await fetch("/api/guardian/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load guardian session");
      return (await res.json()) as GuardianSession;
    },
    staleTime: 30_000,
  });
}

export function useGuardianStudents(enabled = true) {
  return useQuery({
    queryKey: ["/api/guardian/students"],
    queryFn: async () => {
      const res = await fetch("/api/guardian/students", { credentials: "include" });
      if (res.status === 401) return { students: [] as SavedStudent[] };
      if (!res.ok) throw new Error("Failed to load saved students");
      return (await res.json()) as { students: SavedStudent[] };
    },
    enabled,
    staleTime: 15_000,
  });
}
