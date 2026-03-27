export type StudioSurfaceCandidate = {
  key: string;
  label: string;
  element: HTMLElement;
};

export type StudioTextFieldCandidate = {
  key: string;
  label: string;
  currentValue: string;
  defaultValue: string;
  edited: boolean;
  componentId?: string;
  autoId?: string;
};

export type StudioImageSlotCandidate = {
  slotKey: string;
  currentSrc?: string;
  componentId?: string;
};

export type VisibleStudioComponent = {
  id: string;
  label: string;
  textCount: number;
  imageCount: number;
  surfaceCount: number;
};

const SURFACE_TAGS = "section, article, aside, header, footer, div, figure, button, a, li, blockquote";
const SURFACE_KIND_LABELS: Record<string, string> = {
  section: "Section",
  article: "Section",
  aside: "Side panel",
  header: "Header area",
  footer: "Footer area",
  div: "Panel",
  figure: "Media",
  button: "Button",
  a: "Link",
  li: "Item",
  blockquote: "Quote",
};

function clampText(value: string, limit = 42) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1)}…`;
}

function getElementTextPreview(element: HTMLElement) {
  const source =
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.querySelector<HTMLElement>("h1, h2, h3, h4, h5, button, a, p, span")?.textContent ||
    element.textContent ||
    "";
  return source.replace(/\s+/g, " ").trim();
}

function getOrdinalAmongSimilarSiblings(element: HTMLElement) {
  const parent = element.parentElement;
  if (!parent) return 0;
  const siblings = Array.from(parent.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child.tagName === element.tagName,
  );
  return Math.max(0, siblings.indexOf(element));
}

function isTransparent(color: string) {
  return color === "transparent" || color === "rgba(0, 0, 0, 0)" || color === "initial";
}

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width >= 24 && rect.height >= 24 && style.display !== "none" && style.visibility !== "hidden";
}

function hasVisualSignal(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const className = typeof element.className === "string" ? element.className : "";
  const classSignal = /(bg-|border|shadow|rounded|ring|card|panel|hero|cta|overlay)/.test(className);
  const styleSignal =
    !isTransparent(style.backgroundColor) ||
    parseFloat(style.borderTopWidth || "0") > 0 ||
    parseFloat(style.borderRightWidth || "0") > 0 ||
    parseFloat(style.borderBottomWidth || "0") > 0 ||
    parseFloat(style.borderLeftWidth || "0") > 0;
  return classSignal || styleSignal;
}

export function getStudioNodeKey(componentRoot: HTMLElement, element: HTMLElement) {
  if (element === componentRoot) return "__root";

  const parts: string[] = [];
  let current: HTMLElement | null = element;
  while (current && current !== componentRoot) {
    const ordinal = getOrdinalAmongSimilarSiblings(current);
    parts.unshift(`${current.tagName.toLowerCase()}:${ordinal}`);
    current = current.parentElement;
  }
  return parts.join("/");
}

function getSurfaceLabel(componentRoot: HTMLElement, element: HTMLElement) {
  if (element === componentRoot) return "Whole section";
  const tag = element.tagName.toLowerCase();
  const text = getElementTextPreview(element);
  const className = typeof element.className === "string" ? element.className : "";
  const kind =
    /hero/i.test(className) ? "Hero panel" :
    /timeline/i.test(className) ? "Timeline item" :
    /card/i.test(className) ? "Card" :
    /cta/i.test(className) ? "Call to action" :
    SURFACE_KIND_LABELS[tag] ?? "Surface";
  return text ? `${kind}: ${clampText(text)}` : kind;
}

export function getStudioComponentElement(componentId: string) {
  return document.querySelector<HTMLElement>(`[data-studio-component="${CSS.escape(componentId)}"]`);
}

export function getStudioRenderableElements(componentId: string) {
  const root = getStudioComponentElement(componentId);
  if (!root) return [];
  const style = window.getComputedStyle(root);
  if (style.display === "contents") {
    return Array.from(root.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
  }
  return [root];
}

export function getStudioComponentRect(componentId: string) {
  const elements = getStudioRenderableElements(componentId).filter(isVisible);
  if (elements.length === 0) return null;

  let top = Number.POSITIVE_INFINITY;
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    top = Math.min(top, rect.top);
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }

  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

export function applyStudioComponentOffset(componentId: string, dx: number, dy: number) {
  for (const element of getStudioRenderableElements(componentId)) {
    element.style.translate = `${dx}px ${dy}px`;
  }
}

export function clearStudioComponentOffset(componentId: string) {
  for (const element of getStudioRenderableElements(componentId)) {
    element.style.removeProperty("translate");
  }
}

export function discoverTextFields(componentId: string, edits: Record<string, string>): StudioTextFieldCandidate[] {
  const component = getStudioComponentElement(componentId);
  if (!component) return [];

  const seen = new Set<string>();
  const items: StudioTextFieldCandidate[] = [];
  const candidates = [
    ...(component.matches("[data-studio-field], [data-studio-auto-id]") ? [component] : []),
    ...Array.from(component.querySelectorAll<HTMLElement>("[data-studio-field], [data-studio-auto-id]")),
  ];

  for (const element of candidates) {
    const fieldKey = element.dataset.studioField;
    const autoId = element.dataset.studioAutoId;
    if (!fieldKey && autoId && element.closest("[data-studio-field]") !== element) continue;

    const key = fieldKey ? `${componentId}.${fieldKey}` : autoId;
    if (!key || seen.has(key)) continue;

    const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!text && !edits[key]) continue;

    seen.add(key);
    items.push({
      key,
      label: fieldKey
        ? fieldKey.replace(/[-_]+/g, " ")
        : (autoId?.split(".").pop() ?? autoId ?? "text").replace(/[-_]+/g, " "),
      currentValue: edits[key] ?? text,
      defaultValue: text,
      edited: key in edits,
      componentId,
      autoId,
    });
  }

  return items;
}

export function listPageTextFields(edits: Record<string, string>): StudioTextFieldCandidate[] {
  const seen = new Set<string>();
  const items: StudioTextFieldCandidate[] = [];

  const candidates = Array.from(document.querySelectorAll<HTMLElement>("[data-studio-field], [data-studio-auto-id]"));
  for (const element of candidates) {
    const fieldKey = element.dataset.studioField;
    const autoId = element.dataset.studioAutoId;
    if (!fieldKey && autoId && element.closest("[data-studio-field]") !== element) continue;

    const key = fieldKey
      ? `${element.closest<HTMLElement>("[data-studio-component]")?.dataset.studioComponent ?? "page"}.${fieldKey}`
      : autoId;
    if (!key || seen.has(key)) continue;

    const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!text && !edits[key]) continue;

    seen.add(key);
    items.push({
      key,
      label: fieldKey
        ? fieldKey.replace(/[-_]+/g, " ")
        : (autoId?.split(".").pop() ?? autoId ?? "text").replace(/[-_]+/g, " "),
      currentValue: edits[key] ?? text,
      defaultValue: text,
      edited: key in edits,
      componentId: element.closest<HTMLElement>("[data-studio-component]")?.dataset.studioComponent,
      autoId,
    });
  }

  return items;
}

export function discoverImageSlots(componentId: string): StudioImageSlotCandidate[] {
  const componentPrefix = `${componentId}.`;
  const seen = new Map<string, StudioImageSlotCandidate>();
  const component = getStudioComponentElement(componentId);

  if (component) {
    for (const element of Array.from(component.querySelectorAll<HTMLElement>("[data-studio-image-slot]"))) {
      const slotKey = element.dataset.studioImageSlot;
      if (!slotKey) continue;
      seen.set(slotKey, {
        slotKey,
        currentSrc: element instanceof HTMLImageElement ? element.src : undefined,
        componentId: componentId,
      });
    }
  }

  for (const element of Array.from(document.querySelectorAll<HTMLElement>("[data-studio-image-slot]"))) {
    const slotKey = element.dataset.studioImageSlot;
    if (!slotKey || !slotKey.startsWith(componentPrefix) || seen.has(slotKey)) continue;
    seen.set(slotKey, {
      slotKey,
      currentSrc: element instanceof HTMLImageElement ? element.src : undefined,
      componentId: componentId,
    });
  }

  return Array.from(seen.values());
}

export function listPageImageSlots() {
  const seen = new Map<string, StudioImageSlotCandidate>();
  for (const element of Array.from(document.querySelectorAll<HTMLElement>("[data-studio-image-slot]"))) {
    const slotKey = element.dataset.studioImageSlot;
    if (!slotKey || seen.has(slotKey)) continue;
    const componentId = element.closest<HTMLElement>("[data-studio-component]")?.dataset.studioComponent ?? slotKey.split(".").slice(0, 2).join(".");
    seen.set(slotKey, {
      slotKey,
      currentSrc: element instanceof HTMLImageElement ? element.src : undefined,
      componentId,
    });
  }
  return Array.from(seen.values());
}

export function discoverSurfaceCandidates(componentId: string): StudioSurfaceCandidate[] {
  const root = getStudioComponentElement(componentId);
  if (!root) return [];

  const candidates: StudioSurfaceCandidate[] = [];
  const seen = new Set<string>();
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>(SURFACE_TAGS))];

  for (const element of elements) {
    if (!isVisible(element)) continue;
    if (element !== root && !hasVisualSignal(element)) continue;
    const key = getStudioNodeKey(root, element);
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({
      key,
      label: getSurfaceLabel(root, element),
      element,
    });
  }

  return candidates.slice(0, 14);
}

export function listVisibleStudioComponents(): VisibleStudioComponent[] {
  const seen = new Set<string>();
  const allImageSlots = Array.from(document.querySelectorAll<HTMLElement>("[data-studio-image-slot]"));
  const components = Array.from(document.querySelectorAll<HTMLElement>("[data-studio-component]"));

  return components
    .map((element) => {
      const id = element.dataset.studioComponent;
      if (!id || seen.has(id) || !isVisible(element)) return null;
      seen.add(id);
      const imageKeys = new Set<string>();
      for (const slot of allImageSlots) {
        const slotKey = slot.dataset.studioImageSlot;
        if (slotKey && slotKey.startsWith(`${id}.`)) imageKeys.add(slotKey);
      }
      for (const slot of Array.from(element.querySelectorAll<HTMLElement>("[data-studio-image-slot]"))) {
        const slotKey = slot.dataset.studioImageSlot;
        if (slotKey) imageKeys.add(slotKey);
      }
      const textNodes = [
        ...Array.from(element.querySelectorAll<HTMLElement>("[data-studio-field]")),
        ...Array.from(element.querySelectorAll<HTMLElement>("[data-studio-auto-id]")).filter(
          (node) => node.closest("[data-studio-field]") !== node,
        ),
      ];
      return {
        id,
        label: element.dataset.studioLabel || id,
        textCount: textNodes.length,
        imageCount: imageKeys.size,
        surfaceCount: Math.max(0, discoverSurfaceCandidates(id).length - 1),
      } satisfies VisibleStudioComponent;
    })
    .filter((value): value is VisibleStudioComponent => Boolean(value))
    .slice(0, 40);
}
