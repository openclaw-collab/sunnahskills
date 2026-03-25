import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Eye, Plus, Save, Search, Sparkles, Trash2 } from "lucide-react";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TechniqueViewer } from "@/components/grapplemap/TechniqueViewer";
import { AdminShell, type AdminUser } from "@/components/admin/AdminShell";
import { POSITION_CATEGORIES, type Marker, type PositionCategory } from "@/lib/grapplemap-types";

type AdminMeResponse = { ok: true; user: AdminUser } | { ok: false };
type LibraryMode = "positions" | "transitions";
type ComposerTab = "start" | "before" | "after" | "search" | "review";
type SequenceDifficulty = "beginner" | "intermediate" | "advanced";
type BuilderLibraryType = "position" | "transition" | "note";

type LibraryItemSummary = {
  id: string;
  builderKey?: string;
  sourceId: number;
  graphNodeId?: number | null;
  graphTransitionId?: number | null;
  libraryType: "position" | "transition";
  name: string;
  displayName?: string;
  slug: string;
  tags: string[];
  props: string[];
  frameCount: number;
  previewPath: string;
  family?: string;
  role?: string;
  routeLabel?: string;
  composerTitle?: string;
  composerSubtitle?: string;
  searchTerms?: string[];
  incomingCount?: number;
  outgoingCount?: number;
  fromNodeId?: number | null;
  toNodeId?: number | null;
  fromName?: string;
  toName?: string;
  fromDisplayName?: string;
  toDisplayName?: string;
  fromFamily?: string;
  toFamily?: string;
  reverse?: boolean;
  bidirectional?: boolean;
};

type GraphLinkStep = {
  transitionId: number;
  reverse: boolean;
};

type GraphLinksResponse = {
  nodes?: Array<{
    id: number;
    incoming: GraphLinkStep[];
    outgoing: GraphLinkStep[];
  }>;
};

type LibraryItemPreview = {
  meta: LibraryItemSummary;
  markers: Marker[];
  frames: number[][][][];
};

type SequenceMarker = Marker & {
  sourceId?: string;
  libraryType?: BuilderLibraryType;
  previewPath?: string;
  graphNodeId?: number | null;
  graphTransitionId?: number | null;
  fromNodeId?: number | null;
  toNodeId?: number | null;
  family?: string;
  fromDisplayName?: string;
  toDisplayName?: string;
  reverse?: boolean;
};

type SavedSequence = {
  id: string;
  meta: {
    id: string;
    slug: string;
    name: string;
    positionCategory: string;
    startingPosition: string;
    endingPosition: string;
    difficulty: SequenceDifficulty;
    description: string[];
    dataPath?: string;
    totalFrames?: number;
  };
  markers: SequenceMarker[];
  frames: number[][][][];
  verified: boolean;
};

type CatalogResponse = {
  positions?: LibraryItemSummary[];
  transitions?: LibraryItemSummary[];
};

type BuiltSequence = {
  frames: number[][][][];
  markers: SequenceMarker[];
};

const DIFFICULTY_OPTIONS: SequenceDifficulty[] = ["beginner", "intermediate", "advanced"];
const CATEGORY_OPTIONS: Array<{ slug: PositionCategory | "mixed"; label: string }> = [
  { slug: "mixed", label: "Mixed" },
  ...POSITION_CATEGORIES,
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toDisplayText(value: string) {
  return value
    .replace(/\\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getItemLabel(item: Pick<LibraryItemSummary, "displayName" | "name">) {
  return toDisplayText(item.displayName || item.name);
}

function getComposerTitle(item: LibraryItemSummary) {
  return toDisplayText(item.composerTitle || item.routeLabel || item.displayName || item.name);
}

function getTransitionBuilderKey(item: Pick<LibraryItemSummary, "id" | "reverse" | "builderKey">) {
  return item.builderKey ?? `${item.id}:${item.reverse ? "reverse" : "forward"}`;
}

function getLibraryItemKey(item: Pick<LibraryItemSummary, "id" | "libraryType" | "reverse" | "builderKey">) {
  return item.libraryType === "transition" ? getTransitionBuilderKey(item) : item.id;
}

function getComposerSubtitle(item: LibraryItemSummary) {
  if (item.composerSubtitle) return toDisplayText(item.composerSubtitle);
  if (item.libraryType === "transition") {
    return `From ${item.fromDisplayName || "unknown start"} to ${item.toDisplayName || "unknown finish"}`;
  }
  return `${item.outgoingCount ?? 0} outgoing routes • ${item.incomingCount ?? 0} incoming routes`;
}

function getDirectionHint(item: LibraryItemSummary) {
  if (item.libraryType !== "transition") return null;
  return item.reverse ? "Reverse route" : "Forward route";
}

function getMarkerLabel(marker: SequenceMarker) {
  return toDisplayText(marker.name);
}

function reindexMarkers(markers: SequenceMarker[]) {
  return markers.map((marker, index) => ({ ...marker, frame: index }));
}

function deriveCategory(markers: SequenceMarker[]): PositionCategory | "mixed" {
  const firstPosition = markers.find((marker) => marker.type === "position");
  const searchable = `${firstPosition?.name ?? ""} ${firstPosition?.family ?? ""}`.toLowerCase();

  if (searchable.includes("mount")) return "mount";
  if (searchable.includes("half")) return "half-guard";
  if (searchable.includes("back")) return "back-control";
  if (searchable.includes("side")) return "side-control";
  if (searchable.includes("stand")) return "standing";
  if (searchable.includes("guard")) return "closed-guard";
  return "mixed";
}

function buildDescription(sequenceName: string, markers: SequenceMarker[]) {
  const path = markers.map((marker) => getMarkerLabel(marker));
  return [
    `${sequenceName} is part of the Sunnah Skills techniques library.`,
    path.length > 0 ? `Path: ${path.join(" -> ")}.` : "Sequence path is still being defined.",
  ];
}

function buildPreviewFromMarkers(
  markers: SequenceMarker[],
  previewCache: Record<string, LibraryItemPreview>,
  fallbackFrames: number[][][][] = [],
): BuiltSequence {
  if (markers.length === 0) {
    return { frames: [], markers: [] };
  }

  const frames: number[][][][] = [];
  const builtMarkers: SequenceMarker[] = [];

  for (const marker of markers) {
    if (!marker.previewPath || marker.libraryType === "note") {
      builtMarkers.push({
        ...marker,
        frame: Math.max(0, frames.length - 1),
      });
      continue;
    }

    const asset = previewCache[marker.previewPath];
    if (!asset) continue;

    const assetFrames = marker.reverse ? [...asset.frames].reverse() : asset.frames;
    const assetMarkers = marker.reverse
      ? asset.markers.map((assetMarker) => ({
          ...assetMarker,
          frame: Math.max(0, asset.frames.length - 1 - assetMarker.frame),
        }))
      : asset.markers;
    const startFrame = frames.length;
    assetFrames.forEach((frame) => frames.push(frame));
    const markerOffset = assetMarkers[0]?.frame ?? 0;

    builtMarkers.push({
      ...marker,
      frame: startFrame + Math.min(markerOffset, Math.max(0, assetFrames.length - 1)),
    });
  }

  if (frames.length === 0 && fallbackFrames.length > 0) {
    return {
      frames: fallbackFrames,
      markers: markers.map((marker, index) => ({ ...marker, frame: Math.min(index, fallbackFrames.length - 1) })),
    };
  }

  return { frames, markers: builtMarkers };
}

function applyDirectionalTransition(item: LibraryItemSummary, reverse: boolean) {
  if (item.libraryType !== "transition") return item;
  return {
    ...item,
    builderKey: `${item.id}:${reverse ? "reverse" : "forward"}`,
    reverse,
    fromNodeId: reverse ? item.toNodeId ?? null : item.fromNodeId ?? null,
    toNodeId: reverse ? item.fromNodeId ?? null : item.toNodeId ?? null,
    fromDisplayName: reverse ? item.toDisplayName : item.fromDisplayName,
    toDisplayName: reverse ? item.fromDisplayName : item.toDisplayName,
    fromFamily: reverse ? item.toFamily : item.fromFamily,
    toFamily: reverse ? item.fromFamily : item.toFamily,
    composerSubtitle: reverse
      ? `Reverse route from ${item.toDisplayName || "unknown start"} to ${item.fromDisplayName || "unknown finish"}`
      : item.composerSubtitle,
  } satisfies LibraryItemSummary;
}

function materializePreviewAsset(preview: LibraryItemPreview, reverse: boolean) {
  if (!reverse) return preview;
  return {
    ...preview,
    markers: preview.markers.map((marker) => ({
      ...marker,
      frame: Math.max(0, preview.frames.length - 1 - marker.frame),
    })),
    frames: [...preview.frames].reverse(),
  } satisfies LibraryItemPreview;
}

function markerFromPosition(item: LibraryItemSummary, index: number): SequenceMarker {
  return {
    name: item.displayName || item.name,
    frame: index,
    type: "position",
    sourceId: item.id,
    libraryType: "position",
    previewPath: item.previewPath,
    graphNodeId: item.graphNodeId ?? null,
    family: item.family,
  };
}

function markerFromTransition(item: LibraryItemSummary, index: number): SequenceMarker {
  return {
    name: item.displayName || item.name,
    frame: index,
    type: "transition",
    sourceId: getTransitionBuilderKey(item),
    libraryType: "transition",
    previewPath: item.previewPath,
    graphTransitionId: item.graphTransitionId ?? null,
    fromNodeId: item.fromNodeId ?? null,
    toNodeId: item.toNodeId ?? null,
    fromDisplayName: item.fromDisplayName,
    toDisplayName: item.toDisplayName,
    family: item.toFamily || item.fromFamily,
    reverse: Boolean(item.reverse),
  };
}

export default function AdminSequences() {
  const [, setLocation] = useLocation();
  const previewRequests = useRef(new Map<string, Promise<LibraryItemPreview | null>>());
  const [me, setMe] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [positions, setPositions] = useState<LibraryItemSummary[]>([]);
  const [transitions, setTransitions] = useState<LibraryItemSummary[]>([]);
  const [graphLinks, setGraphLinks] = useState<Map<number, { incoming: GraphLinkStep[]; outgoing: GraphLinkStep[] }>>(new Map());
  const [sequences, setSequences] = useState<SavedSequence[]>([]);
  const [previewCache, setPreviewCache] = useState<Record<string, LibraryItemPreview>>({});
  const [catalogMode, setCatalogMode] = useState<LibraryMode>("positions");
  const [workflowTab, setWorkflowTab] = useState<ComposerTab>("start");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [selectedItem, setSelectedItem] = useState<LibraryItemSummary | null>(null);
  const [selectedItemPreview, setSelectedItemPreview] = useState<LibraryItemPreview | null>(null);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [sequenceMarkers, setSequenceMarkers] = useState<SequenceMarker[]>([]);
  const [sequenceName, setSequenceName] = useState("");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState<SequenceDifficulty>("beginner");
  const [positionCategory, setPositionCategory] = useState<PositionCategory | "mixed">("mixed");
  const [published, setPublished] = useState(false);
  const [customTransition, setCustomTransition] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const fetchCatalog = useCallback(async () => {
    const [positionsRes, transitionsRes, linksRes] = await Promise.all([
      fetch("/data/library/admin/positions.json"),
      fetch("/data/library/admin/transitions.json"),
      fetch("/data/library/admin/graph-links.json"),
    ]);

    const positionsData = (await positionsRes.json().catch(() => null)) as CatalogResponse | null;
    const transitionsData = (await transitionsRes.json().catch(() => null)) as CatalogResponse | null;
    const linksData = (await linksRes.json().catch(() => null)) as GraphLinksResponse | null;
    setPositions(positionsData?.positions ?? []);
    setTransitions(transitionsData?.transitions ?? []);
    setGraphLinks(
      new Map(
        (linksData?.nodes ?? []).map((node) => [
          node.id,
          { incoming: node.incoming ?? [], outgoing: node.outgoing ?? [] },
        ]),
      ),
    );
  }, []);

  const fetchSequences = useCallback(async () => {
    const response = await fetch("/api/admin/sequences");
    const data = (await response.json().catch(() => null)) as { sequences?: SavedSequence[] } | null;
    setSequences(data?.sequences ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setAuthLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        const json = (await res.json().catch(() => null)) as AdminMeResponse | null;
        if (!res.ok || !json || json.ok === false) {
          setLocation("/admin");
          return;
        }
        if (cancelled) return;
        setMe(json.user);
        await Promise.all([fetchCatalog(), fetchSequences()]);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchCatalog, fetchSequences, setLocation]);

  const positionsByNodeId = useMemo(
    () => new Map(positions.filter((item) => item.graphNodeId != null).map((item) => [item.graphNodeId as number, item])),
    [positions],
  );

  const positionsByName = useMemo(() => {
    const map = new Map<string, LibraryItemSummary>();
    positions.forEach((item) => {
      map.set(toDisplayText(item.name).toLowerCase(), item);
      map.set(getItemLabel(item).toLowerCase(), item);
    });
    return map;
  }, [positions]);

  const transitionsByName = useMemo(() => {
    const map = new Map<string, LibraryItemSummary>();
    transitions.forEach((item) => {
      map.set(toDisplayText(item.name).toLowerCase(), item);
      map.set(getItemLabel(item).toLowerCase(), item);
    });
    return map;
  }, [transitions]);

  const transitionsByGraphId = useMemo(
    () => new Map(transitions.filter((item) => item.graphTransitionId != null).map((item) => [item.graphTransitionId as number, item])),
    [transitions],
  );

  const directOutgoingTransitionsByNode = useMemo(() => {
    const map = new Map<number, LibraryItemSummary[]>();

    const pushRoute = (nodeId: number, transition: LibraryItemSummary) => {
      const current = map.get(nodeId) ?? [];
      current.push(transition);
      map.set(nodeId, current);
    };

    transitions.forEach((transition) => {
      if (transition.fromNodeId != null) {
        pushRoute(transition.fromNodeId, applyDirectionalTransition(transition, false));
      }
      if (transition.bidirectional && transition.toNodeId != null) {
        pushRoute(transition.toNodeId, applyDirectionalTransition(transition, true));
      }
    });

    map.forEach((items, nodeId) => {
      const deduped = Array.from(
        items.reduce<Map<string, LibraryItemSummary>>((acc, item) => {
          acc.set(getTransitionBuilderKey(item), item);
          return acc;
        }, new Map()).values(),
      ).sort((left, right) => getComposerTitle(left).localeCompare(getComposerTitle(right)));
      map.set(nodeId, deduped);
    });

    return map;
  }, [transitions]);

  const directIncomingTransitionsByNode = useMemo(() => {
    const map = new Map<number, LibraryItemSummary[]>();

    const pushRoute = (nodeId: number, transition: LibraryItemSummary) => {
      const current = map.get(nodeId) ?? [];
      current.push(transition);
      map.set(nodeId, current);
    };

    transitions.forEach((transition) => {
      if (transition.toNodeId != null) {
        pushRoute(transition.toNodeId, applyDirectionalTransition(transition, false));
      }
      if (transition.bidirectional && transition.fromNodeId != null) {
        pushRoute(transition.fromNodeId, applyDirectionalTransition(transition, true));
      }
    });

    map.forEach((items, nodeId) => {
      const deduped = Array.from(
        items.reduce<Map<string, LibraryItemSummary>>((acc, item) => {
          acc.set(getTransitionBuilderKey(item), item);
          return acc;
        }, new Map()).values(),
      ).sort((left, right) => getComposerTitle(left).localeCompare(getComposerTitle(right)));
      map.set(nodeId, deduped);
    });

    return map;
  }, [transitions]);

  const ensurePreviewAsset = useCallback(
    async (previewPath: string) => {
      if (previewCache[previewPath]) {
        return previewCache[previewPath];
      }

      const pending = previewRequests.current.get(previewPath);
      if (pending) {
        return pending;
      }

      const request = (async () => {
        const response = await fetch(previewPath);
        if (!response.ok) return null;
        const preview = (await response.json().catch(() => null)) as LibraryItemPreview | null;
        if (!preview) return null;
        setPreviewCache((current) => (current[previewPath] ? current : { ...current, [previewPath]: preview }));
        return preview;
      })().finally(() => {
        previewRequests.current.delete(previewPath);
      });

      previewRequests.current.set(previewPath, request);
      return request;
    },
    [previewCache],
  );

  const loadLibraryItem = useCallback(
    async (item: LibraryItemSummary) => {
      setSelectedItem(item);
      setLoadingPreview(true);
      try {
        const preview = await ensurePreviewAsset(item.previewPath);
        setSelectedItemPreview(preview ? materializePreviewAsset(preview, Boolean(item.reverse)) : null);
      } finally {
        setLoadingPreview(false);
      }
    },
    [ensurePreviewAsset],
  );

  useEffect(() => {
    const loadSequencePreviews = async () => {
      const previewablePaths = sequenceMarkers
        .filter((marker) => marker.previewPath && marker.libraryType !== "note")
        .map((marker) => marker.previewPath as string);

      await Promise.all(previewablePaths.map((previewPath) => ensurePreviewAsset(previewPath)));
    };

    void loadSequencePreviews();
  }, [ensurePreviewAsset, sequenceMarkers]);

  const selectedSequence = useMemo(
    () => sequences.find((sequence) => sequence.id === selectedSequenceId) ?? null,
    [sequences, selectedSequenceId],
  );

  const builtSequence = useMemo(
    () => buildPreviewFromMarkers(sequenceMarkers, previewCache, selectedSequence?.frames ?? []),
    [previewCache, selectedSequence?.frames, sequenceMarkers],
  );

  const sequencePreviewData = useMemo(() => {
    if (!builtSequence.frames.length) return null;
    return { frames: builtSequence.frames, markers: builtSequence.markers };
  }, [builtSequence]);

  const savedPreviewData = useMemo(() => {
    if (!selectedSequence) return null;
    return { frames: selectedSequence.frames, markers: selectedSequence.markers };
  }, [selectedSequence]);

  const currentPositionNodeId = useMemo(() => {
    const reversed = [...sequenceMarkers].reverse();
    const lastPosition = reversed.find((marker) => marker.type === "position" && marker.graphNodeId != null);
    if (lastPosition?.graphNodeId != null) return lastPosition.graphNodeId;
    const lastTransition = reversed.find((marker) => marker.type === "transition" && marker.toNodeId != null);
    return lastTransition?.toNodeId ?? null;
  }, [sequenceMarkers]);

  const firstPositionNodeId = useMemo(() => {
    const firstPosition = sequenceMarkers.find((marker) => marker.type === "position" && marker.graphNodeId != null);
    if (firstPosition?.graphNodeId != null) return firstPosition.graphNodeId;
    const firstTransition = sequenceMarkers.find((marker) => marker.type === "transition" && marker.fromNodeId != null);
    return firstTransition?.fromNodeId ?? null;
  }, [sequenceMarkers]);

  const outgoingTransitionsByNode = useMemo(() => {
    const map = new Map<number, LibraryItemSummary[]>();
    const allNodeIds = new Set<number>([
      ...Array.from(graphLinks.keys()),
      ...Array.from(directOutgoingTransitionsByNode.keys()),
    ]);
    allNodeIds.forEach((nodeId) => {
      const graphItems = (graphLinks.get(nodeId)?.outgoing ?? [])
        .map((step) => {
          const transition = transitionsByGraphId.get(step.transitionId);
          return transition ? applyDirectionalTransition(transition, step.reverse) : null;
        })
        .filter((item): item is LibraryItemSummary => item != null);
      const directItems = directOutgoingTransitionsByNode.get(nodeId) ?? [];
      const merged = Array.from(
        [...graphItems, ...directItems].reduce<Map<string, LibraryItemSummary>>((acc, item) => {
          acc.set(getTransitionBuilderKey(item), item);
          return acc;
        }, new Map()).values(),
      ).sort((left, right) => getComposerTitle(left).localeCompare(getComposerTitle(right)));
      map.set(nodeId, merged);
    });
    return map;
  }, [directOutgoingTransitionsByNode, graphLinks, transitionsByGraphId]);

  const incomingTransitionsByNode = useMemo(() => {
    const map = new Map<number, LibraryItemSummary[]>();
    const allNodeIds = new Set<number>([
      ...Array.from(graphLinks.keys()),
      ...Array.from(directIncomingTransitionsByNode.keys()),
    ]);
    allNodeIds.forEach((nodeId) => {
      const graphItems = (graphLinks.get(nodeId)?.incoming ?? [])
        .map((step) => {
          const transition = transitionsByGraphId.get(step.transitionId);
          return transition ? applyDirectionalTransition(transition, step.reverse) : null;
        })
        .filter((item): item is LibraryItemSummary => item != null);
      const directItems = directIncomingTransitionsByNode.get(nodeId) ?? [];
      const merged = Array.from(
        [...graphItems, ...directItems].reduce<Map<string, LibraryItemSummary>>((acc, item) => {
          acc.set(getTransitionBuilderKey(item), item);
          return acc;
        }, new Map()).values(),
      ).sort((left, right) => getComposerTitle(left).localeCompare(getComposerTitle(right)));
      map.set(nodeId, merged);
    });
    return map;
  }, [directIncomingTransitionsByNode, graphLinks, transitionsByGraphId]);

  const suggestedNextTransitions = useMemo(() => {
    if (currentPositionNodeId == null) return [];
    return outgoingTransitionsByNode.get(currentPositionNodeId) ?? [];
  }, [currentPositionNodeId, outgoingTransitionsByNode]);

  const suggestedPreviousTransitions = useMemo(() => {
    if (firstPositionNodeId == null) return [];
    return incomingTransitionsByNode.get(firstPositionNodeId) ?? [];
  }, [firstPositionNodeId, incomingTransitionsByNode]);

  const recommendedStartingPositions = useMemo(() => {
    return [...positions]
      .filter((item) => (item.graphNodeId != null ? (outgoingTransitionsByNode.get(item.graphNodeId)?.length ?? 0) > 0 : false))
      .sort((left, right) => {
        const outgoingDiff =
          (outgoingTransitionsByNode.get(right.graphNodeId as number)?.length ?? 0) -
          (outgoingTransitionsByNode.get(left.graphNodeId as number)?.length ?? 0);
        if (outgoingDiff !== 0) return outgoingDiff;
        return getItemLabel(left).localeCompare(getItemLabel(right));
      })
      .slice(0, 18);
  }, [outgoingTransitionsByNode, positions]);

  const filterOptions = useMemo(() => {
    const counts = new Map<string, number>();
    const source = catalogMode === "positions" ? positions : transitions;
    source.forEach((item) => {
      const candidates =
        catalogMode === "positions"
          ? [item.family, ...item.tags, ...item.props]
          : [item.fromFamily, item.toFamily, ...item.tags, ...item.props];
      candidates.filter(Boolean).forEach((tag) => counts.set(tag as string, (counts.get(tag as string) ?? 0) + 1));
    });

    return [
      { slug: "all", label: "All" },
      ...Array.from(counts.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 8)
        .map(([slug]) => ({ slug, label: toDisplayText(slug) })),
    ];
  }, [catalogMode, positions, transitions]);

  useEffect(() => {
    if (!filterOptions.some((option) => option.slug === filterTag)) {
      setFilterTag("all");
    }
  }, [filterOptions, filterTag]);

  useEffect(() => {
    if (sequenceMarkers.length === 0 && (workflowTab === "before" || workflowTab === "after")) {
      setWorkflowTab("start");
    }
  }, [sequenceMarkers.length, workflowTab]);

  const filteredCatalog = useMemo(() => {
    const source = catalogMode === "positions" ? positions : transitions;
    const needle = searchQuery.trim().toLowerCase();

    return [...source]
      .filter((item) => {
        const searchable = [
          item.name,
          item.displayName,
          item.slug,
          item.family,
          item.fromFamily,
          item.toFamily,
          item.fromDisplayName,
          item.toDisplayName,
          item.routeLabel,
          item.composerTitle,
          item.composerSubtitle,
          ...(item.searchTerms ?? []),
          ...item.tags,
          ...item.props,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = !needle || searchable.includes(needle);
        const matchesFilter =
          filterTag === "all" ||
          item.family === filterTag ||
          item.fromFamily === filterTag ||
          item.toFamily === filterTag ||
          item.tags.includes(filterTag);

        return matchesSearch && matchesFilter;
      })
      .sort((left, right) => {
        if (catalogMode === "transitions" && currentPositionNodeId != null) {
          const leftCurrent = left.fromNodeId === currentPositionNodeId ? 1 : 0;
          const rightCurrent = right.fromNodeId === currentPositionNodeId ? 1 : 0;
          if (leftCurrent !== rightCurrent) return rightCurrent - leftCurrent;
        }

        if (catalogMode === "transitions") {
          const leftComplete = left.fromNodeId != null && left.toNodeId != null ? 1 : 0;
          const rightComplete = right.fromNodeId != null && right.toNodeId != null ? 1 : 0;
          if (leftComplete !== rightComplete) return rightComplete - leftComplete;
        }

        if (catalogMode === "positions") {
          const outgoingDiff = (right.outgoingCount ?? 0) - (left.outgoingCount ?? 0);
          if (outgoingDiff !== 0) return outgoingDiff;
        }

        return getItemLabel(left).localeCompare(getItemLabel(right));
      });
  }, [catalogMode, currentPositionNodeId, filterTag, positions, searchQuery, transitions]);

  const resetEditor = useCallback(() => {
    setSelectedSequenceId(null);
    setSequenceName("");
    setNotes("");
    setDifficulty("beginner");
    setPositionCategory("mixed");
    setPublished(false);
    setSequenceMarkers([]);
    setCustomTransition("");
    setFeedback(null);
  }, []);

  const addPositionToBuilder = useCallback(
    (item: LibraryItemSummary) => {
      setSequenceMarkers((current) => {
        const last = current[current.length - 1];
        if (last?.type === "position" && last.graphNodeId != null && last.graphNodeId === item.graphNodeId) {
          return current;
        }
        const next = [...current, markerFromPosition(item, current.length)];
        if (positionCategory === "mixed" && item.family) {
          setPositionCategory(deriveCategory(next));
        }
        return reindexMarkers(next);
      });
      setWorkflowTab("after");
      setFeedback(null);
    },
    [positionCategory],
  );

  const addTransitionToBuilder = useCallback(
    (item: LibraryItemSummary) => {
      setSequenceMarkers((current) => {
        const currentNodeId = (() => {
          const reversed = [...current].reverse();
          const lastPosition = reversed.find((marker) => marker.type === "position" && marker.graphNodeId != null);
          if (lastPosition?.graphNodeId != null) return lastPosition.graphNodeId;
          const lastTransition = reversed.find((marker) => marker.type === "transition" && marker.toNodeId != null);
          return lastTransition?.toNodeId ?? null;
        })();

        if (currentNodeId != null && item.fromNodeId != null && currentNodeId !== item.fromNodeId) {
          setFeedback(
            `This transition starts from ${item.fromDisplayName || "a different position"}, not the current end of your chain.`,
          );
          return current;
        }

        const next = [...current];

        if (currentNodeId == null && item.fromNodeId != null) {
          const origin = positionsByNodeId.get(item.fromNodeId);
          if (origin) next.push(markerFromPosition(origin, next.length));
        }

        next.push(markerFromTransition(item, next.length));

        if (item.toNodeId != null) {
          const destination = positionsByNodeId.get(item.toNodeId);
          const lastPosition = next[next.length - 2];
          if (
            destination &&
            !(lastPosition?.type === "position" && lastPosition.graphNodeId != null && lastPosition.graphNodeId === destination.graphNodeId)
          ) {
            next.push(markerFromPosition(destination, next.length));
          }
        }

        if (positionCategory === "mixed") {
          setPositionCategory(deriveCategory(next));
        }

        setFeedback(null);
        return reindexMarkers(next);
      });
      setWorkflowTab("after");
    },
    [positionCategory, positionsByNodeId],
  );

  const prependTransitionToBuilder = useCallback(
    (item: LibraryItemSummary) => {
      setSequenceMarkers((current) => {
        const firstPosition = current.find((marker) => marker.type === "position" && marker.graphNodeId != null);
        const firstNodeId = firstPosition?.graphNodeId ?? null;

        if (firstNodeId != null && item.toNodeId != null && item.toNodeId !== firstNodeId) {
          setFeedback(`This route ends in ${item.toDisplayName || "a different position"}, not the current start of your chain.`);
          return current;
        }

        const prefix: SequenceMarker[] = [];

        if (item.fromNodeId != null) {
          const origin = positionsByNodeId.get(item.fromNodeId);
          if (origin) {
            prefix.push(markerFromPosition(origin, 0));
          }
        }

        prefix.push(markerFromTransition(item, prefix.length));

        const next = reindexMarkers([...prefix, ...current]);
        if (positionCategory === "mixed") {
          setPositionCategory(deriveCategory(next));
        }
        setFeedback(null);
        return next;
      });
      setWorkflowTab("review");
    },
    [positionCategory, positionsByNodeId],
  );

  const randomizeSequence = useCallback(() => {
    const eligibleStarts = recommendedStartingPositions.filter((item) => item.graphNodeId != null);
    if (eligibleStarts.length === 0) {
      setFeedback("No graph-connected starting positions are available for a random drill right now.");
      return;
    }

    const start = eligibleStarts[Math.floor(Math.random() * eligibleStarts.length)];
    const nextMarkers: SequenceMarker[] = [markerFromPosition(start, 0)];
    let currentNodeId = start.graphNodeId ?? null;
    let lastTransitionKey: string | null = null;
    let transitionsAdded = 0;

    while (currentNodeId != null && transitionsAdded < 6) {
      const choices = (outgoingTransitionsByNode.get(currentNodeId) ?? []).filter((item) => getTransitionBuilderKey(item) !== lastTransitionKey);
      if (choices.length === 0) break;

      const selected = choices[Math.floor(Math.random() * choices.length)];
      nextMarkers.push(markerFromTransition(selected, nextMarkers.length));

      if (selected.toNodeId != null) {
        const destination = positionsByNodeId.get(selected.toNodeId);
        if (destination) {
          nextMarkers.push(markerFromPosition(destination, nextMarkers.length));
        }
      }

      currentNodeId = selected.toNodeId ?? null;
      lastTransitionKey = getTransitionBuilderKey(selected);
      transitionsAdded += 1;
    }

    setSequenceMarkers(reindexMarkers(nextMarkers));
    setPositionCategory(deriveCategory(nextMarkers));
    setWorkflowTab("review");
    setFeedback(`Random drill loaded from ${getItemLabel(start)}.`);
  }, [outgoingTransitionsByNode, positionsByNodeId, recommendedStartingPositions]);

  const addCustomTransition = useCallback(() => {
    if (!customTransition.trim()) return;
    setSequenceMarkers((current) =>
      reindexMarkers([
        ...current,
        {
          name: customTransition.trim(),
          frame: current.length,
          type: "transition",
          libraryType: "note",
        },
      ]),
    );
    setCustomTransition("");
  }, [customTransition]);

  const removeMarker = useCallback((index: number) => {
    setSequenceMarkers((current) => reindexMarkers(current.filter((_, markerIndex) => markerIndex !== index)));
  }, []);

  const hydrateSavedMarkers = useCallback(
    (markers: SequenceMarker[]) => {
      return reindexMarkers(
        markers.map((marker) => {
          if (marker.type === "position") {
            const match = positionsByName.get(getMarkerLabel(marker).toLowerCase());
            return match ? { ...marker, ...markerFromPosition(match, marker.frame) } : marker;
          }

          const match =
            (marker.graphTransitionId != null ? transitionsByGraphId.get(marker.graphTransitionId) : null) ??
            transitionsByName.get(getMarkerLabel(marker).toLowerCase());
          return match
            ? { ...marker, ...markerFromTransition(applyDirectionalTransition(match, Boolean(marker.reverse)), marker.frame) }
            : marker;
        }),
      );
    },
    [positionsByName, transitionsByGraphId, transitionsByName],
  );

  const loadSequence = useCallback(
    (sequence: SavedSequence) => {
      setSelectedSequenceId(sequence.id);
      setSequenceName(sequence.meta.name);
      setNotes(sequence.meta.description.slice(1).join(" "));
      setDifficulty(sequence.meta.difficulty);
      setPositionCategory((sequence.meta.positionCategory as PositionCategory | "mixed") ?? "mixed");
      setPublished(sequence.verified);
      setSequenceMarkers(hydrateSavedMarkers(sequence.markers ?? []));
      setWorkflowTab("review");
      setFeedback(null);
    },
    [hydrateSavedMarkers],
  );

  const saveSequence = useCallback(async () => {
    if (!sequenceName.trim()) {
      setFeedback("Add a sequence name before saving.");
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const previewablePaths = Array.from(new Set(
        sequenceMarkers
          .filter((marker) => marker.previewPath && marker.libraryType !== "note")
          .map((marker) => marker.previewPath as string),
      ));

      const loadedPreviews = await Promise.all(
        previewablePaths.map(async (previewPath) => {
          const preview = await ensurePreviewAsset(previewPath);
          return [previewPath, preview] as const;
        }),
      );

      const nextPreviewCache = { ...previewCache };
      loadedPreviews.forEach(([previewPath, preview]) => {
        if (preview) {
          nextPreviewCache[previewPath] = preview;
        }
      });

      const nextBuiltSequence = buildPreviewFromMarkers(sequenceMarkers, nextPreviewCache, selectedSequence?.frames ?? []);
      if (!nextBuiltSequence.frames.length || nextBuiltSequence.markers.length === 0) {
        setFeedback("Build a previewable sequence from positions and transitions before saving.");
        return;
      }

      const slug = slugify(sequenceName);
      const firstPosition = nextBuiltSequence.markers.find((marker) => marker.type === "position")?.name ?? "";
      const lastPosition = [...nextBuiltSequence.markers].reverse().find((marker) => marker.type === "position")?.name ?? "";
      const payload = {
        id: selectedSequenceId ?? slug,
        meta: {
          id: selectedSequenceId ?? slug,
          slug,
          name: sequenceName.trim(),
          positionCategory,
          startingPosition: toDisplayText(firstPosition),
          endingPosition: toDisplayText(lastPosition),
          difficulty,
          description: notes.trim()
            ? [`${sequenceName.trim()} is part of the Sunnah Skills techniques library.`, notes.trim()]
            : buildDescription(sequenceName.trim(), nextBuiltSequence.markers),
          sources: ["Sunnah Skills Admin"],
        },
        markers: nextBuiltSequence.markers.map((marker, index) => ({
          ...marker,
          name: toDisplayText(marker.name),
          frame: marker.frame ?? index,
        })),
        frames: nextBuiltSequence.frames,
        verified: published,
      };

      const response = await fetch("/api/admin/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? "Could not save sequence");
      }

      await fetchSequences();
      setSelectedSequenceId(slug);
      setFeedback(published ? "Sequence saved and published to the public techniques library." : "Sequence saved.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not save sequence");
    } finally {
      setSaving(false);
    }
  }, [difficulty, ensurePreviewAsset, fetchSequences, notes, positionCategory, previewCache, published, selectedSequenceId, selectedSequence?.frames, sequenceMarkers, sequenceName]);

  const deleteSequence = useCallback(async () => {
    if (!selectedSequenceId) return;

    setDeleting(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/sequences?id=${encodeURIComponent(selectedSequenceId)}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? "Could not delete sequence");
      }

      resetEditor();
      await fetchSequences();
      setFeedback("Sequence deleted.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not delete sequence");
    } finally {
      setDeleting(false);
    }
  }, [fetchSequences, resetEditor, selectedSequenceId]);

  const builderPath = useMemo(() => sequenceMarkers.map((marker) => getMarkerLabel(marker)), [sequenceMarkers]);
  const currentPosition = currentPositionNodeId != null ? positionsByNodeId.get(currentPositionNodeId) ?? null : null;

  if (authLoading || !me) {
    return (
      <div className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-7xl px-6 pt-28">
          <PremiumCard className="bg-white border border-charcoal/10">
            <div className="text-sm text-charcoal/70">Loading sequence builder…</div>
          </PremiumCard>
        </main>
      </div>
    );
  }

  return (
    <AdminShell
      title="Technique Sequence Builder"
      eyebrow="Admin"
      currentSection="sequences"
      user={me}
      summary="Use GrappleMap’s position graph to build coherent chains: start from a real position, choose the exact route out of it, land in the next position, and keep chaining forward."
      actions={
        <OutlineButton
          className="px-5 py-3 text-[11px] uppercase tracking-[0.18em]"
          onClick={() => Promise.all([fetchCatalog(), fetchSequences()]).catch(() => undefined)}
        >
          Refresh library
        </OutlineButton>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <PremiumCard className="bg-white border border-charcoal/10 p-5">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Current end</div>
          <div className="mt-2 text-2xl font-heading text-charcoal">
            {currentPosition ? getItemLabel(currentPosition) : "Pick a starting position"}
          </div>
          <div className="mt-2 text-sm text-charcoal/65">
            {currentPosition ? `${currentPosition.outgoingCount ?? 0} next transitions from this node.` : "Start with a position or add a transition and the builder will auto-chain the destination position."}
          </div>
        </PremiumCard>
        <PremiumCard className="bg-white border border-charcoal/10 p-5">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Current chain</div>
          <div className="mt-2 text-3xl font-heading text-charcoal">{sequenceMarkers.length}</div>
          <div className="mt-2 text-sm text-charcoal/65">
            {builderPath.length > 0 ? builderPath.slice(0, 4).join(" -> ") : "No chain built yet."}
          </div>
        </PremiumCard>
        <PremiumCard className="bg-white border border-charcoal/10 p-5">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Saved sequences</div>
          <div className="mt-2 text-3xl font-heading text-charcoal">{sequences.length}</div>
          <div className="mt-2 text-sm text-charcoal/65">
            {sequences.filter((sequence) => sequence.verified).length} published, {sequences.filter((sequence) => !sequence.verified).length} draft.
          </div>
        </PremiumCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <PremiumCard className="bg-cream/40 border border-charcoal/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Builder</div>
              <h2 className="mt-2 font-heading text-2xl text-charcoal">Compose a coherent sequence</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/65">
                Search the library, preview the clip, and add it straight into the live chain without leaving the builder.
              </p>
            </div>
            <div className="rounded-full border border-moss/15 bg-white px-4 py-2 shadow-sm">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Current end</div>
              <div className="mt-1 text-sm text-charcoal">
                {currentPosition ? getItemLabel(currentPosition) : "No live end position yet"}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { id: "start", label: "Start" },
              { id: "before", label: "Add Before" },
              { id: "after", label: "Add After" },
              { id: "search", label: "Search" },
              { id: "review", label: "Review" },
            ].map((tab) => {
              const disabled =
                (tab.id === "before" && firstPositionNodeId == null) ||
                (tab.id === "after" && currentPositionNodeId == null);
              return (
                <button
                  key={tab.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setWorkflowTab(tab.id as ComposerTab);
                  }}
                  className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                    workflowTab === tab.id
                      ? "border-moss/25 bg-moss/10 text-charcoal"
                      : "border-charcoal/10 bg-white text-charcoal/60"
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {workflowTab !== "review" ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
              <div className="rounded-[1.8rem] border border-charcoal/10 bg-white p-4 md:p-5">
                {workflowTab === "start" ? (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Recommended starts</div>
                        <h3 className="mt-2 font-heading text-xl text-charcoal">Choose a real starting position</h3>
                      </div>
                      <OutlineButton className="px-4 py-2.5 text-[11px] uppercase tracking-[0.18em]" onClick={randomizeSequence}>
                        Random drill
                      </OutlineButton>
                    </div>
                    <div className="mt-4 max-h-[42rem] space-y-3 overflow-y-auto pr-1">
                      {recommendedStartingPositions.map((item) => (
                        <div
                          key={getLibraryItemKey(item)}
                          className={`rounded-[1.5rem] border p-4 ${selectedItem && getLibraryItemKey(selectedItem) === getLibraryItemKey(item) ? "border-moss/25 bg-moss/10" : "border-charcoal/10 bg-cream/35"}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <button type="button" onClick={() => loadLibraryItem(item)} className="min-w-0 flex-1 text-left">
                              <div className="text-sm text-charcoal">{getComposerTitle(item)}</div>
                              <div className="mt-1 text-xs text-charcoal/55">{getComposerSubtitle(item)}</div>
                            </button>
                            <ClayButton className="px-3 py-2 text-[11px] uppercase tracking-[0.18em]" onClick={() => addPositionToBuilder(item)}>
                              Start here
                            </ClayButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {workflowTab === "before" ? (
                  <div>
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Pre choices</div>
                    <h3 className="mt-2 font-heading text-xl text-charcoal">Add a route before the current start</h3>
                    <div className="mt-4 max-h-[42rem] space-y-3 overflow-y-auto pr-1">
                      {suggestedPreviousTransitions.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-dashed border-charcoal/15 bg-cream/35 p-5 text-sm text-charcoal/55">
                          No incoming graph routes were found for the current starting position.
                        </div>
                      ) : (
                        suggestedPreviousTransitions.map((item) => (
                          <div
                            key={getLibraryItemKey(item)}
                            className={`rounded-[1.5rem] border p-4 ${selectedItem && getLibraryItemKey(selectedItem) === getLibraryItemKey(item) ? "border-moss/25 bg-moss/10" : "border-charcoal/10 bg-cream/35"}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <button type="button" onClick={() => loadLibraryItem(item)} className="min-w-0 flex-1 text-left">
                                <div className="text-sm text-charcoal">{getComposerTitle(item)}</div>
                                <div className="mt-1 text-xs text-charcoal/55">{getComposerSubtitle(item)}</div>
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-charcoal/45">
                                  <span>{getDirectionHint(item)}</span>
                                  <span>Starts at {item.fromDisplayName || "unknown"} and lands in {item.toDisplayName || "unknown"}.</span>
                                </div>
                              </button>
                              <ClayButton className="px-3 py-2 text-[11px] uppercase tracking-[0.18em]" onClick={() => prependTransitionToBuilder(item)}>
                                Add before
                              </ClayButton>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                {workflowTab === "after" ? (
                  <div>
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Post choices</div>
                    <h3 className="mt-2 font-heading text-xl text-charcoal">Continue from the current end</h3>
                    <div className="mt-4 max-h-[42rem] space-y-3 overflow-y-auto pr-1">
                      {suggestedNextTransitions.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-dashed border-charcoal/15 bg-cream/35 p-5 text-sm text-charcoal/55">
                          No outgoing graph routes were found for the current end position.
                        </div>
                      ) : (
                        suggestedNextTransitions.map((item) => (
                          <div
                            key={getLibraryItemKey(item)}
                            className={`rounded-[1.5rem] border p-4 ${selectedItem && getLibraryItemKey(selectedItem) === getLibraryItemKey(item) ? "border-moss/25 bg-moss/10" : "border-charcoal/10 bg-cream/35"}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <button type="button" onClick={() => loadLibraryItem(item)} className="min-w-0 flex-1 text-left">
                                <div className="text-sm text-charcoal">{getComposerTitle(item)}</div>
                                <div className="mt-1 text-xs text-charcoal/55">{getComposerSubtitle(item)}</div>
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-charcoal/45">
                                  <span>{getDirectionHint(item)}</span>
                                  <span>Starts at {item.fromDisplayName || "unknown"} and finishes in {item.toDisplayName || "unknown"}.</span>
                                </div>
                              </button>
                              <ClayButton className="px-3 py-2 text-[11px] uppercase tracking-[0.18em]" onClick={() => addTransitionToBuilder(item)}>
                                Add after
                              </ClayButton>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                {workflowTab === "search" ? (
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Search library</div>
                        <h3 className="mt-2 font-heading text-xl text-charcoal">Browse the wider graph</h3>
                      </div>
                      <div className="flex rounded-full border border-charcoal/10 bg-cream/50 p-1">
                        {(["positions", "transitions"] as LibraryMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setCatalogMode(mode)}
                            className={`rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                              catalogMode === mode ? "bg-white text-charcoal shadow-sm" : "text-charcoal/55"
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative mt-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/35" size={16} />
                      <Input
                        placeholder={`Search ${catalogMode}...`}
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="border-charcoal/10 bg-cream/35 pl-10"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {filterOptions.map((option) => (
                        <button
                          key={option.slug}
                          type="button"
                          onClick={() => setFilterTag(option.slug)}
                          className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                            filterTag === option.slug
                              ? "border-moss/25 bg-moss/10 text-charcoal"
                              : "border-charcoal/10 bg-white text-charcoal/60"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 max-h-[38rem] space-y-3 overflow-y-auto pr-1">
                      {filteredCatalog.slice(0, 120).map((item) => (
                        <div
                          key={getLibraryItemKey(item)}
                          className={`rounded-[1.5rem] border p-4 ${selectedItem && getLibraryItemKey(selectedItem) === getLibraryItemKey(item) ? "border-moss/25 bg-moss/10" : "border-charcoal/10 bg-cream/35"}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <button type="button" onClick={() => loadLibraryItem(item)} className="min-w-0 flex-1 text-left">
                              <div className="text-sm text-charcoal">{item.libraryType === "transition" ? getComposerTitle(item) : getItemLabel(item)}</div>
                              <div className="mt-1 text-xs text-charcoal/55">
                                {item.libraryType === "transition" ? getComposerSubtitle(item) : `${item.outgoingCount ?? 0} outgoing / ${item.incomingCount ?? 0} incoming`}
                              </div>
                              {item.libraryType === "transition" ? (
                                <div className="mt-2 text-[11px] text-charcoal/45">{getDirectionHint(item)}</div>
                              ) : null}
                            </button>
                            <ClayButton
                              className="px-3 py-2 text-[11px] uppercase tracking-[0.18em]"
                              onClick={() => (item.libraryType === "position" ? addPositionToBuilder(item) : addTransitionToBuilder(item))}
                            >
                              <span className="inline-flex items-center gap-2">
                                <Plus size={14} />
                                Add
                              </span>
                            </ClayButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[1.8rem] border border-charcoal/10 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Preview</div>
                    <h3 className="mt-2 font-heading text-xl text-charcoal">
                      {selectedItem ? (selectedItem.libraryType === "transition" ? getComposerTitle(selectedItem) : getItemLabel(selectedItem)) : "Select a library item"}
                    </h3>
                  </div>
                  <Eye className="text-moss" size={18} />
                </div>

                {selectedItem ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-[1.4rem] border border-charcoal/10 bg-cream/35 p-4">
                      <div className="text-sm text-charcoal">
                        {selectedItem.libraryType === "transition" ? getComposerSubtitle(selectedItem) : `${selectedItem.outgoingCount ?? 0} exits from this position`}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[selectedItem.family, selectedItem.fromFamily, selectedItem.toFamily, ...selectedItem.tags, ...selectedItem.props]
                          .filter(Boolean)
                          .slice(0, 8)
                          .map((tag) => (
                            <span key={tag} className="rounded-full border border-moss/15 bg-moss/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-moss">
                              {toDisplayText(tag as string)}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[1.8rem] border border-charcoal/10 bg-[radial-gradient(circle_at_top,_rgba(143,171,113,0.18),_rgba(20,20,20,0.92))]">
                      <div className="h-[24rem]">
                        {selectedItemPreview ? (
                          <TechniqueViewer className="h-full w-full" sequenceData={selectedItemPreview} />
                        ) : loadingPreview ? (
                          <div className="flex h-full items-center justify-center text-sm text-cream/70">Loading preview…</div>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-cream/70">Preview unavailable.</div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {workflowTab === "before" && selectedItem.libraryType === "transition" ? (
                        <ClayButton className="px-4 py-2.5 text-[11px] uppercase tracking-[0.18em]" onClick={() => prependTransitionToBuilder(selectedItem)}>
                          Add before
                        </ClayButton>
                      ) : null}
                      {selectedItem.libraryType === "position" ? (
                        <ClayButton className="px-4 py-2.5 text-[11px] uppercase tracking-[0.18em]" onClick={() => addPositionToBuilder(selectedItem)}>
                          Add position
                        </ClayButton>
                      ) : null}
                      {selectedItem.libraryType === "transition" && workflowTab !== "before" ? (
                        <ClayButton className="px-4 py-2.5 text-[11px] uppercase tracking-[0.18em]" onClick={() => addTransitionToBuilder(selectedItem)}>
                          Add after
                        </ClayButton>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex min-h-[24rem] items-center justify-center rounded-[1.6rem] border border-dashed border-charcoal/15 bg-cream/35 p-8 text-center text-sm text-charcoal/55">
                    Choose a position or transition from the active composer tab to inspect the route before you add it.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 xl:grid-cols-[0.94fr_1.06fr]">
              <div className="rounded-[1.6rem] border border-charcoal/10 bg-white p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Technique name</div>
                    <Input
                      placeholder="Technique name..."
                      value={sequenceName}
                      onChange={(event) => setSequenceName(event.target.value)}
                      className="border-charcoal/10 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Difficulty</div>
                    <Select value={difficulty} onValueChange={(value) => setDifficulty(value as SequenceDifficulty)}>
                      <SelectTrigger className="border-charcoal/10 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {toDisplayText(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Category</div>
                    <Select value={positionCategory} onValueChange={(value) => setPositionCategory(value as PositionCategory | "mixed")}>
                      <SelectTrigger className="border-charcoal/10 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option.slug} value={option.slug}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.6rem] border border-charcoal/10 bg-cream/35 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-charcoal">Publish to the public technique library</div>
                      <div className="mt-1 text-xs text-charcoal/55">Published sequences appear in the public techniques library.</div>
                    </div>
                    <Switch checked={published} onCheckedChange={setPublished} className="data-[state=checked]:bg-moss" />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Current path</div>
                  <div className="mt-3 space-y-3">
                    {sequenceMarkers.length === 0 ? (
                      <div className="rounded-[1.4rem] border border-dashed border-charcoal/15 bg-cream/45 p-4 text-sm text-charcoal/55">
                        Build a chain from the composer tabs before saving.
                      </div>
                    ) : (
                      sequenceMarkers.map((marker, index) => (
                        <div key={`${marker.name}-${index}`} className="flex items-start gap-3 rounded-[1.4rem] border border-charcoal/10 bg-cream/45 p-3">
                          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-moss/15 bg-moss/10 text-sm text-moss">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-charcoal">{getMarkerLabel(marker)}</div>
                            <div className="mt-1 text-xs text-charcoal/55">
                              {marker.type === "transition"
                                ? `${marker.fromDisplayName || "Unknown start"} -> ${marker.toDisplayName || "Unknown finish"}`
                                : marker.family
                                  ? toDisplayText(marker.family)
                                  : "Position"}
                            </div>
                          </div>
                          <button type="button" onClick={() => removeMarker(index)} className="text-charcoal/35 transition-colors hover:text-clay" aria-label="Remove marker">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-[1.4rem] border border-charcoal/10 bg-cream/35 p-4">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Custom transition note</div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Optional bridge note..."
                      value={customTransition}
                      onChange={(event) => setCustomTransition(event.target.value)}
                      className="border-charcoal/10 bg-white"
                    />
                    <OutlineButton className="px-4 py-2.5 text-[11px] uppercase tracking-[0.18em]" onClick={addCustomTransition}>
                      Add note
                    </OutlineButton>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Public coaching note</div>
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    placeholder="Public-facing coaching note for this technique..."
                    className="border-charcoal/10 bg-cream/35"
                  />
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-charcoal/10 bg-white p-4">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Sequence preview</div>
                <div className="mt-4 overflow-hidden rounded-[1.8rem] border border-charcoal/10 bg-[radial-gradient(circle_at_top,_rgba(143,171,113,0.18),_rgba(20,20,20,0.92))]">
                  <div className="h-[30rem]">
                    {sequencePreviewData ? (
                      <TechniqueViewer className="h-full w-full" sequenceData={sequencePreviewData} />
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-cream/70">
                        Build a chain to preview the full technique here.
                      </div>
                    )}
                  </div>
                </div>

                {feedback ? <div className="mt-4 text-sm text-moss">{feedback}</div> : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <ClayButton
                    onClick={saveSequence}
                    disabled={!sequenceName.trim() || sequenceMarkers.length === 0 || saving}
                    className="px-6 py-3 text-[11px] uppercase tracking-[0.18em] disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Save size={14} />
                      {saving ? "Saving…" : published ? "Save and publish" : "Save draft"}
                    </span>
                  </ClayButton>
                  <OutlineButton className="px-5 py-3 text-[11px] uppercase tracking-[0.18em]" onClick={resetEditor}>
                    Reset builder
                  </OutlineButton>
                  <OutlineButton
                    className="px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-clay hover:text-clay"
                    onClick={deleteSequence}
                    disabled={!selectedSequenceId || deleting}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Trash2 size={14} />
                      {deleting ? "Deleting…" : "Delete"}
                    </span>
                  </OutlineButton>
                </div>
              </div>
            </div>
          )}
        </PremiumCard>

        <PremiumCard className="bg-white border border-charcoal/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Saved sequences</div>
              <h2 className="mt-2 font-heading text-2xl text-charcoal">Drafts and published techniques</h2>
            </div>
            <Sparkles className="text-moss" size={18} />
          </div>

          <div className="mt-5 space-y-3">
            {sequences.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-charcoal/15 bg-cream/45 p-5 text-sm text-charcoal/55">
                No saved sequences yet.
              </div>
            ) : (
              sequences.map((sequence) => (
                <button
                  key={sequence.id}
                  type="button"
                  onClick={() => setSelectedSequenceId(sequence.id)}
                  className={`w-full rounded-[1.6rem] border px-4 py-4 text-left transition-colors ${
                    selectedSequenceId === sequence.id ? "border-moss/25 bg-moss/10" : "border-charcoal/10 bg-cream/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-charcoal">{sequence.meta.name}</div>
                        <div className="mt-1 text-xs text-charcoal/55">
                          {sequence.meta.startingPosition} {"->"} {sequence.meta.endingPosition}
                        </div>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${
                      sequence.verified ? "border-moss/20 bg-moss/10 text-moss" : "border-charcoal/10 bg-white text-charcoal/55"
                    }`}>
                      {sequence.verified ? "Public" : "Draft"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="mt-5">
            {selectedSequence ? (
              <div className="space-y-5">
                <div className="rounded-[1.7rem] border border-charcoal/10 bg-cream/45 p-5">
                  <div className="text-2xl font-heading text-charcoal">{selectedSequence.meta.name}</div>
                  <div className="mt-2 text-sm text-charcoal/65">
                    {selectedSequence.meta.startingPosition} {"->"} {selectedSequence.meta.endingPosition}
                  </div>
                  <div className="mt-4 text-sm leading-relaxed text-charcoal/70">
                    {(selectedSequence.meta.description ?? []).join(" ")}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <ClayButton
                      className="px-4 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                      onClick={() => loadSequence(selectedSequence)}
                    >
                      Load into builder
                    </ClayButton>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-charcoal/10 bg-[radial-gradient(circle_at_top,_rgba(143,171,113,0.18),_rgba(20,20,20,0.92))]">
                  <div className="h-[24rem]">
                    {savedPreviewData ? (
                      <TechniqueViewer className="h-full w-full" sequenceData={savedPreviewData} />
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-cream/70">
                        Select a saved technique to preview it.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-charcoal/15 bg-cream/45 p-8 text-center text-sm text-charcoal/55">
                Select a saved sequence to preview it here.
              </div>
            )}
          </div>
        </PremiumCard>
      </div>
    </AdminShell>
  );
}
