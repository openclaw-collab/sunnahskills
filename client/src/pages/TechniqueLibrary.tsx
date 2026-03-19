import React, { useEffect, useRef, useState } from "react";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { TechniqueViewer } from "@/components/grapplemap/TechniqueViewer";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";
import { X, Maximize2 } from "lucide-react";

type SceneMeta = {
  transitionId?: number;
  name: string;
  tags: string[];
  description: string[];
  dataPath: string;
};

type SceneEntry = {
  id: string;
  meta: SceneMeta;
};

const CATEGORY_DEFINITIONS = [
  { slug: "guards", label: "Guards", keywords: ["guard"] },
  { slug: "submissions", label: "Submissions", keywords: ["submission", "choke", "armbar", "triangle", "kimura"] },
  { slug: "escapes", label: "Escapes", keywords: ["escape"] },
  { slug: "passes", label: "Passes", keywords: ["pass"] },
  { slug: "sweeps", label: "Sweeps", keywords: ["sweep"] },
  { slug: "takedowns", label: "Takedowns", keywords: ["takedown", "throw", "trip", "shot", "wrestling"] },
  { slug: "transitions", label: "Transitions", keywords: ["transition", "transitioning"] },
] as const;

function toStudioKeyPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function getTechniqueCategorySlug(scene: SceneEntry) {
  const searchable = [scene.meta.name, ...scene.meta.tags].join(" ").toLowerCase();
  const matched = CATEGORY_DEFINITIONS.find((category) =>
    category.keywords.some((keyword) => searchable.includes(keyword)),
  );
  return matched?.slug ?? "other";
}

function useScenesCatalog() {
  const [scenes, setScenes] = useState<SceneEntry[]>([]);
  useEffect(() => {
    fetch("/data/scenes.json")
      .then((r) => r.json())
      .then((data: { scenes: Record<string, { meta: SceneMeta }> }) => {
        const entries = Object.entries(data.scenes).map(([id, val]) => ({
          id,
          meta: val.meta,
        }));
        setScenes(entries);
      })
      .catch(() => {});
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
  const desc = scene.meta.description[1] ?? "";
  const sceneKey = toStudioKeyPart(scene.id || scene.meta.name);

  return (
    <div
      className="group relative flex flex-col bg-charcoal rounded-3xl overflow-hidden border border-moss/20 hover:border-moss/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* 3D Viewer */}
      <div className="relative w-full h-52">
        <TechniqueViewer className="w-full h-full" sequencePath={scene.meta.dataPath} />
        <button
          className="absolute top-3 right-3 z-10 bg-charcoal/80 text-cream/70 hover:text-cream rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          aria-label="Fullscreen"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 flex flex-col gap-2 flex-1">
        <p className="font-mono-label text-[10px] uppercase tracking-[0.2em] text-moss">
          Technique
        </p>
        <h3 className="font-heading text-cream text-base capitalize leading-tight">
          <StudioText
            k={`techniques.${sceneKey}.name`}
            defaultText={scene.meta.name}
            as="span"
            className="inline"
          />
        </h3>
        {desc && (
          <p className="text-cream/60 text-xs font-body line-clamp-2">
            <StudioText
              k={`techniques.${sceneKey}.description.short`}
              defaultText={desc}
              as="span"
              className="inline"
            />
          </p>
        )}
        {scene.meta.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {scene.meta.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-[0.15em] bg-moss/20 text-moss px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailPanel({
  scene,
  onClose,
}: {
  scene: SceneEntry;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const sceneKey = toStudioKeyPart(scene.id || scene.meta.name);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        className="relative ml-auto h-full w-full max-w-lg bg-charcoal border-l border-moss/20 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-moss/15">
          <p className="font-mono-label text-[10px] uppercase tracking-[0.2em] text-moss">
            Technique Detail
          </p>
          <button
            className="text-cream/60 hover:text-cream transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="w-full h-72 flex-shrink-0">
          <TechniqueViewer className="w-full h-full" sequencePath={scene.meta.dataPath} />
        </div>

        <div className="px-6 py-6 space-y-4 flex-1">
          <h2 className="font-heading text-cream text-2xl capitalize">
            <StudioText
              k={`techniques.${sceneKey}.name`}
              defaultText={scene.meta.name}
              as="span"
              className="inline"
            />
          </h2>

          {scene.meta.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {scene.meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-[0.15em] bg-moss/20 text-moss px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2 text-sm font-body text-cream/70">
            {scene.meta.description.map((line, i) => (
              <p key={i}>
                <StudioText
                  k={`techniques.${sceneKey}.description.line_${i + 1}`}
                  defaultText={line}
                  as="span"
                  className="inline"
                  multiline
                />
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FullscreenModal({
  scene,
  onClose,
}: {
  scene: SceneEntry;
  onClose: () => void;
}) {
  const sceneKey = toStudioKeyPart(scene.id || scene.meta.name);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-charcoal flex flex-col" aria-modal="true" role="dialog">
      <div className="flex items-center justify-between px-6 py-4 border-b border-moss/15">
        <p className="font-mono-label text-[10px] uppercase tracking-[0.2em] text-moss capitalize">
          <StudioText
            k={`techniques.${sceneKey}.name`}
            defaultText={scene.meta.name}
            as="span"
            className="inline"
          />
        </p>
        <button
          className="text-cream/60 hover:text-cream transition-colors"
          onClick={onClose}
          aria-label="Close fullscreen"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1">
        <TechniqueViewer className="w-full h-full" sequencePath={scene.meta.dataPath} />
      </div>
    </div>
  );
}

const TechniqueLibrary = () => {
  const scenes = useScenesCatalog();
  const [selected, setSelected] = useState<SceneEntry | null>(null);
  const [fullscreen, setFullscreen] = useState<SceneEntry | null>(null);

  const groupedScenes = scenes.reduce<Record<string, SceneEntry[]>>((acc, scene) => {
    const categorySlug = getTechniqueCategorySlug(scene);
    if (!acc[categorySlug]) {
      acc[categorySlug] = [];
    }
    acc[categorySlug].push(scene);
    return acc;
  }, {});

  const categoryOrder = [
    ...CATEGORY_DEFINITIONS.map((category) => category.slug),
    "other",
  ];

  const presentCategorySlugs = categoryOrder.filter(
    (slug) => (groupedScenes[slug] ?? []).length > 0,
  );

  return (
    <div className="bg-cream min-h-screen pb-24">
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
                defaultText="GrappleMap Sequences"
                as="span"
                className="inline"
              />
            }
            className="mb-10"
          />
          <p className="font-body text-sm text-charcoal/70 max-w-2xl mb-10">
            <StudioText
              k="techniques.header.intro"
              defaultText="Explore curated sequences from the training curriculum. Browse techniques, tap a card for details, or expand to fullscreen."
              as="span"
              className="inline"
              multiline
            />
          </p>
        </StudioBlock>

        {scenes.length === 0 ? (
          <div className="text-charcoal/40 text-sm font-body py-16 text-center">
            Loading techniques…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {presentCategorySlugs.map((categorySlug) => (
              <StudioBlock
                key={categorySlug}
                id={`techniques.${categorySlug}`}
                label={`Category ${categorySlug}`}
                page="TechniqueLibrary"
              >
                {groupedScenes[categorySlug].map((scene) => (
                  <TechniqueCard
                    key={scene.id}
                    scene={scene}
                    onClick={() => setSelected(scene)}
                    onExpand={() => setFullscreen(scene)}
                  />
                ))}
              </StudioBlock>
            ))}
          </div>
        )}
      </main>

      {selected && !fullscreen && (
        <DetailPanel scene={selected} onClose={() => setSelected(null)} />
      )}

      {fullscreen && (
        <FullscreenModal scene={fullscreen} onClose={() => setFullscreen(null)} />
      )}
    </div>
  );
};

export default TechniqueLibrary;
