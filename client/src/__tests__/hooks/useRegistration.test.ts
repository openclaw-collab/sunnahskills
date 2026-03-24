import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRegistration } from "@/hooks/useRegistration";

describe("useRegistration", () => {
  it("initializes at step 0 and can advance and update draft", () => {
    const { result } = renderHook(() => useRegistration("bjj"));

    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.draft.programSlug).toBe("bjj");

    act(() => result.current.goNext());
    expect(result.current.currentStepIndex).toBe(1);

    act(() =>
      result.current.updateDraft((prev) => ({
        ...prev,
        guardian: { ...prev.guardian, fullName: "Parent Name" },
      })),
    );

    expect(result.current.draft.guardian.fullName).toBe("Parent Name");
  });
});

