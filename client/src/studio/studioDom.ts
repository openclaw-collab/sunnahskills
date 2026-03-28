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

export type StudioSelectionTextCandidate = StudioTextFieldCandidate & {
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  selectedText: string;
  selectionStart: number;
  selectionEnd: number;
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

function getRouteKey() {
  try {
    return window.location.pathname;
  } catch {
    return "/";
  }
}

function normalizeDisplayText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getNodeOwnerElement(node: Node | null): HTMLElement | null {
  if (!node) return null;
  if (node instanceof HTMLElement) return node;
  return node.parentElement;
}

function getSelectionOffsetsWithinElement(range: Range, element: HTMLElement) {
  const probe = document.createRange();
  probe.selectNodeContents(element);
  probe.setEnd(range.startContainer, range.startOffset);
  const selectionStart = probe.toString().length;
  const selectedLength = range.toString().length;
  return {
    selectionStart,
    selectionEnd: selectionStart + selectedLength,
  };
}

function isIgnoredStudioTextNode(node: Text) {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest("[data-studio-ui='1']")) return true;
  if (parent.closest("script, style, textarea, input, select, option, svg")) return true;
  if (parent.closest("[aria-hidden='true'], [data-studio-skip]")) return true;
  if (!normalizeDisplayText(node.nodeValue ?? "")) return true;
  return !isVisible(parent);
}

function getTextNodeOrdinal(node: Text) {
  const parent = node.parentNode;
  if (!parent) return 0;
  let ordinal = 0;
  for (const sibling of Array.from(parent.childNodes)) {
    if (sibling.nodeType !== Node.TEXT_NODE) continue;
    if (sibling === node) return ordinal;
    ordinal += 1;
  }
  return ordinal;
}

function getElementPathWithinComponent(componentRoot: HTMLElement, element: HTMLElement) {
  return getStudioNodeKey(componentRoot, element);
}

function getAutoTextNodeId(node: Text) {
  const owner = node.parentElement;
  if (!owner) return null;
  if (owner.closest("[data-studio-field], [data-studio-auto-id]")) return null;

  const componentRoot = owner.closest<HTMLElement>("[data-studio-component]");
  const componentId = componentRoot?.dataset.studioComponent ?? "page";
  const routeKey = getRouteKey();
  const elementPath = componentRoot
    ? getElementPathWithinComponent(componentRoot, owner)
    : `page/${owner.tagName.toLowerCase()}:${getOrdinalAmongSimilarSiblings(owner)}`;
  return `${routeKey}::${componentId}.__text.${elementPath}.text_${getTextNodeOrdinal(node)}`;
}

function buildManualFieldCandidate(
  element: HTMLElement,
  edits: Record<string, string>,
): StudioTextFieldCandidate | null {
  const fieldKey = element.dataset.studioField;
  if (!fieldKey) return null;

  const componentId = element.closest<HTMLElement>("[data-studio-component]")?.dataset.studioComponent ?? "page";
  const key = `${componentId}.${fieldKey}`;
  const text = normalizeDisplayText(element.textContent ?? "");
  if (!text && !edits[key]) return null;

  return {
    key,
    label: fieldKey.replace(/[-_]+/g, " "),
    currentValue: edits[key] ?? text,
    defaultValue: text,
    edited: key in edits,
    componentId,
  };
}

function buildAutoElementCandidate(
  element: HTMLElement,
  edits: Record<string, string>,
): StudioTextFieldCandidate | null {
  const autoId = element.dataset.studioAutoId;
  if (!autoId) return null;
  if (element.closest("[data-studio-field]") && element.closest("[data-studio-field]") !== element) return null;
  if (element.parentElement?.closest("[data-studio-auto-id]")) return null;

  const rawText = element.textContent ?? "";
  const displayText = normalizeDisplayText(rawText);
  if (!displayText && !edits[autoId]) return null;

  return {
    key: autoId,
    label: clampText(displayText || element.tagName.toLowerCase()),
    currentValue: edits[autoId] ?? rawText,
    defaultValue: rawText,
    edited: autoId in edits,
    componentId: element.closest<HTMLElement>("[data-studio-component]")?.dataset.studioComponent,
    autoId,
  };
}

function buildAutoTextNodeCandidate(
  node: Text,
  edits: Record<string, string>,
): StudioTextFieldCandidate | null {
  if (isIgnoredStudioTextNode(node)) return null;
  const owner = node.parentElement;
  if (!owner) return null;
  const autoId = getAutoTextNodeId(node);
  if (!autoId) return null;

  const rawText = node.nodeValue ?? "";
  const displayText = normalizeDisplayText(rawText);
  if (!displayText && !edits[autoId]) return null;

  const componentId = owner.closest<HTMLElement>("[data-studio-component]")?.dataset.studioComponent;
  const ownerTag = owner.tagName.toLowerCase();

  return {
    key: autoId,
    label: clampText(displayText || ownerTag),
    currentValue: edits[autoId] ?? rawText,
    defaultValue: rawText,
    edited: autoId in edits,
    componentId,
    autoId,
  };
}

function collectAutoTextNodeCandidates(
  edits: Record<string, string>,
  root: ParentNode,
  componentId?: string,
) {
  const items: StudioTextFieldCandidate[] = [];
  const seen = new Set<string>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let current: Node | null = walker.nextNode();
  while (current) {
    if (current instanceof Text) {
      const candidate = buildAutoTextNodeCandidate(current, edits);
      if (candidate && (!componentId || candidate.componentId === componentId) && !seen.has(candidate.key)) {
        seen.add(candidate.key);
        items.push(candidate);
      }
    }
    current = walker.nextNode();
  }

  return items;
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
  const manualCandidates = [
    ...(component.matches("[data-studio-field]") ? [component] : []),
    ...Array.from(component.querySelectorAll<HTMLElement>("[data-studio-field]")),
  ];
  const autoElementCandidates = [
    ...(component.matches("[data-studio-auto-id]") ? [component] : []),
    ...Array.from(component.querySelectorAll<HTMLElement>("[data-studio-auto-id]")),
  ];

  for (const element of manualCandidates) {
    const candidate = buildManualFieldCandidate(element, edits);
    if (!candidate || seen.has(candidate.key)) continue;
    seen.add(candidate.key);
    items.push(candidate);
  }

  for (const element of autoElementCandidates) {
    const candidate = buildAutoElementCandidate(element, edits);
    if (!candidate || seen.has(candidate.key)) continue;
    seen.add(candidate.key);
    items.push(candidate);
  }

  for (const candidate of collectAutoTextNodeCandidates(edits, component, componentId)) {
    if (seen.has(candidate.key)) continue;
    seen.add(candidate.key);
    items.push(candidate);
  }

  return items;
}

export function listPageTextFields(edits: Record<string, string>): StudioTextFieldCandidate[] {
  const seen = new Set<string>();
  const items: StudioTextFieldCandidate[] = [];

  const manualCandidates = Array.from(document.querySelectorAll<HTMLElement>("[data-studio-field]"));
  const autoElementCandidates = Array.from(document.querySelectorAll<HTMLElement>("[data-studio-auto-id]"));
  for (const element of manualCandidates) {
    const candidate = buildManualFieldCandidate(element, edits);
    if (!candidate || seen.has(candidate.key)) continue;
    seen.add(candidate.key);
    items.push(candidate);
  }

  for (const element of autoElementCandidates) {
    const candidate = buildAutoElementCandidate(element, edits);
    if (!candidate || seen.has(candidate.key)) continue;
    seen.add(candidate.key);
    items.push(candidate);
  }

  for (const candidate of collectAutoTextNodeCandidates(edits, document.body)) {
    if (seen.has(candidate.key)) continue;
    seen.add(candidate.key);
    items.push(candidate);
  }

  return items;
}

export function resolveSelectionTextField(edits: Record<string, string>): StudioSelectionTextCandidate | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const selectedText = selection.toString();
  if (!normalizeDisplayText(selectedText)) return null;

  const range = selection.getRangeAt(0);
  const owner = getNodeOwnerElement(range.commonAncestorContainer);
  if (!owner || owner.closest("[data-studio-ui='1']")) return null;

  const manualField = owner.closest<HTMLElement>("[data-studio-field]");
  const autoElement = owner.closest<HTMLElement>("[data-studio-auto-id]");
  let candidate: StudioTextFieldCandidate | null = null;
  let selectionStart = 0;
  let selectionEnd = selectedText.length;

  if (manualField) {
    candidate = buildManualFieldCandidate(manualField, edits);
    ({ selectionStart, selectionEnd } = getSelectionOffsetsWithinElement(range, manualField));
  } else if (autoElement) {
    candidate = buildAutoElementCandidate(autoElement, edits);
    ({ selectionStart, selectionEnd } = getSelectionOffsetsWithinElement(range, autoElement));
  } else {
    const startNode = range.startContainer instanceof Text ? range.startContainer : null;
    const endNode = range.endContainer instanceof Text ? range.endContainer : null;
    if (startNode && endNode && startNode === endNode) {
      candidate = buildAutoTextNodeCandidate(startNode, edits);
      selectionStart = range.startOffset;
      selectionEnd = range.endOffset;
    } else if (startNode) {
      candidate = buildAutoTextNodeCandidate(startNode, edits);
      selectionStart = range.startOffset;
      selectionEnd = startNode.nodeValue?.length ?? range.startOffset;
    }
  }

  if (!candidate) return null;

  const rect = range.getBoundingClientRect();
  return {
    ...candidate,
    rect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
    selectedText: selectedText,
    selectionStart,
    selectionEnd,
  };
}

export function applyAutoTextNodeEdits(edits: Record<string, string>, root: ParentNode = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.nextNode();
  while (current) {
    if (current instanceof Text) {
      const candidate = buildAutoTextNodeCandidate(current, edits);
      if (candidate && current.nodeValue !== candidate.currentValue) {
        current.nodeValue = candidate.currentValue;
      }
    }
    current = walker.nextNode();
  }
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
        ...discoverTextFields(id, {}),
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
