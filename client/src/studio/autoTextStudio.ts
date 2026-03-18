import type { StudioState } from "./studioTypes";

type TagOptions = {
  root?: HTMLElement;
  excludeSelector?: string;
  routeKey?: string;
};

const EDITABLE_TAGS = new Set(["P", "SPAN", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "A", "BUTTON", "LI", "LABEL"]);

function isWhitespaceOnly(text: string) {
  return text.trim().length === 0;
}

function eligibleElement(el: Element) {
  if (!(el instanceof HTMLElement)) return false;
  if (!EDITABLE_TAGS.has(el.tagName)) return false;
  if (el.closest("[data-studio-ui='1']")) return false;
  if (el.closest("svg")) return false;
  if (el.matches("script,style,textarea,input,select,option")) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  if (el.hasAttribute("data-studio-skip")) return false;
  if (el.childElementCount > 0) return false;
  const text = el.textContent ?? "";
  if (isWhitespaceOnly(text)) return false;
  return true;
}

export function tagStudioTextNodes(opts: TagOptions = {}) {
  const root = opts.root ?? document.body;
  const routeKey =
    opts.routeKey ??
    (() => {
      try {
        return `${window.location.pathname}${window.location.search}`;
      } catch {
        return "route";
      }
    })();

  const excludeSelector = opts.excludeSelector ?? "";

  const all = Array.from(root.querySelectorAll<HTMLElement>("*"));
  let idx = 0;
  for (const el of all) {
    if (excludeSelector && el.matches(excludeSelector)) continue;
    if (!eligibleElement(el)) continue;
    if (!el.dataset.studioAutoId) {
      el.dataset.studioAutoId = `${routeKey}::t${idx}`;
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
    const override = state.edits[key];
    if (typeof override === "string") {
      el.textContent = override;
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

