import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast, toast, reducer } from "@/hooks/use-toast";

describe("useToast reducer", () => {
  it("adds toast on ADD_TOAST action", () => {
    const state = { toasts: [] };
    const action = {
      type: "ADD_TOAST" as const,
      toast: { id: "1", title: "Test", open: true },
    };

    const result = reducer(state, action);

    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0].title).toBe("Test");
  });

  it("limits toasts to TOAST_LIMIT", () => {
    const state = {
      toasts: [
        { id: "1", title: "First", open: true },
      ],
    };
    const action = {
      type: "ADD_TOAST" as const,
      toast: { id: "2", title: "Second", open: true },
    };

    const result = reducer(state, action);

    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0].title).toBe("Second");
  });

  it("updates toast on UPDATE_TOAST action", () => {
    const state = {
      toasts: [{ id: "1", title: "Old", open: true }],
    };
    const action = {
      type: "UPDATE_TOAST" as const,
      toast: { id: "1", title: "New" },
    };

    const result = reducer(state, action);

    expect(result.toasts[0].title).toBe("New");
  });

  it("dismisses toast on DISMISS_TOAST action", () => {
    const state = {
      toasts: [{ id: "1", title: "Test", open: true }],
    };
    const action = {
      type: "DISMISS_TOAST" as const,
      toastId: "1",
    };

    const result = reducer(state, action);

    expect(result.toasts[0].open).toBe(false);
  });

  it("dismisses all toasts when toastId not provided", () => {
    const state = {
      toasts: [
        { id: "1", title: "First", open: true },
        { id: "2", title: "Second", open: true },
      ],
    };
    const action = {
      type: "DISMISS_TOAST" as const,
    };

    const result = reducer(state, action);

    expect(result.toasts.every((t) => !t.open)).toBe(true);
  });

  it("removes toast on REMOVE_TOAST action", () => {
    const state = {
      toasts: [
        { id: "1", title: "First", open: false },
        { id: "2", title: "Second", open: false },
      ],
    };
    const action = {
      type: "REMOVE_TOAST" as const,
      toastId: "1",
    };

    const result = reducer(state, action);

    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0].id).toBe("2");
  });

  it("removes all toasts when toastId not provided", () => {
    const state = {
      toasts: [
        { id: "1", title: "First", open: false },
        { id: "2", title: "Second", open: false },
      ],
    };
    const action = {
      type: "REMOVE_TOAST" as const,
    };

    const result = reducer(state, action);

    expect(result.toasts).toHaveLength(0);
  });
});

describe("toast function", () => {
  it("returns toast with id, dismiss and update functions", () => {
    const result = toast({ title: "Test" });

    expect(result.id).toBeDefined();
    expect(typeof result.dismiss).toBe("function");
    expect(typeof result.update).toBe("function");
  });
});

describe("useToast hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns toasts array", () => {
    const { result } = renderHook(() => useToast());

    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it("returns toast function", () => {
    const { result } = renderHook(() => useToast());

    expect(typeof result.current.toast).toBe("function");
  });

  it("returns dismiss function", () => {
    const { result } = renderHook(() => useToast());

    expect(typeof result.current.dismiss).toBe("function");
  });

  it("adds toast when toast function called", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "New Toast" });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("New Toast");
  });

  it("dismisses specific toast", () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const t = result.current.toast({ title: "To Dismiss" });
      toastId = t.id;
    });

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("dismisses all toasts when no id provided", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "First" });
      result.current.toast({ title: "Second" });
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts.every((t) => !t.open)).toBe(true);
  });
});
