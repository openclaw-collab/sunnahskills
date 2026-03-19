/**
 * Test setup for Cloudflare Pages Functions
 * Provides mocks for D1, Stripe, MailChannels, and R2
 */

import { vi } from "vitest";

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  compare: vi.fn(),
  hash: vi.fn(),
}));

// Mock Stripe
vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
    customers: {
      list: vi.fn(),
      create: vi.fn(),
    },
    coupons: {
      retrieve: vi.fn(),
      create: vi.fn(),
    },
    subscriptions: {
      create: vi.fn(),
    },
  })),
}));

// Create a mock D1 database
export function createMockD1Database() {
  const mockData: Record<string, any[]> = {
    admin_users: [],
    admin_sessions: [],
    registrations: [],
    guardians: [],
    students: [],
    programs: [],
    program_sessions: [],
    program_prices: [],
    payments: [],
    waivers: [],
    discounts: [],
    contacts: [],
    waitlist: [],
    studio_sessions: [],
  };

  let lastRowId = 0;

  const mockPrepare = vi.fn().mockImplementation((query: string) => {
    const queryLower = query.toLowerCase();

    return {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockImplementation(async () => {
        // SELECT ... WHERE id = ?
        if (queryLower.includes("where") && queryLower.includes("id = ?")) {
          const table = extractTableName(queryLower);
          const results = mockData[table] || [];
          return results[0] || null;
        }
        // SELECT COUNT(*)
        if (queryLower.includes("count(*)")) {
          const table = extractTableName(queryLower);
          return { cnt: (mockData[table] || []).length };
        }
        // SELECT * FROM programs WHERE slug = ?
        if (queryLower.includes("slug = ?")) {
          const table = extractTableName(queryLower);
          return (mockData[table] || []).find((r: any) => r.slug) || null;
        }
        // SELECT * FROM admin_users WHERE email = ?
        if (queryLower.includes("email = ?")) {
          const table = extractTableName(queryLower);
          return (mockData[table] || []).find((r: any) => r.email) || null;
        }
        // SELECT * FROM discounts WHERE code = ?
        if (queryLower.includes("code = ?")) {
          const table = extractTableName(queryLower);
          return (mockData[table] || []).find((r: any) => r.code) || null;
        }
        // Generic first
        const table = extractTableName(queryLower);
        return (mockData[table] || [])[0] || null;
      }),
      run: vi.fn().mockImplementation(async () => {
        // INSERT operations
        if (queryLower.includes("insert into")) {
          lastRowId++;
          const table = extractTableName(queryLower);
          if (!mockData[table]) mockData[table] = [];
          mockData[table].push({ id: lastRowId });
          return {
            success: true,
            meta: { last_row_id: lastRowId },
          };
        }
        // UPDATE/DELETE operations
        return { success: true };
      }),
      all: vi.fn().mockImplementation(async () => {
        const table = extractTableName(queryLower);
        return {
          results: mockData[table] || [],
          success: true,
        };
      }),
    };
  });

  return {
    prepare: mockPrepare,
    mockData,
    setMockData: (table: string, data: any[]) => {
      mockData[table] = data;
    },
    reset: () => {
      Object.keys(mockData).forEach((key) => {
        mockData[key] = [];
      });
      lastRowId = 0;
    },
  };
}

function extractTableName(query: string): string {
  // Extract table name from INSERT INTO, SELECT FROM, UPDATE, DELETE FROM
  const insertMatch = query.match(/insert into\s+(\w+)/);
  if (insertMatch) return insertMatch[1];

  const fromMatch = query.match(/from\s+(\w+)/);
  if (fromMatch) return fromMatch[1];

  const updateMatch = query.match(/update\s+(\w+)/);
  if (updateMatch) return updateMatch[1];

  return "unknown";
}

// Create mock environment
export function createMockEnv(overrides: Partial<Env> = {}): Env {
  const db = createMockD1Database();

  return {
    DB: db as unknown as D1Database,
    STRIPE_SECRET_KEY: "sk_test_123",
    STRIPE_WEBHOOK_SECRET: "whsec_test_123",
    EMAIL_FROM: "test@sunnahskills.pages.dev",
    EMAIL_TO: "admin@sunnahskills.pages.dev",
    SITE_URL: "https://test.sunnahskills.pages.dev",
    STUDIO_UPLOADS: createMockR2Bucket(),
    ...overrides,
  };
}

// Create mock R2 bucket
export function createMockR2Bucket(): R2Bucket {
  const storedObjects: Map<string, { body: ArrayBuffer; metadata: any }> = new Map();

  return {
    put: vi.fn().mockImplementation(async (key: string, value: ArrayBuffer, options?: R2PutOptions) => {
      storedObjects.set(key, { body: value, metadata: options?.httpMetadata });
      return { key } as R2Object;
    }),
    get: vi.fn().mockImplementation(async (key: string) => {
      const obj = storedObjects.get(key);
      if (!obj) return null;
      return {
        key,
        body: obj.body,
        httpMetadata: obj.metadata,
      } as R2Object;
    }),
    delete: vi.fn().mockImplementation(async (key: string) => {
      storedObjects.delete(key);
    }),
    list: vi.fn().mockImplementation(async () => ({
      objects: Array.from(storedObjects.keys()).map((key) => ({ key } as R2Object)),
      truncated: false,
    })),
  } as unknown as R2Bucket;
}

// Helper to create a mock request
export function createMockRequest(
  method: string,
  url: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {}
): Request {
  const headers = new Headers(options.headers || {});

  if (options.cookies) {
    const cookieString = Object.entries(options.cookies)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("; ");
    headers.set("Cookie", cookieString);
  }

  return new Request(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

// Helper to parse JSON response
export async function parseJsonResponse(response: Response): Promise<any> {
  return response.json();
}

// Reset all mocks before each test
export function resetMocks() {
  vi.clearAllMocks();
}
