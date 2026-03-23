import { http, HttpResponse } from "msw";

// Types for API responses
export interface RegistrationResponse {
  registrationId?: number;
  waitlisted?: boolean;
  position?: number;
  error?: string;
}

export interface PaymentIntentResponse {
  clientSecret?: string;
  error?: string;
}

export interface SubscriptionResponse {
  clientSecret?: string;
  subscriptionId?: string;
  error?: string;
}

export interface AuthResponse {
  ok: boolean;
  user?: {
    email: string;
    name: string | null;
    role: string;
  };
  error?: string;
}

export interface AdminRegistrationsResponse {
  registrations: any[];
}

export interface AdminPaymentsResponse {
  payments: any[];
}

export interface StudioSessionResponse {
  id: string;
  name: string;
  edits: any[];
  comments: any[];
  uploads: any[];
  themePresetId?: string;
  customTheme?: any;
  positions?: Record<string, any>;
}

// Mock data stores for test state management
export const mockStore = {
  registrations: [] as any[],
  payments: [] as any[],
  sessions: new Map<string, any>(),
  sessionPasswords: new Map<string, string>(),
  authenticatedSessions: new Set<string>(),
  currentUser: null as any,
  nextRegistrationId: 1,
  shouldFailNextRequest: false,
  shouldFailPayment: false,
  networkError: false,
  /** When true, BJJ flows hit create-intent after subscription endpoint declines (Vitest). */
  subscriptionUnavailable: false,
};

export function resetMockStore() {
  mockStore.registrations = [];
  mockStore.payments = [];
  mockStore.sessions.clear();
  mockStore.sessionPasswords.clear();
  mockStore.authenticatedSessions.clear();
  mockStore.currentUser = null;
  mockStore.nextRegistrationId = 1;
  mockStore.shouldFailNextRequest = false;
  mockStore.shouldFailPayment = false;
  mockStore.networkError = false;
  mockStore.subscriptionUnavailable = false;
}

// MSW Handlers
export const handlers = [
  // Auth endpoints
  http.post("/api/auth/login", async ({ request }) => {
    if (mockStore.networkError) {
      return HttpResponse.error();
    }

    if (mockStore.shouldFailNextRequest) {
      return HttpResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    const body = (await request.json()) as { email: string; password: string };

    if (body.email === "admin@sunnahskills.com" && body.password === "admin123") {
      mockStore.currentUser = {
        email: body.email,
        name: "Admin User",
        role: "admin",
      };
      return HttpResponse.json({ ok: true });
    }

    return HttpResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }),

  http.post("/api/auth/logout", () => {
    mockStore.currentUser = null;
    return HttpResponse.json({ ok: true });
  }),

  http.get("/api/auth/me", () => {
    if (mockStore.currentUser) {
      return HttpResponse.json({ ok: true, user: mockStore.currentUser });
    }
    return HttpResponse.json({ ok: false }, { status: 401 });
  }),

  // Registration endpoints
  http.post("/api/register", async ({ request }) => {
    if (mockStore.networkError) {
      return HttpResponse.error();
    }

    if (mockStore.shouldFailNextRequest) {
      return HttpResponse.json({ error: "Registration failed" }, { status: 500 });
    }

    const body = await request.json() as Record<string, unknown>;
    const registrationId = mockStore.nextRegistrationId++;

    const registration = {
      id: registrationId,
      ...body,
      status: "pending_payment",
      createdAt: new Date().toISOString(),
    };

    mockStore.registrations.push(registration);

    return HttpResponse.json({ ok: true, registrationId, status: "submitted" });
  }),

  // Payment endpoints
  http.post("/api/payments/create-intent", async ({ request }) => {
    if (mockStore.networkError) {
      return HttpResponse.error();
    }

    if (mockStore.shouldFailNextRequest || mockStore.shouldFailPayment) {
      mockStore.shouldFailPayment = false;
      return HttpResponse.json({ error: "Payment creation failed" }, { status: 500 });
    }

    const body = (await request.json()) as { registrationId: number; discountCode?: string; siblingCount?: number };

    const payment = {
      id: `pi_${Date.now()}`,
      registrationId: body.registrationId,
      amount: body.siblingCount ? 10000 - (body.siblingCount * 1000) : 10000,
      status: "requires_confirmation",
      createdAt: new Date().toISOString(),
    };

    mockStore.payments.push(payment);

    return HttpResponse.json({
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`,
    });
  }),

  http.post("/api/payments/create-subscription", async ({ request }) => {
    if (mockStore.networkError) {
      return HttpResponse.error();
    }

    if (mockStore.subscriptionUnavailable) {
      return HttpResponse.json({ error: "subscriptions_not_configured" }, { status: 400 });
    }

    const body = (await request.json()) as { registrationId: number; discountCode?: string; siblingCount?: number };

    // Simulate subscriptions_not_configured fallback
    const url = new URL(request.url);
    if (url.searchParams.get("fallback") === "true") {
      return HttpResponse.json({ error: "subscriptions_not_configured" }, { status: 400 });
    }

    if (mockStore.shouldFailPayment) {
      // Fall through to create-intent which will also fail
      return HttpResponse.json({ error: "subscriptions_not_configured" }, { status: 400 });
    }

    if (mockStore.shouldFailNextRequest) {
      return HttpResponse.json({ error: "Subscription creation failed" }, { status: 500 });
    }

    const subscription = {
      id: `sub_${Date.now()}`,
      registrationId: body.registrationId,
      status: "incomplete",
      createdAt: new Date().toISOString(),
    };

    mockStore.payments.push(subscription);

    return HttpResponse.json({
      clientSecret: `seti_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`,
      subscriptionId: subscription.id,
    });
  }),

  // Admin endpoints
  http.get("/api/admin/dashboard", () => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json({
      metrics: {
        registrations: {
          total: mockStore.registrations.length,
          active: mockStore.registrations.filter((r: any) => r.status === "completed" || r.registration_status === "completed").length,
          pending_payment: mockStore.registrations.filter(
            (r: any) => r.status === "pending_payment" || r.registration_status === "pending_payment",
          ).length,
          waitlisted: 0,
        },
        payments: {
          total: mockStore.payments.length,
          paid_revenue: mockStore.payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
          pending_revenue: 0,
        },
        contacts: { total: 0 },
        sessions: { total_sessions: 0, active_capacity: 0, enrolled_total: 0 },
        users: { total_users: 0, tech_users: 0, active_users: 0 },
      },
      activity: [],
    });
  }),

  http.get("/api/admin/registrations", () => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return HttpResponse.json({ registrations: mockStore.registrations });
  }),

  http.get("/api/admin/registrations/:id", ({ params }) => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id as string, 10);
    const registration = mockStore.registrations.find((r) => r.id === id || r.registration_id === id);
    if (!registration) {
      return HttpResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return HttpResponse.json({ registration });
  }),

  http.get("/api/admin/payments", () => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return HttpResponse.json({ payments: mockStore.payments });
  }),

  http.patch("/api/admin/registrations/:id", async ({ params, request }) => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id as string, 10);
    const body = await request.json();

    const registration = mockStore.registrations.find((r) => r.id === id);
    if (!registration) {
      return HttpResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    Object.assign(registration, body);
    return HttpResponse.json({ ok: true, registration });
  }),

  http.delete("/api/admin/registrations/:id", ({ params }) => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id as string, 10);
    const index = mockStore.registrations.findIndex((r) => r.id === id);

    if (index === -1) {
      return HttpResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    mockStore.registrations.splice(index, 1);
    return HttpResponse.json({ ok: true });
  }),

  // Additional admin endpoints
  http.get("/api/admin/programs", () => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json({
      programs: [
        { id: 1, slug: "bjj", name: "Brazilian Jiu-Jitsu", type: "recurring" },
        { id: 2, slug: "archery", name: "Archery", type: "one-time" },
      ],
    });
  }),

  http.get("/api/admin/semesters", () => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json({
      semesters: [
        {
          id: 1,
          name: "Spring 2026",
          program_id: "bjj",
          start_date: "2026-03-01",
          end_date: "2026-06-15",
          classes_in_semester: 12,
          price_per_class_cents: 1250,
          registration_fee_cents: 2500,
          later_payment_date: null,
          active: 1,
        },
      ],
    });
  }),

  http.patch("/api/admin/semesters", async () => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json({ ok: true });
  }),

  http.get("/api/admin/discounts", () => {
    return HttpResponse.json({ discounts: [] });
  }),

  http.post("/api/admin/discounts", async ({ request }) => {
    return HttpResponse.json({ ok: true, discount: { id: 1 } });
  }),

  http.get("/api/admin/sessions", () => {
    return HttpResponse.json({ sessions: [] });
  }),

  http.post("/api/admin/sessions", async () => {
    return HttpResponse.json({ ok: true });
  }),

  http.get("/api/admin/contacts", () => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json({ contacts: [] });
  }),

  http.get("/api/programs", () => {
    return HttpResponse.json({
      programs: [
        {
          id: "bjj",
          slug: "bjj",
          name: "Brazilian Jiu-Jitsu",
          status: "active",
          sessions: [
            {
              id: 1,
              program_id: "bjj",
              name: "Boys 7–13 — Friday",
              day_of_week: "Friday",
              start_time: "10:00",
              end_time: "11:00",
              age_group: "boys-7-13",
              gender_group: "male",
              capacity: 20,
              enrolled_count: 0,
              visible: 1,
            },
            {
              id: 2,
              program_id: "bjj",
              name: "Boys 7–13 — Tuesday",
              day_of_week: "Tuesday",
              start_time: "14:30",
              end_time: "15:30",
              age_group: "boys-7-13",
              gender_group: "male",
              capacity: 20,
              enrolled_count: 0,
              visible: 1,
            },
          ],
          prices: [
            {
              id: 1,
              program_id: "bjj",
              age_group: "boys-7-13",
              label: "Boys 7–13 (per class)",
              amount: 1250,
              frequency: "per_session",
              registration_fee: 2500,
              metadata: '{"classes_in_semester_default":12}',
              active: 1,
            },
          ],
          active_semester: {
            id: 1,
            name: "Spring 2026",
            program_id: "bjj",
            start_date: "2026-01-01",
            end_date: "2026-06-30",
            classes_in_semester: 12,
            price_per_class_cents: 1250,
            registration_fee_cents: 2500,
            later_payment_date: null,
            active: 1,
          },
        },
      ],
    });
  }),

  // Studio endpoints
  http.get("/api/studio/sessions/:id", ({ params, request }) => {
    const id = params.id as string;
    const session = mockStore.sessions.get(id);

    if (!session) {
      return HttpResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if password protected and not authenticated
    const password = mockStore.sessionPasswords.get(id);
    if (password && !mockStore.authenticatedSessions.has(id)) {
      return HttpResponse.json({ protected: true, id }, { status: 401 });
    }

    return HttpResponse.json(session);
  }),

  http.post("/api/studio/sessions/:id", async ({ params, request }) => {
    const id = params.id as string;
    const body = (await request.json()) as { password: string };

    const expectedPassword = mockStore.sessionPasswords.get(id);
    if (expectedPassword && body.password !== expectedPassword) {
      return HttpResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    mockStore.authenticatedSessions.add(id);
    return HttpResponse.json({ ok: true });
  }),

  http.post("/api/studio/sessions", async ({ request }) => {
    const body = (await request.json()) as { name?: string; password?: string };
    const id = `sess_${Date.now()}`;

    const session: StudioSessionResponse = {
      id,
      name: body.name || "New Session",
      edits: [],
      comments: [],
      uploads: [],
    };

    mockStore.sessions.set(id, session);
    if (body.password) {
      mockStore.sessionPasswords.set(id, body.password);
    }

    return HttpResponse.json({
      id,
      shareUrl: `${window.location.origin}?studio=${id}`,
    });
  }),

  http.patch("/api/studio/sessions/:id", async ({ params, request }) => {
    const id = params.id as string;
    const body = await request.json();

    if (!mockStore.authenticatedSessions.has(id)) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = mockStore.sessions.get(id);
    if (!session) {
      return HttpResponse.json({ error: "Session not found" }, { status: 404 });
    }

    Object.assign(session, body);
    return HttpResponse.json({ ok: true });
  }),

  http.post("/api/studio/uploads", async ({ request }) => {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session");

    if (!sessionId || !mockStore.authenticatedSessions.has(sessionId)) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock file upload - return a fake URL
    return HttpResponse.json({
      ok: true,
      upload: {
        url: `https://example.com/uploads/${Date.now()}.png`,
      },
    });
  }),
];
