import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Maximize2 } from "lucide-react";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { TechniqueViewer } from "@/components/grapplemap/TechniqueViewer";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";
import { TechniqueModal } from "@/components/TechniqueModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { MotionPage, MotionDiv } from "@/components/motion/PageMotion";
import type { PositionCategory } from "@/lib/grapplemap-types";
import { LAUNCH_TECHNIQUE_BY_SLUG, LAUNCH_TECHNIQUE_SPECS } from "@/lib/launchTechniques";
import { techniqueSequenceApiUrl } from "@/lib/techniqueApi";

type Difficulty = "beginner" | "intermediate" | "advanced";

type SceneMeta = {
  transitionId?: number;
  slug?: string;
  name: string;
  tags?: string[];
  description: string[];
  dataPath: string;
  positionCategory?: PositionCategory | "guard-pass";
  startingPosition?: string;
  endingPosition?: string;
  source?: string;
  totalFrames?: number;
  difficulty?: Difficulty;
  curriculumStage?: Exclude<TechniqueStage["slug"], "all">;
  curriculumOrder?: number;
};

type SceneEntry = {
  id: string;
  meta: SceneMeta;
};

type TechniqueStage = {
  slug: "all" | "standing" | "guard" | "escapes" | "sweeps" | "passing" | "control" | "submissions";
  label: string;
  keywords: string[];
};

const TECHNIQUE_STAGES: TechniqueStage[] = [
  { slug: "all", label: "All", keywords: [] },
  { slug: "standing", label: "Standing", keywords: ["standing", "clinch", "takedown", "throw", "trip"] },
  { slug: "guard", label: "Guard", keywords: ["guard", "closed guard", "open guard", "half guard"] },
  { slug: "escapes", label: "Escapes", keywords: ["escape", "recover", "bridge"] },
  { slug: "sweeps", label: "Sweeps", keywords: ["sweep"] },
  { slug: "passing", label: "Passing", keywords: ["guard pass", "guard-pass", "pass", "side control"] },
  { slug: "control", label: "Control", keywords: ["back", "mount", "control", "ride"] },
  { slug: "submissions", label: "Submissions", keywords: ["submission", "armbar", "kimura", "choke", "guillotine"] },
];

const STAGE_ORDER: Record<TechniqueStage["slug"], number> = {
  all: 0,
  standing: 1,
  guard: 2,
  escapes: 3,
  sweeps: 4,
  passing: 5,
  control: 6,
  submissions: 7,
};

const TECHNIQUE_ALIASES: Record<string, string> = {
  "guard-pass-bullfighter": "bullfighter-pass",
  "guard-pass-leg-over": "leg-over-pass",
};

const TECHNIQUE_OVERRIDES: Record<string, Partial<SceneMeta>> = {
  "armbar-from-guard": {
    source: "GrappleMap.txt • closed-guard submission chain",
  },
  "kimura-from-guard": {
    source: "GrappleMap.txt • closed-guard submission chain",
  },
  guillotine: {
    source: "GrappleMap.txt • standing-to-guard front headlock work",
  },
  "half-guard-sweep": {
    source: "GrappleMap.txt • half-guard sweep study",
  },
  "guard-pass-bullfighter": {
    source: "GrappleMap.txt • standing guard pass series",
  },
  "guard-pass-leg-over": {
    source: "GrappleMap.txt • standing guard pass series",
  },
  "side-control-escape": {
    source: "GrappleMap.txt • mount escape fundamentals",
  },
  "back-take": {
    source: "GrappleMap.txt • back control transition",
  },
};

function toStudioKeyPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function deriveTechniqueSlug(scene: { id: string; meta: SceneMeta }) {
  return scene.meta.slug ?? scene.id;
}

function normalizeSource(source?: string) {
  if (!source) return "GrappleMap";
  return source.replace(/\.txt$/i, "");
}

/** Fallback when D1 has no verified techniques (local dev before `npm run seed:techniques`). */
function buildLaunchStaticScenes(): SceneEntry[] {
  return LAUNCH_TECHNIQUE_SPECS.map((spec) => ({
    id: spec.slug,
    meta: {
      slug: spec.slug,
      name: spec.label,
      tags: spec.tags ?? [],
      description: spec.description ?? [],
      dataPath: techniqueSequenceApiUrl(spec.slug),
      source: spec.source ?? "Sunnah Skills",
      positionCategory: spec.positionCategory,
      startingPosition: spec.startingPosition,
      endingPosition: spec.endingPosition,
      difficulty: spec.difficulty,
      curriculumStage: spec.curriculumStage,
      curriculumOrder: spec.curriculumOrder,
    },
  }));
}

function deriveStage(scene: SceneEntry): TechniqueStage["slug"] {
  if (scene.meta.curriculumStage) return scene.meta.curriculumStage;

  const searchable = [
    scene.meta.name,
    ...(Array.isArray(scene.meta.tags) ? scene.meta.tags : []),
    scene.meta.startingPosition ?? "",
    scene.meta.endingPosition ?? "",
    scene.meta.positionCategory ?? "",
  ]
    .join(" ")
    .toLowerCase();

  for (const stage of TECHNIQUE_STAGES) {
    if (stage.slug === "all") continue;
    if (stage.keywords.some((keyword) => searchable.includes(keyword))) {
      return stage.slug;
    }
  }

  return "guard";
}

function useTechniqueScenes() {
  const [scenes, setScenes] = useState<SceneEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const publishedRes = await fetch("/api/techniques").catch(() => null);
        const publishedJson =
          publishedRes && publishedRes.ok
            ? ((await publishedRes.json()) as { techniques?: SceneEntry[] })
            : { techniques: [] as SceneEntry[] };

        const fromApi = publishedJson.techniques ?? [];
        const baseScenes = fromApi.length > 0 ? fromApi : buildLaunchStaticScenes();

        const dedupedScenes = Array.from(
          baseScenes.reduce<Map<string, SceneEntry>>((acc, scene) => {
            const slug = deriveTechniqueSlug(scene);
            const alias = TECHNIQUE_ALIASES[slug] ?? slug;
            acc.set(alias, scene);
            return acc;
          }, new Map()),
        ).map(([, scene]) => scene);

        const enriched = await Promise.all(
          dedupedScenes.map(async (scene) => {
            try {
              const detailRes = await fetch(scene.meta.dataPath);
              if (!detailRes.ok) return scene;

              const detail = (await detailRes.json()) as {
                meta?: Partial<SceneMeta>;
                markers?: Array<{ name: string; frame: number; type: "position" | "transition" }>;
              };

              const slug = deriveTechniqueSlug(scene);
              const override = TECHNIQUE_OVERRIDES[slug] ?? {};
              const launchSpec = LAUNCH_TECHNIQUE_BY_SLUG.get(slug);
              const markers = detail.markers ?? [];
              const firstPosition = markers.find((marker) => marker.type === "position")?.name;
              const lastPosition = [...markers].reverse().find((marker) => marker.type === "position")?.name;

              const nextScene: SceneEntry = {
                id: scene.id,
                meta: {
                  ...scene.meta,
                  ...detail.meta,
                  ...override,
                  slug,
                  name: scene.meta.name ?? detail.meta?.name ?? launchSpec?.label ?? slug,
                  transitionId: detail.meta?.transitionId ?? scene.meta.transitionId,
                  description: detail.meta?.description ?? scene.meta.description,
                  tags: detail.meta?.tags ?? launchSpec?.tags ?? scene.meta.tags,
                  positionCategory:
                    override.positionCategory ??
                    launchSpec?.positionCategory ??
                    detail.meta?.positionCategory ??
                    scene.meta.positionCategory,
                  startingPosition:
                    override.startingPosition ??
                    launchSpec?.startingPosition ??
                    detail.meta?.startingPosition ??
                    scene.meta.startingPosition ??
                    firstPosition,
                  endingPosition:
                    override.endingPosition ??
                    launchSpec?.endingPosition ??
                    detail.meta?.endingPosition ??
                    scene.meta.endingPosition ??
                    lastPosition,
                  source: normalizeSource(
                    override.source ?? launchSpec?.source ?? detail.meta?.source ?? scene.meta.source ?? "GrappleMap",
                  ),
                  totalFrames: detail.meta?.totalFrames ?? scene.meta.totalFrames,
                  difficulty:
                    override.difficulty ??
                    launchSpec?.difficulty ??
                    detail.meta?.difficulty ??
                    scene.meta.difficulty,
                  curriculumStage:
                    override.curriculumStage ??
                    launchSpec?.curriculumStage ??
                    detail.meta?.curriculumStage ??
                    scene.meta.curriculumStage,
                  curriculumOrder:
                    override.curriculumOrder ??
                    launchSpec?.curriculumOrder ??
                    detail.meta?.curriculumOrder ??
                    scene.meta.curriculumOrder,
                },
              };

              return nextScene;
            } catch {
              return scene;
            }
          }),
        );

        if (!cancelled) {
          setScenes(enriched);
        }
      } catch {
        if (!cancelled) setScenes([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return scenes;
}

function TechniqueCard({
  scene,
  onExpand,
  onClick,
}: {
  scene: SceneEntry;
  onExpand: () => void;
  onClick: () => void;
}) {
  const desc = scene.meta.description?.[1] ?? scene.meta.description?.[0] ?? "";
  const sceneKey = toStudioKeyPart(scene.id || scene.meta.name);
  const stage = deriveStage(scene);
  const tags = scene.meta.tags ?? [];

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col bg-charcoal rounded-3xl overflow-hidden border border-moss/20 hover:border-moss/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div
        className="relative w-full h-72"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <TechniqueViewer className="w-full h-full" sequencePath={scene.meta.dataPath} controlsMode="compact" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent pointer-events-none" />
        <button
          type="button"
          className="absolute top-3 right-3 z-10 bg-charcoal/80 text-cream/70 hover:text-cream rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(event) => {
            event.stopPropagation();
            onExpand();
          }}
          aria-label="Fullscreen"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      <div className="px-5 py-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.18em] bg-moss/20 text-moss px-2 py-0.5 rounded-full">
            {TECHNIQUE_STAGES.find((item) => item.slug === stage)?.label ?? stage}
          </span>
          {scene.meta.positionCategory ? (
            <span className="text-[10px] uppercase tracking-[0.18em] text-cream/40">
              {scene.meta.positionCategory.replace(/-/g, " ")}
            </span>
          ) : null}
          {typeof scene.meta.totalFrames === "number" ? (
            <span className="text-[10px] uppercase tracking-[0.18em] text-cream/40">
              {scene.meta.totalFrames} frames
            </span>
          ) : null}
        </div>

        <h3 className="font-heading text-cream text-base capitalize leading-tight">
          <StudioText
            k={`techniques.${sceneKey}.name`}
            defaultText={scene.meta.name}
            as="span"
            className="inline"
          />
        </h3>

        {desc ? (
          <p className="text-cream/60 text-xs font-body line-clamp-2">
            <StudioText
              k={`techniques.${sceneKey}.description.short`}
              defaultText={desc}
              as="span"
              className="inline"
            />
          </p>
        ) : null}

        <div className="mt-1 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-cream/45">
          <span>{scene.meta.startingPosition ?? "Entry"}</span>
          <span>→</span>
          <span>{scene.meta.endingPosition ?? "Finish"}</span>
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-[0.15em] bg-moss/20 text-moss px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

const TechniqueLibrary = () => {
  const scenes = useTechniqueScenes();
  const [selected, setSelected] = useState<React.ComponentProps<typeof TechniqueModal>["scene"]>(null);
  const [modalMode, setModalMode] = useState<"default" | "fullscreen">("default");
  const [selectedStage, setSelectedStage] = useState<TechniqueStage["slug"]>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredScenes = useMemo(() => {
    return scenes
      .filter((scene) => {
        const searchable = [
          scene.meta.name,
          ...(Array.isArray(scene.meta.tags) ? scene.meta.tags : []),
          scene.meta.startingPosition ?? "",
          scene.meta.endingPosition ?? "",
          scene.meta.source ?? "",
        ]
          .join(" ")
          .toLowerCase();
        const matchesStage = selectedStage === "all" || deriveStage(scene) === selectedStage;
        const matchesSearch = !searchQuery || searchable.includes(searchQuery.toLowerCase());
        return matchesStage && matchesSearch;
      })
      .sort((left, right) => {
        const leftOrder = left.meta.curriculumOrder ?? STAGE_ORDER[deriveStage(left)] * 10;
        const rightOrder = right.meta.curriculumOrder ?? STAGE_ORDER[deriveStage(right)] * 10;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        if ((left.meta.transitionId ?? 0) !== (right.meta.transitionId ?? 0)) {
          return (left.meta.transitionId ?? 0) - (right.meta.transitionId ?? 0);
        }
        return left.meta.name.localeCompare(right.meta.name);
      });
  }, [scenes, searchQuery, selectedStage]);

  const stageCounts = useMemo(() => {
    return scenes.reduce<Record<TechniqueStage["slug"], number>>(
      (counts, scene) => {
        const stage = deriveStage(scene);
        counts[stage] += 1;
        counts.all += 1;
        return counts;
      },
      {
        all: 0,
        standing: 0,
        guard: 0,
        escapes: 0,
        sweeps: 0,
        passing: 0,
        control: 0,
        submissions: 0,
      },
    );
  }, [scenes]);

  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <main className="max-w-6xl mx-auto px-6 pt-32">
        <StudioBlock id="techniques.header" label="Header" page="TechniqueLibrary">
          <SectionHeader
            eyebrow={
              <StudioText
                k="techniques.header.eyebrow"
                defaultText="Technique Library"
                as="span"
                className="inline"
              />
            }
            title={
              <StudioText
                k="techniques.header.title"
                defaultText="Techniques"
                as="span"
                className="inline"
              />
            }
            className="mb-6"
          />
          <p className="font-body text-sm text-charcoal/70 max-w-2xl mb-10 leading-relaxed">
            <StudioText
              k="techniques.header.intro"
              defaultText="Browse techniques by stage, position, or finish. New sequences are added as the curriculum grows."
              as="span"
              className="inline"
              multiline
            />
          </p>
        </StudioBlock>

        <MotionDiv className="flex flex-col gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" size={16} />
            <Input
              placeholder="Search techniques, tags, positions, or source..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10 bg-white/60 border-moss/20"
            />
          </div>

          <Tabs value={selectedStage} onValueChange={(value) => setSelectedStage(value as TechniqueStage["slug"])}>
            <TabsList className="bg-white/50 flex flex-wrap gap-1 h-auto p-1">
              {TECHNIQUE_STAGES.map((stage) => (
                <TabsTrigger key={stage.slug} value={stage.slug}>
                  {stage.label}
                  {stageCounts[stage.slug] ? ` (${stageCounts[stage.slug]})` : ""}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </MotionDiv>

        {scenes.length === 0 ? (
          <div className="text-charcoal/40 text-sm font-body py-16 text-center">
            Loading techniques…
          </div>
        ) : filteredScenes.length === 0 ? (
          <div className="text-charcoal/40 text-sm font-body py-16 text-center">
            No techniques match that filter.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                {selectedStage === "all"
                  ? "All techniques"
                  : TECHNIQUE_STAGES.find((stage) => stage.slug === selectedStage)?.label ?? "Techniques"}
              </div>
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/45">
                {filteredScenes.length} item{filteredScenes.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredScenes.map((scene) => (
                <motion.div key={scene.id} layout>
                  <TechniqueCard
                    scene={scene}
                    onClick={() => {
                      setSelected(scene);
                      setModalMode("default");
                    }}
                    onExpand={() => {
                      setSelected(scene);
                      setModalMode("fullscreen");
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      <TechniqueModal
        scene={selected}
        mode={modalMode}
        onModeChange={setModalMode}
        onClose={() => {
          setSelected(null);
          setModalMode("default");
        }}
      />
    </MotionPage>
  );
};

export default TechniqueLibrary;
