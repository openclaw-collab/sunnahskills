import { vi } from "vitest";

/**
 * Browser API mocks for testing.
 * Includes localStorage, sessionStorage, matchMedia, and other browser APIs.
 */

// ============================================================================
// Storage Mocks
// ============================================================================

export class MockStorage implements Storage {
  private store: Map<string, string> = new Map();
  private storageEventTarget: EventTarget = new EventTarget();

  get length(): number {
    return this.store.size;
  }

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    const oldValue = this.store.get(key) || null;
    this.store.set(key, value);

    // Dispatch storage event (for same-window listeners)
    const event = new StorageEvent("storage", {
      key,
      oldValue,
      newValue: value,
      url: window.location.href,
      storageArea: this,
    });
    window.dispatchEvent(event);
  }

  removeItem(key: string): void {
    const oldValue = this.store.get(key) || null;
    this.store.delete(key);

    const event = new StorageEvent("storage", {
      key,
      oldValue,
      newValue: null,
      url: window.location.href,
      storageArea: this,
    });
    window.dispatchEvent(event);
  }

  clear(): void {
    this.store.clear();

    const event = new StorageEvent("storage", {
      key: null,
      oldValue: null,
      newValue: null,
      url: window.location.href,
      storageArea: this,
    });
    window.dispatchEvent(event);
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }

  /**
   * Get all stored data as an object
   */
  getAll(): Record<string, string> {
    const result: Record<string, string> = {};
    this.store.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Get the number of items (for testing assertions)
   */
  get size(): number {
    return this.store.size;
  }
}

// ============================================================================
// matchMedia Mock
// ============================================================================

export interface MockMediaQueryList extends MediaQueryList {
  matches: boolean;
  media: string;
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null;
  addListener: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
  removeListener: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) => void;
  dispatchEvent: (event: Event) => boolean;
}

export function createMatchMediaMock(
  defaultMatches = false
): (query: string) => MockMediaQueryList {
  const listeners = new Map<string, Set<() => void>>();

  return (query: string): MockMediaQueryList => {
    const mql: MockMediaQueryList = {
      matches: defaultMatches,
      media: query,
      onchange: null,
      addListener: vi.fn((listener) => {
        if (!listeners.has(query)) {
          listeners.set(query, new Set());
        }
        listeners.get(query)!.add(listener);
      }),
      removeListener: vi.fn((listener) => {
        listeners.get(query)?.delete(listener);
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    };

    return mql;
  };
}

/**
 * Sets up matchMedia with specific breakpoints
 */
export function setupMatchMedia(
  breakpoints: Record<string, boolean> = {}
): void {
  const mockMatchMedia = (query: string): MockMediaQueryList => {
    // Check if query matches any of the defined breakpoints
    const matches = Object.entries(breakpoints).some(([breakpoint, value]) =>
      query.includes(breakpoint) ? value : false
    );

    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    };
  };

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(mockMatchMedia),
  });
}

// ============================================================================
// IntersectionObserver Mock
// ============================================================================

export class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: ReadonlyArray<number> = [0];

  private callback: IntersectionObserverCallback;
  private elements: Set<Element> = new Set();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    this.elements.add(target);
  }

  unobserve(target: Element): void {
    this.elements.delete(target);
  }

  disconnect(): void {
    this.elements.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /**
   * Simulate intersection change (for testing)
   */
  simulateIntersection(
    entries: { target: Element; isIntersecting: boolean; intersectionRatio?: number }[]
  ): void {
    const observerEntries: IntersectionObserverEntry[] = entries.map((entry) => ({
      target: entry.target,
      isIntersecting: entry.isIntersecting,
      intersectionRatio: entry.intersectionRatio ?? (entry.isIntersecting ? 1 : 0),
      boundingClientRect: entry.target.getBoundingClientRect(),
      intersectionRect: entry.isIntersecting
        ? entry.target.getBoundingClientRect()
        : ({} as DOMRectReadOnly),
      rootBounds: null,
      time: Date.now(),
    }));

    this.callback(observerEntries, this);
  }
}

// ============================================================================
// ResizeObserver Mock
// ============================================================================

export class MockResizeObserver implements ResizeObserver {
  private callback: ResizeObserverCallback;
  private elements: Set<Element> = new Set();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    this.elements.add(target);
  }

  unobserve(target: Element): void {
    this.elements.delete(target);
  }

  disconnect(): void {
    this.elements.clear();
  }

  /**
   * Simulate resize (for testing)
   */
  simulateResize(
    entries: { target: Element; contentRect?: DOMRectReadOnly }[]
  ): void {
    const observerEntries: ResizeObserverEntry[] = entries.map((entry) => ({
      target: entry.target,
      contentRect:
        entry.contentRect ||
        ({
          width: 100,
          height: 100,
          x: 0,
          y: 0,
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
          toJSON: () => ({}),
        } as DOMRectReadOnly),
      borderBoxSize: [{ inlineSize: 100, blockSize: 100 }],
      contentBoxSize: [{ inlineSize: 100, blockSize: 100 }],
      devicePixelContentBoxSize: [{ inlineSize: 100, blockSize: 100 }],
    }));

    this.callback(observerEntries, this);
  }
}

// ============================================================================
// Fetch Mock
// ============================================================================

export function createMockFetch(
  responses: Map<string, Response>
): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = input.toString();
    const response = responses.get(url);

    if (response) {
      return response.clone();
    }

    // Return 404 for unmatched URLs
    return new Response("Not Found", { status: 404 });
  }) as unknown as typeof fetch;
}

// ============================================================================
// Scroll Methods Mock
// ============================================================================

export function mockScrollMethods(): void {
  Element.prototype.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
  window.scrollBy = vi.fn();
}

// ============================================================================
// Clipboard API Mock
// ============================================================================

export class MockClipboard {
  private clipboardData: string = "";

  readText(): Promise<string> {
    return Promise.resolve(this.clipboardData);
  }

  writeText(data: string): Promise<void> {
    this.clipboardData = data;
    return Promise.resolve();
  }

  clear(): void {
    this.clipboardData = "";
  }
}

// ============================================================================
// Setup All Browser Mocks
// ============================================================================

export function setupBrowserMocks(): {
  localStorage: MockStorage;
  sessionStorage: MockStorage;
  clipboard: MockClipboard;
} {
  const localStorage = new MockStorage();
  const sessionStorage = new MockStorage();
  const clipboard = new MockClipboard();

  Object.defineProperty(window, "localStorage", {
    value: localStorage,
    writable: true,
  });

  Object.defineProperty(window, "sessionStorage", {
    value: sessionStorage,
    writable: true,
  });

  Object.defineProperty(navigator, "clipboard", {
    value: clipboard,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: MockIntersectionObserver,
  });

  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: MockResizeObserver,
  });

  setupMatchMedia();
  mockScrollMethods();

  return { localStorage, sessionStorage, clipboard };
}
