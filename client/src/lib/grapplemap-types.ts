export type PositionCategory = 
  | "closed-guard" 
  | "open-guard" 
  | "half-guard" 
  | "mount" 
  | "side-control" 
  | "back-control" 
  | "standing";

export type Marker = {
  name: string;
  frame: number;
  type: "position" | "transition";
};

export type TechniqueSequence = {
  id: string;
  name: string;
  slug: string;
  positionCategory: PositionCategory;
  startingPosition: string;
  endingPosition: string;
  markers: Marker[];
  frames: number[][][][];
  description: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  sources?: string[];
};

export const POSITION_CATEGORIES: Array<{ slug: PositionCategory; label: string }> = [
  { slug: "mount", label: "Mount" },
  { slug: "closed-guard", label: "Closed Guard" },
  { slug: "open-guard", label: "Open Guard" },
  { slug: "half-guard", label: "Half Guard" },
  { slug: "side-control", label: "Side Control" },
  { slug: "back-control", label: "Back Control" },
  { slug: "standing", label: "Standing" },
];
