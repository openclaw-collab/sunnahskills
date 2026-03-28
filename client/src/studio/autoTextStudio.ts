import type { StudioCustomTheme, StudioState } from "./studioTypes";
import { applyAutoTextNodeEdits, discoverSurfaceCandidates, getStudioRenderableElements } from "./studioDom";

type TagOptions = {
  root?: HTMLElement;
  excludeSelector?: string;
  routeKey?: string;
};

const EDITABLE_TAGS = new Set([
  "P", "SPAN", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "A", "BUTTON", "LI", "LABEL",
]);
const COMPONENT_TAGS = new Set(["SECTION", "ARTICLE", "ASIDE", "HEADER", "FOOTER", "NAV", "DIV"]);

function isWhitespaceOnly(text: string) {
  return text.trim().length === 0;
}

function hasVisibleRect(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return rect.width >= 120 && rect.height >= 60;
}

function looksLikeVisualContainer(el: HTMLElement) {
  const style = window.getComputedStyle(el);
  const className = typeof el.className === "string" ? el.className : "";
  return (
    /(bg-|border|shadow|rounded|ring|card|panel|hero|cta|timeline|grid|overlay)/.test(className) ||
    style.backgroundColor !== "rgba(0, 0, 0, 0)" ||
    parseFloat(style.borderTopWidth || "0") > 0 ||
    parseFloat(style.borderRightWidth || "0") > 0 ||
    parseFloat(style.borderBottomWidth || "0") > 0 ||
    parseFloat(style.borderLeftWidth || "0") > 0
  );
}

function eligibleElement(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (!EDITABLE_TAGS.has(el.tagName)) return false;
  if (el.closest("[data-studio-ui='1']")) return false;
  if (el.closest("svg")) return false;
  if (el.matches("script,style,textarea,input,select,option")) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  if (el.hasAttribute("data-studio-skip")) return false;
  if (el.childElementCount > 0) return false;
  if (isWhitespaceOnly(el.textContent ?? "")) return false;
  return true;
}

function eligibleComponent(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (!COMPONENT_TAGS.has(el.tagName)) return false;
  if (el.closest("[data-studio-ui='1']")) return false;
  if (el.closest("svg")) return false;
  if (el.matches("script,style,textarea,input,select,option")) return false;
  if (el.hasAttribute("data-studio-skip")) return false;
  if (el.dataset.studioComponent) return false;
  if (el.parentElement?.closest("[data-studio-component][data-studio-auto-component='1']")) return false;
  if (!hasVisibleRect(el)) return false;
  const rect = el.getBoundingClientRect();
  const nestedSections = el.querySelectorAll("section, article, aside").length;
  if (rect.height > window.innerHeight * 1.4 && nestedSections >= 2) return false;
  if (el.children.length >= 10 && nestedSections >= 1) return false;
  const text = (el.innerText ?? "").replace(/\s+/g, " ").trim();
  if (text.length === 0 && !el.querySelector("[data-studio-image-slot], img")) return false;
  return el.tagName !== "DIV" || looksLikeVisualContainer(el);
}

function labelComponent(el: HTMLElement) {
  const explicit = el.getAttribute("aria-label") || el.getAttribute("title");
  const heading = el.querySelector<HTMLElement>("h1, h2, h3, h4, h5, h6")?.innerText;
  const imageHint = el.querySelector<HTMLElement>("[data-studio-image-slot]")?.dataset.studioImageSlot;
  const raw = explicit || heading || imageHint || el.innerText || el.tagName.toLowerCase();
  const className = typeof el.className === "string" ? el.className : "";
  const prefix =
    /hero/i.test(className) ? "Hero" :
    /timeline/i.test(className) ? "Timeline" :
    /card/i.test(className) ? "Card" :
    /cta/i.test(className) ? "Call to action" :
    /nav/i.test(className) || el.tagName === "NAV" ? "Navigation" :
    /footer/i.test(className) || el.tagName === "FOOTER" ? "Footer" :
    "Section";
  const clean = raw.replace(/\s+/g, " ").trim().slice(0, 48);
  return clean ? `${prefix}: ${clean}` : prefix;
}

function componentPath(el: HTMLElement) {
  const parts: string[] = [];
  let current: HTMLElement | null = el;
  while (current && current !== document.body) {
    const node: HTMLElement = current;
    const parent: HTMLElement | null = node.parentElement;
    const siblings = parent
      ? Array.from(parent.children).filter((child): child is HTMLElement => child instanceof HTMLElement && child.tagName === node.tagName)
      : [node];
    parts.unshift(`${node.tagName.toLowerCase()}_${Math.max(0, siblings.indexOf(node))}`);
    current = parent;
  }
  return parts.join(".");
}

export function tagStudioComponentNodes(opts: TagOptions = {}) {
  const root = opts.root ?? document.body;
  const routeKey =
    opts.routeKey ??
    (() => {
      try {
        return window.location.pathname;
      } catch {
        return "route";
      }
    })();

  for (const el of Array.from(root.querySelectorAll<HTMLElement>("section, article, aside, header, footer, nav, main, div"))) {
    if (!eligibleComponent(el)) continue;
    el.dataset.studioComponent = `${routeKey}::${componentPath(el)}`;
    el.dataset.studioLabel = labelComponent(el);
    el.dataset.studioAutoComponent = "1";
  }
}

export function tagStudioTextNodes(opts: TagOptions = {}) {
  const root = opts.root ?? document.body;
  const routeKey =
    opts.routeKey ??
    (() => {
      try {
        return window.location.pathname;
      } catch {
        return "route";
      }
    })();

  const excludeSelector = opts.excludeSelector ?? "";
  let idx = 0;

  for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    if (excludeSelector && el.matches(excludeSelector)) continue;
    if (!eligibleElement(el)) continue;
    if (!el.dataset.studioAutoId) {
      const parent = el.closest<HTMLElement>("[data-studio-component]");
      const parentId = parent?.dataset.studioComponent ?? "page";
      const tagHint = el.tagName.toLowerCase();
      el.dataset.studioAutoId = `${routeKey}::${parentId}.${tagHint}_${idx}`;
    }
    idx += 1;
  }
}

export function applyAutoEdits(state: StudioState, opts: TagOptions = {}) {
  if (!state.enabled) return;
  const root = opts.root ?? document.body;
  const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-studio-auto-id]"));
  for (const el of nodes) {
    const key = el.dataset.studioAutoId;
    if (!key) continue;
    const override = state.localEdits[key];
    if (typeof override === "string") {
      if (el.textContent !== override) el.textContent = override;
    }
  }
  applyAutoTextNodeEdits(state.localEdits, root);
}

/**
 * Apply uploaded image URLs to elements that carry data-studio-image-slot.
 * Runs on every state update so slots stay in sync with session uploads.
 */
export function applyImageSlots(state: StudioState, root: HTMLElement = document.body) {
  if (!state.enabled) return;
  const uploads = state.session?.uploads ?? [];
  if (uploads.length === 0) return;

  const slotMap = new Map(uploads.map((u) => [u.slotKey, u.url]));
  const slots = Array.from(root.querySelectorAll<HTMLElement>("[data-studio-image-slot]"));
  for (const el of slots) {
    const slot = el.dataset.studioImageSlot;
    if (!slot) continue;
    const url = slotMap.get(slot);
    if (!url) continue;
    // Apply to <img src> or CSS background-image depending on tag
    if (el instanceof HTMLImageElement) {
      if (el.src !== url) el.src = url;
    } else {
      const current = el.style.backgroundImage;
      const next = `url("${url}")`;
      if (current !== next) el.style.backgroundImage = next;
    }
  }
}

type BackgroundTone = "inherit" | "page" | "surface-main" | "surface-sub" | "accent" | "contrast";
type BorderTone = "inherit" | "surface-main" | "surface-sub" | "accent" | "contrast";
type TextTone = "inherit" | "text-main" | "text-sub" | "accent" | "contrast";

function resolveBackgroundTone(tone: BackgroundTone, theme: StudioCustomTheme) {
  switch (tone) {
    case "page":
      return theme.pageBackground;
    case "surface-main":
      return theme.surfaceMain;
    case "surface-sub":
      return theme.surfaceSub;
    case "accent":
      return theme.accent;
    case "contrast":
      return theme.textMain;
    default:
      return "";
  }
}

function resolveBorderTone(tone: BorderTone, theme: StudioCustomTheme) {
  switch (tone) {
    case "surface-main":
      return theme.surfaceMain;
    case "surface-sub":
      return theme.surfaceSub;
    case "accent":
      return theme.accent;
    case "contrast":
      return theme.textMain;
    default:
      return "";
  }
}

function resolveTextTone(tone: TextTone, theme: StudioCustomTheme) {
  switch (tone) {
    case "text-main":
      return theme.textMain;
    case "text-sub":
      return theme.textSub;
    case "accent":
      return theme.accent;
    case "contrast":
      return theme.pageBackground;
    default:
      return "";
  }
}

export function applyComponentThemeTokens(
  state: StudioState,
  theme: StudioCustomTheme,
  root: HTMLElement = document.body,
) {
  if (!state.enabled) return;

  const applyToneState = (
    elements: HTMLElement[],
    opts: { bgTone?: BackgroundTone; bg?: string; borderTone?: BorderTone; border?: string; textTone?: TextTone; text?: string },
  ) => {
    for (const element of elements) {
      if (opts.bg) {
        element.dataset.studioBgTone = opts.bgTone ?? "";
        element.style.setProperty("--studio-component-bg", opts.bg);
      } else {
        delete element.dataset.studioBgTone;
        element.style.removeProperty("--studio-component-bg");
      }

      if (opts.border) {
        element.dataset.studioBorderTone = opts.borderTone ?? "";
        element.style.setProperty("--studio-component-border", opts.border);
      } else {
        delete element.dataset.studioBorderTone;
        element.style.removeProperty("--studio-component-border");
      }

      if (opts.text) {
        element.dataset.studioTextTone = opts.textTone ?? "";
        element.style.setProperty("--studio-component-text", opts.text);
      } else {
        delete element.dataset.studioTextTone;
        element.style.removeProperty("--studio-component-text");
      }
    }
  };

  const components = Array.from(root.querySelectorAll<HTMLElement>("[data-studio-component]"));
  for (const el of components) {
    const componentId = el.dataset.studioComponent;
    if (!componentId) continue;

    const bgTone = state.localEdits[`${componentId}.__backgroundTone`] as BackgroundTone | undefined;
    const borderTone = state.localEdits[`${componentId}.__borderTone`] as BorderTone | undefined;
    const textTone = state.localEdits[`${componentId}.__textTone`] as TextTone | undefined;

    const bg = bgTone ? resolveBackgroundTone(bgTone, theme) : "";
    const border = borderTone ? resolveBorderTone(borderTone, theme) : "";
    const text = textTone ? resolveTextTone(textTone, theme) : "";
    applyToneState(getStudioRenderableElements(componentId), {
      bgTone,
      bg,
      borderTone,
      border,
      textTone,
      text,
    });

    const surfaceCandidates = discoverSurfaceCandidates(componentId);
    for (const candidate of surfaceCandidates) {
      if (candidate.key === "__root") continue;

      const nodeBgTone = state.localEdits[`${componentId}.__node.${candidate.key}.backgroundTone`] as BackgroundTone | undefined;
      const nodeBorderTone = state.localEdits[`${componentId}.__node.${candidate.key}.borderTone`] as BorderTone | undefined;
      const nodeTextTone = state.localEdits[`${componentId}.__node.${candidate.key}.textTone`] as TextTone | undefined;
      const nodeBg = nodeBgTone ? resolveBackgroundTone(nodeBgTone, theme) : "";
      const nodeBorder = nodeBorderTone ? resolveBorderTone(nodeBorderTone, theme) : "";
      const nodeText = nodeTextTone ? resolveTextTone(nodeTextTone, theme) : "";
      applyToneState([candidate.element], {
        bgTone: nodeBgTone,
        bg: nodeBg,
        borderTone: nodeBorderTone,
        border: nodeBorder,
        textTone: nodeTextTone,
        text: nodeText,
      });
    }
  }
}

export function getAutoIdFromEventTarget(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  const el = target.closest<HTMLElement>("[data-studio-auto-id]");
  return el?.dataset.studioAutoId ?? null;
}

export function getTextForAutoId(autoId: string): string | null {
  const el = document.querySelector<HTMLElement>(`[data-studio-auto-id="${CSS.escape(autoId)}"]`);
  return el?.textContent ?? null;
}
