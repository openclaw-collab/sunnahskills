import type { PositionCategory } from "@/lib/grapplemap-types";

type Difficulty = "beginner" | "intermediate" | "advanced";
type TechniqueStage = "standing" | "guard" | "escapes" | "sweeps" | "passing" | "control" | "submissions";

export type LaunchTechniqueSpec = {
  slug: string;
  label: string;
  dataPath?: string;
  source?: string;
  tags?: string[];
  description?: string[];
  positionCategory?: PositionCategory | "guard-pass";
  startingPosition?: string;
  endingPosition?: string;
  difficulty?: Difficulty;
  curriculumStage?: TechniqueStage;
  curriculumOrder?: number;
};

export const LAUNCH_TECHNIQUE_SPECS: LaunchTechniqueSpec[] = [
  {
    slug: "double-leg-to-mount-escape-full-chain",
    label: "Double Leg to Mount Escape Sweep",
    dataPath: "/data/techniques/double-leg-to-mount-escape-full-chain.json",
    source: "Sunnah Skills launch chain",
    tags: ["double leg", "mount", "escape", "pendulum sweep"],
    description: [
      "The full launch chain from wrist control to double leg, mount, escape, and return sweep.",
      "Enter on the double leg, climb to mount, recover from the bottom escape sequence, and reverse back on top with the pendulum finish.",
    ],
    positionCategory: "standing",
    startingPosition: "Standing wrist control hand fight",
    endingPosition: "Mount",
    difficulty: "intermediate",
    curriculumStage: "standing",
    curriculumOrder: 5,
  },
  {
    slug: "arm-drag-to-back-finish",
    label: "Arm Drag to Back Finish",
    dataPath: "/data/techniques/arm-drag-to-back-finish.json",
    source: "Sunnah Skills launch chain",
    tags: ["arm drag", "back take", "rear naked choke"],
    description: [
      "Drag past the arm, win the back, and finish the choke.",
      "Start from symmetric staggered standing, hit the arm drag, circle behind, secure the seatbelt and hooks, then close the rear naked choke.",
    ],
    positionCategory: "standing",
    startingPosition: "Symmetric Staggered Standing",
    endingPosition: "Staredown",
    difficulty: "intermediate",
    curriculumStage: "standing",
    curriculumOrder: 10,
  },
  {
    slug: "collar-tie-ankle-pick-to-armbar",
    label: "Collar Tie Ankle Pick to Armbar",
    dataPath: "/data/techniques/collar-tie-ankle-pick-to-armbar.json",
    source: "Sunnah Skills launch chain",
    tags: ["ankle pick", "leg drag", "armbar"],
    description: [
      "Snap into the collar-tie ankle pick, flow through the pass, and finish with the armbar.",
      "Secure the collar tie and wrist, hit the foot-hook ankle pick, convert to the leg drag pass, float to knee on belly, and finish the armbar.",
    ],
    positionCategory: "standing",
    startingPosition: "Symmetric Staggered Standing",
    endingPosition: "Staredown",
    difficulty: "intermediate",
    curriculumStage: "standing",
    curriculumOrder: 15,
  },
];

export const LAUNCH_TECHNIQUE_SLUGS = new Set(LAUNCH_TECHNIQUE_SPECS.map((spec) => spec.slug));

export const LAUNCH_TECHNIQUE_BY_SLUG = new Map(LAUNCH_TECHNIQUE_SPECS.map((spec) => [spec.slug, spec]));
