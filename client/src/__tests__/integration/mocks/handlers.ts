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

export interface AdminOrdersResponse {
  orders: any[];
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
  orders: [] as any[],
  guardianStudents: [] as any[],
  sessions: new Map<string, any>(),
  sessionPasswords: new Map<string, string>(),
  authenticatedSessions: new Set<string>(),
  currentUser: null as any,
  currentGuardian: {
    authenticated: true,
    email: "",
    accountNumber: "ACC-1001",
    fullName: null,
    phone: null,
  } as any,
  nextRegistrationId: 1,
  nextOrderId: 1,
  nextStudentId: 1,
  shouldFailNextRequest: false,
  shouldFailPayment: false,
  networkError: false,
  /** When true, BJJ flows hit create-intent after subscription endpoint declines (Vitest). */
  subscriptionUnavailable: false,
  adminOffers: [] as any[],
};

export function resetMockStore() {
  mockStore.registrations = [];
  mockStore.payments = [];
  mockStore.orders = [];
  mockStore.guardianStudents = [];
  mockStore.sessions.clear();
  mockStore.sessionPasswords.clear();
  mockStore.authenticatedSessions.clear();
  mockStore.currentUser = null;
  mockStore.currentGuardian = {
    authenticated: true,
    email: "",
    accountNumber: "ACC-1001",
    fullName: null,
    phone: null,
  };
  mockStore.nextRegistrationId = 1;
  mockStore.nextOrderId = 1;
  mockStore.nextStudentId = 1;
  mockStore.shouldFailNextRequest = false;
  mockStore.shouldFailPayment = false;
  mockStore.networkError = false;
  mockStore.subscriptionUnavailable = false;
  mockStore.adminOffers = [
    {
      id: 1,
      program_id: "archery",
      name: "May 2026 Four-Week Series",
      is_private: 0,
      active: 1,
      access_code: null,
      audience_gender: null,
      dates: ["2026-05-10", "2026-05-17", "2026-05-24", "2026-05-31"],
      confirmation_notes: "All equipment is provided.",
    },
  ];
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

    if (body.email === "muadh@sunnahskills.com" && body.password === "admin123") {
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

  // Guardian endpoints
  http.get("/api/guardian/me", () => {
    if (mockStore.networkError) {
      return HttpResponse.error();
    }

    if (mockStore.currentGuardian?.authenticated) {
      return HttpResponse.json(mockStore.currentGuardian);
    }

    return HttpResponse.json({ authenticated: false }, { status: 401 });
  }),

  http.get("/api/guardian/students", () => {
    if (!mockStore.currentGuardian?.authenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return HttpResponse.json({ students: mockStore.guardianStudents });
  }),

  http.post("/api/guardian/students", async ({ request }) => {
    if (!mockStore.currentGuardian?.authenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as Record<string, unknown>;
    const student = {
      id: mockStore.nextStudentId++,
      full_name: String(body.fullName ?? ""),
      date_of_birth: typeof body.dateOfBirth === "string" ? body.dateOfBirth : null,
      gender: typeof body.gender === "string" ? body.gender : null,
      medical_notes: typeof body.medicalNotes === "string" ? body.medicalNotes : null,
      created_at: new Date().toISOString(),
    };
    mockStore.guardianStudents.push(student);
    return HttpResponse.json({ ok: true, student });
  }),

  http.patch("/api/guardian/students/:id", async ({ params, request }) => {
    if (!mockStore.currentGuardian?.authenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = Number(params.id);
    const student = mockStore.guardianStudents.find((entry: any) => entry.id === id);
    if (!student) {
      return HttpResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await request.json() as Record<string, unknown>;
    Object.assign(student, {
      full_name: body.fullName ?? student.full_name,
      date_of_birth: body.dateOfBirth ?? student.date_of_birth,
      gender: body.gender ?? student.gender,
      medical_notes: body.medicalNotes ?? student.medical_notes,
    });

    return HttpResponse.json({ ok: true, student });
  }),

  http.delete("/api/guardian/students/:id", ({ params }) => {
    if (!mockStore.currentGuardian?.authenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = Number(params.id);
    mockStore.guardianStudents = mockStore.guardianStudents.filter((entry: any) => entry.id !== id);
    return HttpResponse.json({ ok: true });
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

  http.post("/api/register/cart", async ({ request }) => {
    if (mockStore.networkError) {
      return HttpResponse.error();
    }

    if (!mockStore.currentGuardian?.authenticated) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (mockStore.shouldFailNextRequest) {
      return HttpResponse.json({ error: "Registration failed" }, { status: 500 });
    }

    const body = await request.json() as {
      guardian: { fullName?: string; email?: string; phone?: string };
      lines?: Array<{
        student?: Record<string, unknown>;
        programDetails?: Record<string, unknown>;
        paymentChoice?: "full" | "plan";
      }>;
      waivers?: Record<string, unknown>;
    };

    const orderId = mockStore.nextOrderId++;
    const lines = body.lines ?? [];
    const registrationIds: number[] = [];
    const createdAt = new Date().toISOString();

    lines.forEach((line) => {
      const registrationId = mockStore.nextRegistrationId++;
      registrationIds.push(registrationId);
      mockStore.registrations.push({
        id: registrationId,
        enrollmentOrderId: orderId,
        guardian: body.guardian,
        student: line.student,
        programSlug: "bjj",
        programDetails: line.programDetails,
        paymentChoice: line.paymentChoice ?? "full",
        waivers: body.waivers,
        status: "pending_payment",
        createdAt,
      });
    });

    const lineCount = Math.max(lines.length, 1);
    const firstLine = lines[0];
    const paymentChoice = firstLine?.paymentChoice ?? "full";
    const totalCents = 10000 * lineCount;
    const amountDueToday = paymentChoice === "plan" ? Math.round(totalCents / 2) : totalCents;
    const laterAmount = paymentChoice === "plan" ? totalCents - amountDueToday : 0;

    mockStore.orders.push({
      order_id: orderId,
      order_status: "pending_payment",
      manual_review_status: "none",
      manual_review_reason: null,
      last_payment_error: null,
      last_payment_attempt_at: null,
      total_cents: totalCents,
      amount_due_today_cents: amountDueToday,
      later_amount_cents: laterAmount,
      later_payment_date: laterAmount > 0 ? "2026-04-23" : null,
      guardian_name: body.guardian?.fullName ?? null,
      guardian_email: body.guardian?.email ?? null,
      registration_count: registrationIds.length,
      student_names: lines
        .map((line) => String((line.student as Record<string, unknown> | undefined)?.fullName ?? ""))
        .filter(Boolean)
        .join(", "),
      paid_cents: 0,
      latest_payment_status: "requires_confirmation",
      first_registration_id: registrationIds[0] ?? null,
      created_at: createdAt,
    });

    return HttpResponse.json({
      ok: true,
      enrollmentOrderId: orderId,
      registrationIds,
      summary: { waitlisted: false },
    });
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

  http.post("/api/payments/create-order-intent", async ({ request }) => {
    if (mockStore.networkError) {
      return HttpResponse.error();
    }

    if (mockStore.shouldFailNextRequest || mockStore.shouldFailPayment) {
      mockStore.shouldFailPayment = false;
      return HttpResponse.json({ error: "Payment creation failed" }, { status: 500 });
    }

    const body = (await request.json()) as { enrollmentOrderId: number };
    const order = mockStore.orders.find((entry: any) => entry.order_id === body.enrollmentOrderId);
    if (!order) {
      return HttpResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const payment = {
      id: `pi_${Date.now()}`,
      orderId: body.enrollmentOrderId,
      amount: order.amount_due_today_cents ?? order.total_cents ?? 0,
      status: "requires_confirmation",
      createdAt: new Date().toISOString(),
    };

    mockStore.payments.push(payment);
    order.latest_payment_status = payment.status;
    order.last_payment_attempt_at = payment.createdAt;

    return HttpResponse.json({
      clientSecret: `${payment.id}_secret_${Math.random().toString(36).slice(2)}`,
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

  http.get("/api/payments/public-config", () => {
    return HttpResponse.json({
      publishableKey: "pk_test_mock_publishable_key",
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

  http.get("/api/admin/orders", () => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = mockStore.orders.length > 0
      ? mockStore.orders
      : mockStore.payments.map((payment: any, index: number) => ({
          order_id: payment.order_id ?? payment.payment_id ?? index + 1,
          order_status: payment.status ?? "pending_payment",
          manual_review_status: payment.manual_review_status ?? "none",
          manual_review_reason: payment.manual_review_reason ?? null,
          last_payment_error: payment.last_payment_error ?? null,
          last_payment_attempt_at: payment.created_at ?? null,
          total_cents: payment.amount ?? 0,
          amount_due_today_cents: payment.amount ?? 0,
          later_amount_cents: payment.later_amount_cents ?? 0,
          later_payment_date: payment.later_payment_date ?? null,
          guardian_name: payment.guardian_name ?? null,
          guardian_email: payment.guardian_email ?? null,
          registration_count: payment.registration_count ?? 1,
          student_names: payment.student_names ?? null,
          paid_cents: payment.status === "paid" || payment.status === "succeeded" ? payment.amount ?? 0 : 0,
          latest_payment_status: payment.status ?? null,
          first_registration_id: payment.registration_id ?? null,
          created_at: payment.created_at ?? new Date().toISOString(),
        }));

    return HttpResponse.json({ orders });
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

  http.get("/api/admin/proration-codes", () => {
    return HttpResponse.json({ codes: [] });
  }),

  http.post("/api/admin/discounts", async ({ request }) => {
    return HttpResponse.json({ ok: true, discount: { id: 1 } });
  }),

  http.get("/api/admin/trials", () => {
    return HttpResponse.json({ trials: [] });
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

  http.get("/api/admin/offers", () => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json({ offers: mockStore.adminOffers });
  }),

  http.post("/api/admin/offers", async ({ request }) => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json() as Record<string, unknown>;
    const offer = {
      id: mockStore.adminOffers.length + 1,
      program_id: String(body.programId ?? "archery"),
      name: String(body.name ?? "Offer"),
      is_private: body.isPrivate ? 1 : 0,
      active: 1,
      access_code: body.isPrivate ? "PRIVATE123" : null,
      audience_gender: body.audienceGender ? String(body.audienceGender) : null,
      dates: Array.isArray(body.dates) ? body.dates : [],
      confirmation_notes: body.confirmationNotes ? String(body.confirmationNotes) : null,
    };
    mockStore.adminOffers.unshift(offer);
    return HttpResponse.json({ offer }, { status: 201 });
  }),

  http.patch("/api/admin/offers", async ({ request }) => {
    if (!mockStore.currentUser) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json() as Record<string, unknown>;
    const offer = mockStore.adminOffers.find((entry: any) => entry.id === Number(body.offerId));
    if (!offer) {
      return HttpResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    if (typeof body.active === "number") offer.active = body.active;
    if (Array.isArray(body.dates)) offer.dates = body.dates;
    if (typeof body.confirmationNotes === "string") offer.confirmation_notes = body.confirmationNotes;
    return HttpResponse.json({ ok: true });
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
              location_id: "mississauga",
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
              location_id: "mississauga",
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
            {
              id: 3,
              program_id: "bjj",
              location_id: "mississauga",
              name: "Girls 5–10 — Tuesday",
              day_of_week: "Tuesday",
              start_time: "13:30",
              end_time: "14:20",
              age_group: "girls-5-10",
              gender_group: "female",
              capacity: 20,
              enrolled_count: 0,
              visible: 1,
            },
            {
              id: 4,
              program_id: "bjj",
              location_id: "oakville",
              name: "Oakville Girls 5-10 - Monday",
              day_of_week: "Monday",
              start_time: "14:30",
              end_time: "15:30",
              start_date: "2026-05-18",
              end_date: "2026-06-26",
              age_group: "girls-5-10",
              gender_group: "female",
              capacity: 16,
              enrolled_count: 0,
              visible: 1,
            },
            {
              id: 5,
              program_id: "bjj",
              location_id: "oakville",
              name: "Oakville Girls 5-10 - Wednesday",
              day_of_week: "Wednesday",
              start_time: "14:30",
              end_time: "15:30",
              start_date: "2026-05-18",
              end_date: "2026-06-26",
              age_group: "girls-5-10",
              gender_group: "female",
              capacity: 16,
              enrolled_count: 0,
              visible: 1,
            },
            {
              id: 6,
              program_id: "bjj",
              location_id: "oakville",
              name: "Oakville Boys 7-13 - Monday",
              day_of_week: "Monday",
              start_time: "14:30",
              end_time: "15:30",
              start_date: "2026-05-18",
              end_date: "2026-06-26",
              age_group: "boys-7-13",
              gender_group: "male",
              capacity: 16,
              enrolled_count: 0,
              visible: 1,
            },
            {
              id: 7,
              program_id: "bjj",
              location_id: "oakville",
              name: "Oakville Boys 7-13 - Wednesday",
              day_of_week: "Wednesday",
              start_time: "14:30",
              end_time: "15:30",
              start_date: "2026-05-18",
              end_date: "2026-06-26",
              age_group: "boys-7-13",
              gender_group: "male",
              capacity: 16,
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
          offers: [],
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
        {
          id: "archery",
          slug: "archery",
          name: "Traditional Archery",
          status: "active",
          sessions: [
            {
              id: 21,
              program_id: "archery",
              offer_id: 1,
              name: "May Series — Morning Slot",
              season: "May 10, 17, 24, 31",
              day_of_week: "Sunday",
              start_time: "10:00",
              end_time: "12:00",
              age_group: "all",
              gender_group: null,
              capacity: 15,
              enrolled_count: 0,
              visible: 1,
              start_date: "2026-05-10",
              end_date: "2026-05-31",
            },
            {
              id: 22,
              program_id: "archery",
              offer_id: 1,
              name: "May Series — Afternoon Slot",
              season: "May 10, 17, 24, 31",
              day_of_week: "Sunday",
              start_time: "13:00",
              end_time: "15:00",
              age_group: "all",
              gender_group: null,
              capacity: 15,
              enrolled_count: 0,
              visible: 1,
              start_date: "2026-05-10",
              end_date: "2026-05-31",
            },
          ],
          prices: [
            {
              id: 6,
              program_id: "archery",
              offer_id: 1,
              age_group: "all",
              label: "May 2026 Four-Week Series",
              amount: 14000,
              frequency: "per_series",
              registration_fee: 0,
              metadata: '{"offer_id":1}',
              active: 1,
            },
          ],
          offers: [
            {
              id: 1,
              program_id: "archery",
              name: "May 2026 Four-Week Series",
              is_private: 0,
              active: 1,
              audience_gender: null,
              dates: ["2026-05-10", "2026-05-17", "2026-05-24", "2026-05-31"],
              description: "Four Sunday sessions with two time slots and all equipment included.",
              confirmation_notes: "All equipment is provided.",
              sessions: [
                {
                  id: 21,
                  program_id: "archery",
                  offer_id: 1,
                  name: "May Series — Morning Slot",
                  season: "May 10, 17, 24, 31",
                  day_of_week: "Sunday",
                  start_time: "10:00",
                  end_time: "12:00",
                  age_group: "all",
                  gender_group: null,
                  capacity: 15,
                  enrolled_count: 0,
                  visible: 1,
                  start_date: "2026-05-10",
                  end_date: "2026-05-31",
                },
                {
                  id: 22,
                  program_id: "archery",
                  offer_id: 1,
                  name: "May Series — Afternoon Slot",
                  season: "May 10, 17, 24, 31",
                  day_of_week: "Sunday",
                  start_time: "13:00",
                  end_time: "15:00",
                  age_group: "all",
                  gender_group: null,
                  capacity: 15,
                  enrolled_count: 0,
                  visible: 1,
                  start_date: "2026-05-10",
                  end_date: "2026-05-31",
                },
              ],
              prices: [
                {
                  id: 6,
                  program_id: "archery",
                  offer_id: 1,
                  age_group: "all",
                  label: "May 2026 Four-Week Series",
                  amount: 14000,
                  frequency: "per_series",
                  registration_fee: 0,
                  metadata: '{"offer_id":1}',
                  active: 1,
                },
              ],
            },
          ],
          active_semester: null,
        },
      ],
      locations: [
        { id: "mississauga", display_name: "Mississauga", city: "Mississauga", address: "918 Dundas St. West, Mississauga", status: "active" },
        { id: "oakville", display_name: "Oakville", city: "Oakville", address: "2200 Speers Road, Oakville", status: "active" },
      ],
    });
  }),

  http.post("/api/programs/reveal-offer", async ({ request }) => {
    const body = await request.json() as { accessCode?: string };
    if ((body.accessCode ?? "").toUpperCase() !== "WOMENS19") {
      return HttpResponse.json({ error: "Invalid or inactive access code." }, { status: 404 });
    }
    return HttpResponse.json({
      offer: {
        id: 2,
        program_id: "archery",
        name: "Women's Archery Campfire Session",
        is_private: 1,
        active: 1,
        access_code: "WOMENS19",
        audience_gender: "female",
        dates: ["2026-04-19"],
        description: "A women-only private one-off with campfire and marshmallows included.",
        confirmation_notes: "Bring layered clothing for the range and outdoor social time after shooting.",
        sessions: [
          {
            id: 23,
            program_id: "archery",
            offer_id: 2,
            name: "Women's One-Off",
            season: "April 19, 2026",
            day_of_week: "Sunday",
            start_time: "12:00",
            end_time: "14:30",
            age_group: "all",
            gender_group: "female",
            capacity: 25,
            enrolled_count: 0,
            visible: 1,
            start_date: "2026-04-19",
            end_date: "2026-04-19",
          },
        ],
        prices: [
          {
            id: 7,
            program_id: "archery",
            offer_id: 2,
            age_group: "female",
            label: "Women's One-Off Session",
            amount: 4500,
            frequency: "per_workshop",
            registration_fee: 0,
            metadata: '{"offer_id":2}',
            active: 1,
          },
        ],
      },
    });
  }),

  http.get("/api/waivers", ({ request }) => {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug") ?? "registration";
    if (slug === "archery") {
      return HttpResponse.json({
        waiver: {
          id: 2,
          slug: "archery",
          title: "Sunnah Skills Archery Waiver",
          version_label: "2026.04.09",
          body_html: "<p>Archery participation waiver.</p>",
          published_at: "2026-04-09T00:00:00.000Z",
        },
      });
    }
    return HttpResponse.json({
      waiver: {
        id: 1,
        slug: "registration",
        title: "Sunnah Skills Registration Waiver",
        version_label: "2026.03.31",
        body_html: "<p>Registration waiver.</p>",
        published_at: "2026-03-31T00:00:00.000Z",
      },
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
