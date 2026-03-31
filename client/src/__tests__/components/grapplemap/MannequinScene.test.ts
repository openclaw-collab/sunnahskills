import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadGrappleMapSequence } from "@/components/grapplemap/MannequinScene";

describe("loadGrappleMapSequence", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("does not permanently cache null after a failed fetch", async () => {
    const path = "/data/library/admin/transitions/retry-sequence.json";
    const payload = {
      frames: [[[[0, 0, 0]]]],
      markers: [{ name: "test", frame: 0, type: "position" }],
    };

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network fail"))
      .mockResolvedValueOnce({
        json: async () => payload,
      } satisfies Partial<Response>);

    global.fetch = fetchMock as typeof global.fetch;

    const first = await loadGrappleMapSequence(path);
    const second = await loadGrappleMapSequence(path);

    expect(first).toBeNull();
    expect(second).not.toBeNull();
    expect(second?.markers?.[0]?.name).toBe("test");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
