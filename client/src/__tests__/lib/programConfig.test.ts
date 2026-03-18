import { describe, expect, it } from "vitest";
import { PROGRAMS, getProgramConfig } from "@/lib/programConfig";

describe("programConfig", () => {
  it("exports four known program configs", () => {
    expect(Object.keys(PROGRAMS).sort()).toEqual(["archery", "bjj", "bullyproofing", "outdoor"]);
  });

  it("returns config for valid slug and null otherwise", () => {
    expect(getProgramConfig("bjj")?.registerPath).toBe("/programs/bjj/register");
    expect(getProgramConfig("nope")).toBeNull();
  });
});

