import { describe, expect, it } from "vitest";
import { onRequestGet } from "../api/programs";
import { createMockEnv, parseJsonResponse } from "./setup";

describe("GET /api/programs location catalog", () => {
  it("returns locations and keeps BJJ sessions tagged by location", async () => {
    const env = createMockEnv();
    const mockDb = env.DB as any;
    mockDb.setMockData("programs", [
      { id: "bjj", slug: "bjj", name: "Brazilian Jiu-Jitsu", status: "active" },
    ]);
    mockDb.setMockData("locations", [
      { id: "mississauga", display_name: "Mississauga", city: "Mississauga", status: "active" },
      { id: "oakville", display_name: "Oakville", city: "Oakville", status: "active" },
    ]);
    mockDb.setMockData("program_sessions", [
      { id: 1, program_id: "bjj", location_id: "mississauga", age_group: "boys-7-13", visible: 1 },
      { id: 2, program_id: "bjj", location_id: "oakville", age_group: "boys-7-13", visible: 1 },
    ]);
    mockDb.setMockData("program_prices", [
      { id: 1, program_id: "bjj", age_group: "boys-7-13", active: 1 },
    ]);

    const response = await onRequestGet({ request: new Request("https://example.com/api/programs"), env });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.locations.map((location: any) => location.id)).toEqual(["mississauga", "oakville"]);
    expect(data.programs[0].sessions.map((session: any) => session.location_id)).toEqual(["mississauga", "oakville"]);
  });
});
