import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/useMobile";

describe("useIsMobile", () => {
  let matchMediaListeners: Array<(e: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    matchMediaListeners = [];

    // Mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          matchMediaListeners.push(listener);
        }),
        removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          matchMediaListeners = matchMediaListeners.filter((l) => l !== listener);
        }),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock window.innerWidth
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false for desktop viewport", () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("returns true for mobile viewport", () => {
    window.innerWidth = 375;
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("returns true at exactly 767px (breakpoint - 1)", () => {
    window.innerWidth = 767;
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("returns false at exactly 768px (breakpoint)", () => {
    window.innerWidth = 768;
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("updates when viewport changes", () => {
    window.innerWidth = 1024;
    const { result, rerender } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Simulate viewport change
    window.innerWidth = 375;
    act(() => {
      matchMediaListeners.forEach((listener) =>
        listener({ matches: true } as MediaQueryListEvent)
      );
    });

    rerender();
    expect(result.current).toBe(true);
  });

  it("cleans up event listener on unmount", () => {
    const removeEventListenerSpy = vi.fn();

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerSpy,
        dispatchEvent: vi.fn(),
      })),
    });

    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();
  });

  it("uses 768px as breakpoint", () => {
    const matchMediaMock = vi.fn();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock.mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    renderHook(() => useIsMobile());

    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 767px)");
  });
});
