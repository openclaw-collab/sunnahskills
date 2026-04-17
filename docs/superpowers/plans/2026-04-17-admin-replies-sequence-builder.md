# Admin Replies and Coach Sequence Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin email reply flow for contact messages and make the Sequence Builder easier for coaches without changing the public website or public technique library.

**Architecture:** Keep contact replies inside the existing admin contacts surface: a write-gated `POST /api/admin/contacts` sends one reply email through the existing Resend mail utility, while `ContactsTable` adds an inline reply composer per message. Improve `AdminSequences` in place by adding coach-oriented filters, plain-language labels, a persistent sequence timeline, and a clear full-sequence preview mode without changing the save/publish API.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, React Testing Library, Cloudflare Pages Functions, D1, Resend mail utility.

---

## File Structure

- Modify: `functions/api/admin/contacts.ts`
  - Keep `GET /api/admin/contacts`.
  - Add `POST /api/admin/contacts` for admin-authenticated replies.
- Modify: `functions/_utils/adminAuth.ts`
  - Allow default admin accounts to write contacts so non-technical admins can send replies.
- Modify: `vitest.functions.config.ts`
  - Include the focused contact reply function test in the functions test project.
- Test: `functions/__tests__/admin-contacts-reply.test.ts`
  - Covers auth gating, payload validation, contact lookup, and email send.
- Modify: `client/src/components/admin/ContactsTable.tsx`
  - Add per-contact reply composer, send state, and success/error feedback.
- Test: `client/src/__tests__/components/admin/ContactsTable.test.tsx`
  - Covers opening composer and posting a reply.
- Modify: `client/src/pages/admin/AdminSequences.tsx`
  - Add coach filters, plain-language route labels, timeline, and full sequence preview labels.
- Test: `client/src/__tests__/integration/admin-sequences.test.tsx`
  - Covers coach filters, sequence timeline, and full-sequence preview wording.

## Task 1: Contact Reply API

**Files:**
- Modify: `functions/api/admin/contacts.ts`
- Create: `functions/__tests__/admin-contacts-reply.test.ts`

- [ ] **Step 1: Write failing API tests**

Create `functions/__tests__/admin-contacts-reply.test.ts` with:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestPost as replyHandler } from "../api/admin/contacts";
import { createMockEnv, createMockRequest, parseJsonResponse } from "./setup";

vi.mock("../_utils/adminAuth", async () => {
  const actual = await vi.importActual("../_utils/adminAuth");
  return {
    ...actual,
    getAdminFromRequest: vi.fn(),
  };
});

vi.mock("../_utils/email", () => ({
  sendMailChannelsEmail: vi.fn(),
}));

import { getAdminFromRequest } from "../_utils/adminAuth";
import { sendMailChannelsEmail } from "../_utils/email";

describe("POST /api/admin/contacts", () => {
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  it("requires an authenticated admin", async () => {
    vi.mocked(getAdminFromRequest).mockResolvedValue(null);

    const request = createMockRequest("POST", "https://example.com/api/admin/contacts", {
      body: { contactId: 1, subject: "Re: Trial", message: "We can help." },
    });

    const response = await replyHandler({ request, env });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("rejects empty reply messages", async () => {
    vi.mocked(getAdminFromRequest).mockResolvedValue({
      adminUserId: 1,
      email: "admin@sunnahskills.com",
      name: "Admin",
      role: "admin",
    });

    const request = createMockRequest("POST", "https://example.com/api/admin/contacts", {
      body: { contactId: 1, subject: "Re: Trial", message: " " },
    });

    const response = await replyHandler({ request, env });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/message/i);
  });

  it("sends a reply email to the contact", async () => {
    vi.mocked(getAdminFromRequest).mockResolvedValue({
      adminUserId: 1,
      email: "admin@sunnahskills.com",
      name: "Admin",
      role: "admin",
    });
    vi.mocked(sendMailChannelsEmail).mockResolvedValue(true);

    const mockDb = env.DB as any;
    mockDb.setMockData("contacts", [
      {
        id: 7,
        name: "Sabiha Rehan",
        email: "sabyhan1@gmail.com",
        message: "I want to register for horseback riding",
        timestamp: "2026-04-14T01:28:01.493Z",
      },
    ]);

    const request = createMockRequest("POST", "https://example.com/api/admin/contacts", {
      body: {
        contactId: 7,
        subject: "Re: Horseback riding",
        message: "Assalamu alaykum. We will add you to the interest list.",
      },
    });

    const response = await replyHandler({ request, env });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendMailChannelsEmail).toHaveBeenCalledWith(
      env,
      expect.objectContaining({
        to: { email: "sabyhan1@gmail.com", name: "Sabiha Rehan" },
        from: { email: "test@sunnahskills.pages.dev", name: "Sunnah Skills" },
        replyTo: { email: "admin@sunnahskills.pages.dev", name: "Sunnah Skills" },
        subject: "Re: Horseback riding",
      }),
    );
  });
});
```

- [ ] **Step 2: Verify API test fails**

Run:

```bash
npm run test:functions -- functions/__tests__/admin-contacts-reply.test.ts
```

Expected: FAIL because `onRequestPost` is not exported from `functions/api/admin/contacts.ts`.

- [ ] **Step 3: Implement `onRequestPost`**

In `functions/api/admin/contacts.ts`, import `sendMailChannelsEmail`, extend `Env`, add helpers, and export `onRequestPost`:

```ts
import { getAdminFromRequest, hasAdminPermission } from "../../_utils/adminAuth";
import { sendMailChannelsEmail } from "../../_utils/email";

interface Env {
  DB: D1Database;
  EMAIL_FROM?: string;
  EMAIL_TO?: string;
  RESEND_API_KEY?: string;
  RESEND_API_URL?: string;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return char;
    }
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "contacts", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as
    | { contactId?: number; subject?: string; message?: string }
    | null;
  const contactId = Number(body?.contactId);
  const subject = body?.subject?.trim() || "Re: Sunnah Skills";
  const message = body?.message?.trim() || "";

  if (!Number.isInteger(contactId) || contactId <= 0) {
    return json({ error: "Valid contactId is required" }, { status: 400 });
  }
  if (message.length < 2) {
    return json({ error: "Reply message is required" }, { status: 400 });
  }

  const contact = await env.DB.prepare(`SELECT id, name, email, message FROM contacts WHERE id = ? LIMIT 1`)
    .bind(contactId)
    .first<{ id: number; name: string; email: string; message: string }>();
  if (!contact?.email) return json({ error: "Contact not found" }, { status: 404 });

  const sent = await sendMailChannelsEmail(env, {
    to: { email: String(contact.email), name: String(contact.name || "Sunnah Skills Parent") },
    from: { email: env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev", name: "Sunnah Skills" },
    replyTo: env.EMAIL_TO ? { email: env.EMAIL_TO, name: "Sunnah Skills" } : undefined,
    subject,
    text: message,
    html: `<p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
  });

  if (!sent) return json({ error: "Email could not be sent" }, { status: 502 });
  return json({ ok: true });
}
```

- [ ] **Step 4: Verify API test passes**

Run:

```bash
npm run test:functions -- functions/__tests__/admin-contacts-reply.test.ts
```

Expected: PASS.

## Task 2: Contact Reply UI

**Files:**
- Modify: `client/src/components/admin/ContactsTable.tsx`
- Modify: `client/src/__tests__/components/admin/ContactsTable.test.tsx`

- [ ] **Step 1: Write failing UI test**

Append this test to `client/src/__tests__/components/admin/ContactsTable.test.tsx`:

```tsx
it("lets an admin reply to a contact by email", async () => {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      return { ok: true, json: async () => ({ ok: true }) };
    }
    return {
      ok: true,
      json: async () => ({
        contacts: [
          {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            message: "I have a question about the BJJ program.",
            timestamp: "2026-03-15T10:00:00Z",
          },
        ],
      }),
    };
  });
  (globalThis as any).fetch = fetchMock;

  render(<ContactsTable />);

  fireEvent.click(await screen.findByRole("button", { name: /reply to john doe/i }));
  fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: "Re: BJJ program" } });
  fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "Assalamu alaykum. We can help with that." } });
  fireEvent.click(screen.getByRole("button", { name: /send reply/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/contacts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          contactId: 1,
          subject: "Re: BJJ program",
          message: "Assalamu alaykum. We can help with that.",
        }),
      }),
    );
  });
  expect(await screen.findByText(/reply sent/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify UI test fails**

Run:

```bash
npm test -- client/src/__tests__/components/admin/ContactsTable.test.tsx
```

Expected: FAIL because no reply button/form exists.

- [ ] **Step 3: Implement inline reply composer**

Update `ContactsTable` to track `replyingTo`, `subject`, `message`, `sending`, and `replyStatus`. Add an Actions column with a Reply button. When open, render labeled Subject and Message fields plus a Send Reply button. POST this JSON:

```ts
{
  contactId: replyingTo.id,
  subject,
  message
}
```

Show “Reply sent.” on success and “Reply could not be sent.” on failure.

- [ ] **Step 4: Verify UI test passes**

Run:

```bash
npm test -- client/src/__tests__/components/admin/ContactsTable.test.tsx
```

Expected: PASS.

## Task 3: Coach-Friendly Sequence Builder

**Files:**
- Modify: `client/src/pages/admin/AdminSequences.tsx`
- Modify: `client/src/__tests__/integration/admin-sequences.test.tsx`

- [ ] **Step 1: Write failing Sequence Builder tests**

Append tests to `client/src/__tests__/integration/admin-sequences.test.tsx`:

```tsx
it("offers coach-friendly start filters and plain-language route labels", async () => {
  const user = userEvent.setup();
  renderAdminSequencesAt();

  expect(await screen.findByText(/Coach filters/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /standing/i })).toBeInTheDocument();
  expect(screen.getAllByText(/next options/i).length).toBeGreaterThan(0);
  expect(screen.queryByText(/outgoing routes/i)).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /standing/i }));
  expect(screen.getByText(/Showing/i)).toBeInTheDocument();
});

it("shows a persistent sequence timeline while a coach builds a chain", async () => {
  const user = userEvent.setup();
  renderAdminSequencesAt();

  await user.type(await screen.findByPlaceholderText(/search starting positions/i), "staredown");
  await user.click(screen.getByRole("button", { name: /use this start/i }));

  expect(await screen.findByText(/Sequence timeline/i)).toBeInTheDocument();
  expect(screen.getByText(/1/)).toBeInTheDocument();
  expect(screen.getByText(/Staredown/i)).toBeInTheDocument();
  expect(screen.getByText(/Full sequence preview/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify Sequence Builder tests fail**

Run:

```bash
npm test -- client/src/__tests__/integration/admin-sequences.test.tsx
```

Expected: FAIL because filters/timeline/plain labels do not exist yet.

- [ ] **Step 3: Implement sequence builder improvements**

In `AdminSequences.tsx`:

1. Add `startGroupFilter` state.
2. Add coach filter options: All, Standing, Guard, Mount, Side Control, Back, Turtle, Half Guard.
3. Filter start positions by name/family/tags/props.
4. Change position subtitles from “outgoing/incoming” to “next options/can come from.”
5. Rename start action from “Start here” to “Use this start.”
6. Add a persistent `Sequence timeline` card below the workflow tabs when `sequenceMarkers.length > 0`.
7. Rename the preview label from “Live chain preview” to “Full sequence preview.”

- [ ] **Step 4: Verify Sequence Builder tests pass**

Run:

```bash
npm test -- client/src/__tests__/integration/admin-sequences.test.tsx
```

Expected: PASS.

## Task 4: Verification, Commit, Push

**Files:**
- All modified files above.

- [ ] **Step 1: Run focused checks**

Run:

```bash
npm run test:functions -- functions/__tests__/admin-contacts-reply.test.ts
npm test -- client/src/__tests__/components/admin/ContactsTable.test.tsx
npm test -- client/src/__tests__/integration/admin-sequences.test.tsx
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 2: Build**

Run:

```bash
npm run build
```

Expected: build completes successfully.

- [ ] **Step 3: Stage only implementation files**

Run:

```bash
git add docs/superpowers/plans/2026-04-17-admin-replies-sequence-builder.md \
  functions/api/admin/contacts.ts \
  functions/__tests__/admin-contacts-reply.test.ts \
  client/src/components/admin/ContactsTable.tsx \
  client/src/__tests__/components/admin/ContactsTable.test.tsx \
  client/src/pages/admin/AdminSequences.tsx \
  client/src/__tests__/integration/admin-sequences.test.tsx
```

- [ ] **Step 4: Commit to main**

Run:

```bash
git commit -m "feat(admin): add contact replies and coach sequence builder"
```

- [ ] **Step 5: Push main to production**

Run:

```bash
git push origin main
```

Expected: push succeeds and Cloudflare production deploy starts from `main`.

## Self-Review

- Spec coverage: admin email replies are covered by Tasks 1-2; admin-only Sequence Builder improvements are covered by Task 3; public website and public technique library are intentionally untouched.
- Placeholder scan: no `TBD`, `TODO`, or “implement later” placeholders remain.
- Type consistency: contact reply payload uses `contactId`, `subject`, and `message` consistently across API, UI, and tests.
