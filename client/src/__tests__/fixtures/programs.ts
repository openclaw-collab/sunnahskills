import type { ProgramSlug } from "@/lib/programConfig";

/**
 * Factory functions for creating test data for programs and sessions.
 */

// ============================================================================
// Program Configuration Types
// ============================================================================

export interface ProgramSession {
  id: number;
  program_id: string;
  name: string;
  start_date: string;
  end_date: string;
  capacity: number;
  enrolled: number;
  is_active: boolean;
  created_at: string;
}

export interface ProgramPrice {
  id: number;
  program_id: string;
  session_id: number | null;
  name: string;
  amount: number; // in cents
  billing_type: "one_time" | "monthly" | "per_session";
  is_active: boolean;
}

export interface ProgramConfig {
  id: string;
  name: string;
  slug: ProgramSlug;
  description: string;
  age_range: string;
  schedule_options: string[];
  features: string[];
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// Program Config Factories
// ============================================================================

export function createProgramConfig(
  overrides: Partial<ProgramConfig> = {}
): ProgramConfig {
  return {
    id: "prog_123",
    name: "Brazilian Jiu-Jitsu",
    slug: "bjj",
    description: "Learn self-defense and build confidence through BJJ training.",
    age_range: "6-17",
    schedule_options: ["monday-wednesday", "tuesday-thursday"],
    features: [
      "Expert instruction",
      "Age-appropriate classes",
      "Bullyproofing curriculum",
      "Competition opportunities",
    ],
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createBJJProgram(
  overrides: Partial<ProgramConfig> = {}
): ProgramConfig {
  return createProgramConfig({
    id: "prog_bjj",
    name: "Brazilian Jiu-Jitsu",
    slug: "bjj",
    description: "Build confidence and learn self-defense through Brazilian Jiu-Jitsu.",
    age_range: "6-17",
    schedule_options: ["monday-wednesday", "tuesday-thursday", "friday-saturday"],
    features: [
      "World-class instruction",
      "Age-appropriate groups",
      "Anti-bullying curriculum",
      "Competition team",
    ],
    ...overrides,
  });
}

export function createArcheryProgram(
  overrides: Partial<ProgramConfig> = {}
): ProgramConfig {
  return createProgramConfig({
    id: "prog_archery",
    name: "Archery",
    slug: "archery",
    description: "Learn the ancient art of archery with modern equipment and safety.",
    age_range: "8+",
    schedule_options: ["saturday-morning", "sunday-afternoon"],
    features: [
      "Professional equipment",
      "Certified instructors",
      "Indoor and outdoor ranges",
      "Tournament preparation",
    ],
    ...overrides,
  });
}

export function createOutdoorProgram(
  overrides: Partial<ProgramConfig> = {}
): ProgramConfig {
  return createProgramConfig({
    id: "prog_outdoor",
    name: "Outdoor Adventure",
    slug: "outdoor",
    description: "Explore nature and learn outdoor survival skills.",
    age_range: "10-16",
    schedule_options: ["weekend-workshop", "summer-camp"],
    features: [
      "Wilderness survival",
      "Leave No Trace ethics",
      "Team building",
      "Nature identification",
    ],
    ...overrides,
  });
}

export function createBullyproofingProgram(
  overrides: Partial<ProgramConfig> = {}
): ProgramConfig {
  return createProgramConfig({
    id: "prog_bullyproofing",
    name: "Bullyproofing",
    slug: "bullyproofing",
    description: "Develop confidence and learn strategies to prevent and respond to bullying.",
    age_range: "6-14",
    schedule_options: ["weekly-classes", "intensive-camp"],
    features: [
      "Confidence building",
      "Verbal assertiveness",
      "Physical self-defense",
      "Parent resources",
    ],
    ...overrides,
  });
}

// ============================================================================
// Session Factories
// ============================================================================

export function createSession(
  overrides: Partial<ProgramSession> = {}
): ProgramSession {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() + 1);

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 3);

  return {
    id: 1,
    program_id: "bjj",
    name: "Spring 2024 Session",
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
    capacity: 20,
    enrolled: 12,
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createSessions(
  programId: string,
  count: number = 3
): ProgramSession[] {
  return Array.from({ length: count }, (_, i) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + i);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);

    return createSession({
      id: i + 1,
      program_id: programId,
      name: `Session ${i + 1}`,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      enrolled: Math.floor(Math.random() * 15),
    });
  });
}

export function createFullSession(
  overrides: Partial<ProgramSession> = {}
): ProgramSession {
  return createSession({
    capacity: 20,
    enrolled: 20,
    ...overrides,
  });
}

export function createWaitlistSession(
  overrides: Partial<ProgramSession> = {}
): ProgramSession {
  return createSession({
    capacity: 20,
    enrolled: 25,
    ...overrides,
  });
}

// ============================================================================
// Price Factories
// ============================================================================

export function createProgramPrice(
  overrides: Partial<ProgramPrice> = {}
): ProgramPrice {
  return {
    id: 1,
    program_id: "bjj",
    session_id: null,
    name: "Full Session",
    amount: 15000, // $150.00
    billing_type: "one_time",
    is_active: true,
    ...overrides,
  };
}

export function createMonthlyPrice(
  overrides: Partial<ProgramPrice> = {}
): ProgramPrice {
  return createProgramPrice({
    name: "Monthly Membership",
    amount: 6500, // $65.00
    billing_type: "monthly",
    ...overrides,
  });
}

export function createPerSessionPrice(
  overrides: Partial<ProgramPrice> = {}
): ProgramPrice {
  return createProgramPrice({
    name: "Drop-in Session",
    amount: 2500, // $25.00
    billing_type: "per_session",
    ...overrides,
  });
}

export function createSiblingDiscountPrice(
  overrides: Partial<ProgramPrice> = {}
): ProgramPrice {
  return createProgramPrice({
    name: "Sibling Discount",
    amount: 12000, // $120.00 (20% off)
    billing_type: "one_time",
    ...overrides,
  });
}

export function createProgramPrices(programId: string): ProgramPrice[] {
  return [
    createProgramPrice({ program_id: programId, id: 1, name: "Full Session" }),
    createMonthlyPrice({ program_id: programId, id: 2 }),
    createPerSessionPrice({ program_id: programId, id: 3 }),
    createSiblingDiscountPrice({ program_id: programId, id: 4 }),
  ];
}

// ============================================================================
// Complete Program Bundle
// ============================================================================

export interface ProgramBundle {
  config: ProgramConfig;
  sessions: ProgramSession[];
  prices: ProgramPrice[];
}

export function createCompleteProgram(
  programSlug: ProgramSlug = "bjj",
  sessionCount: number = 3
): ProgramBundle {
  let config: ProgramConfig;

  switch (programSlug) {
    case "archery":
      config = createArcheryProgram();
      break;
    case "outdoor":
      config = createOutdoorProgram();
      break;
    case "bullyproofing":
      config = createBullyproofingProgram();
      break;
    case "bjj":
    default:
      config = createBJJProgram();
      break;
  }

  return {
    config,
    sessions: createSessions(config.id, sessionCount),
    prices: createProgramPrices(config.id),
  };
}

// ============================================================================
// Schedule Option Factories
// ============================================================================

export const SCHEDULE_OPTIONS = {
  bjj: [
    { value: "monday-wednesday", label: "Monday & Wednesday", time: "5:00 PM - 6:30 PM" },
    { value: "tuesday-thursday", label: "Tuesday & Thursday", time: "5:00 PM - 6:30 PM" },
    { value: "friday-saturday", label: "Friday & Saturday", time: "4:00 PM - 5:30 PM" },
  ],
  archery: [
    { value: "saturday-morning", label: "Saturday Morning", time: "9:00 AM - 11:00 AM" },
    { value: "sunday-afternoon", label: "Sunday Afternoon", time: "2:00 PM - 4:00 PM" },
  ],
  outdoor: [
    { value: "weekend-workshop", label: "Weekend Workshop", time: "Saturday 9:00 AM - Sunday 3:00 PM" },
    { value: "summer-camp", label: "Summer Camp", time: "Monday-Friday 8:00 AM - 5:00 PM" },
  ],
  bullyproofing: [
    { value: "weekly-classes", label: "Weekly Classes", time: "Tuesday & Thursday 4:00 PM - 5:00 PM" },
    { value: "intensive-camp", label: "Intensive Camp", time: "School Breaks 9:00 AM - 3:00 PM" },
  ],
};

export function getScheduleOptions(programSlug: ProgramSlug) {
  return SCHEDULE_OPTIONS[programSlug] || [];
}
