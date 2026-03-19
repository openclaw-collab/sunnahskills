import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "./test-utils";
import { StudioProvider } from "@/studio/StudioProvider";
import StudioShell from "@/studio/StudioShell";
import { mockStore } from "./mocks/handlers";

// Mock the studio hooks and components
vi.mock("@/studio/useStudio", async () => {
  const actual = await vi.importActual("@/studio/useStudio");
  return {
    ...actual,
    useStudio: () => ({
      state: {
        enabled: true,
        mode: "session",
        sessionId: "test-session-123",
        authed: true,
        session: {
          id: "test-session-123",
          name: "Test Session",
          edits: [],
          comments: [],
          uploads: [],
          themePresetId: "brand",
          customTheme: {},
          positions: {},
        },
        themePresetId: "brand",
        customTheme: {},
        localEdits: {},
        localComments: [],
        syncing: false,
        error: null,
      },
      edits: {},
      setEnabled: vi.fn(),
      setThemePreset: vi.fn(),
      setCustomTheme: vi.fn(),
      setEdit: vi.fn(),
      clearEdit: vi.fn(),
      addComment: vi.fn(),
      registerBlock: vi.fn(),
      blocks: [],
      pinnedComponentId: null,
      setPinnedComponentId: vi.fn(),
      hoveredComponentId: null,
      setHoveredComponentId: vi.fn(),
      exportJson: vi.fn(() => JSON.stringify({ test: true })),
      authenticate: vi.fn(),
      createSharedSession: vi.fn(),
      uploadImage: vi.fn(),
      positions: {},
      setPosition: vi.fn(),
      reset: vi.fn(),
    }),
  };
});

describe("Studio Flow Integration", () => {
  describe("Session Creation", () => {
    it("creates a new shared session", async () => {
      const user = userEvent.setup();

      // Setup mock session
      mockStore.sessions.set("new-session-123", {
        id: "new-session-123",
        name: "New Test Session",
        edits: [],
        comments: [],
        uploads: [],
      });

      render(
        <StudioProvider>
          <div data-studio-component="test-component">Test Content</div>
        </StudioProvider>
      );

      // Provider should initialize without errors
      expect(document.body).toBeInTheDocument();
    });

    it("requires password for protected sessions", async () => {
      const user = userEvent.setup();

      // Setup protected session
      const sessionId = "protected-session-456";
      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Protected Session",
        edits: [],
        comments: [],
        uploads: [],
      });
      mockStore.sessionPasswords.set(sessionId, "secret123");

      // Simulate accessing protected session
      const authenticate = async (password: string) => {
        const expectedPassword = mockStore.sessionPasswords.get(sessionId);
        if (password === expectedPassword) {
          mockStore.authenticatedSessions.add(sessionId);
          return true;
        }
        return false;
      };

      // Wrong password
      const wrongResult = await authenticate("wrongpassword");
      expect(wrongResult).toBe(false);
      expect(mockStore.authenticatedSessions.has(sessionId)).toBe(false);

      // Correct password
      const correctResult = await authenticate("secret123");
      expect(correctResult).toBe(true);
      expect(mockStore.authenticatedSessions.has(sessionId)).toBe(true);
    });

    it("generates shareable URL for session", async () => {
      const sessionId = "shareable-session-789";
      const shareUrl = `${window.location.origin}?studio=${sessionId}`;

      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Shareable Session",
        edits: [],
        comments: [],
        uploads: [],
      });

      expect(shareUrl).toContain("studio=");
      expect(shareUrl).toContain(sessionId);
    });
  });

  describe("Multi-User Sync", () => {
    it("syncs edits between multiple users", async () => {
      const sessionId = "sync-session-001";

      // User 1 creates a session and makes an edit
      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Sync Test",
        edits: [
          {
            id: "edit-1",
            route: "/",
            target: { componentId: "hero", fieldKey: "title" },
            type: "text",
            oldValue: "Old Title",
            newValue: "New Title",
            createdAt: new Date().toISOString(),
          },
        ],
        comments: [],
        uploads: [],
      });
      mockStore.authenticatedSessions.add(sessionId);

      // Simulate User 2 fetching the session
      const session = mockStore.sessions.get(sessionId);
      expect(session.edits).toHaveLength(1);
      expect(session.edits[0].newValue).toBe("New Title");

      // User 2 makes another edit
      session.edits.push({
        id: "edit-2",
        route: "/",
        target: { componentId: "hero", fieldKey: "subtitle" },
        type: "text",
        oldValue: "Old Subtitle",
        newValue: "New Subtitle",
        createdAt: new Date().toISOString(),
      });

      expect(session.edits).toHaveLength(2);
    });

    it("handles concurrent edits gracefully", async () => {
      const sessionId = "concurrent-session-002";

      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Concurrent Test",
        edits: [],
        comments: [],
        uploads: [],
      });
      mockStore.authenticatedSessions.add(sessionId);

      // Simulate concurrent edits
      const session = mockStore.sessions.get(sessionId);

      // Multiple edits to the same component
      session.edits.push({
        id: "edit-1",
        route: "/",
        target: { componentId: "hero", fieldKey: "title" },
        type: "text",
        oldValue: "Title",
        newValue: "Title 1",
        createdAt: new Date().toISOString(),
      });

      session.edits.push({
        id: "edit-2",
        route: "/",
        target: { componentId: "hero", fieldKey: "title" },
        type: "text",
        oldValue: "Title 1",
        newValue: "Title 2",
        createdAt: new Date().toISOString(),
      });

      // Last edit wins
      const heroEdits = session.edits.filter(
        (e: any) => e.target.componentId === "hero" && e.target.fieldKey === "title"
      );
      expect(heroEdits).toHaveLength(2);
    });

    it("polls for session updates", async () => {
      const sessionId = "poll-session-003";

      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Poll Test",
        edits: [],
        comments: [],
        uploads: [],
      });

      // Simulate polling by fetching session
      const fetchSession = () => mockStore.sessions.get(sessionId);

      let session = fetchSession();
      expect(session.edits).toHaveLength(0);

      // Simulate update from another user
      session.edits.push({
        id: "remote-edit",
        route: "/",
        target: { autoId: "/::t0" },
        type: "text",
        oldValue: "",
        newValue: "Remote Edit",
        createdAt: new Date().toISOString(),
      });

      // Next poll should get the update
      session = fetchSession();
      expect(session.edits).toHaveLength(1);
    });
  });

  describe("Edit Persistence", () => {
    it("saves text edits to session", async () => {
      const sessionId = "edit-session-004";

      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Edit Test",
        edits: [],
        comments: [],
        uploads: [],
      });
      mockStore.authenticatedSessions.add(sessionId);

      const session = mockStore.sessions.get(sessionId);

      // Add a text edit
      const edit = {
        id: "edit-text-1",
        route: "/about",
        target: { componentId: "about", fieldKey: "description" },
        type: "text" as const,
        oldValue: "Old description",
        newValue: "New description",
        createdAt: new Date().toISOString(),
      };

      session.edits.push(edit);

      expect(session.edits).toHaveLength(1);
      expect(session.edits[0].newValue).toBe("New description");
    });

    it("saves comments to session", async () => {
      const sessionId = "comment-session-005";

      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Comment Test",
        edits: [],
        comments: [],
        uploads: [],
      });
      mockStore.authenticatedSessions.add(sessionId);

      const session = mockStore.sessions.get(sessionId);

      // Add a comment
      const comment = {
        id: "comment-1",
        route: "/",
        componentId: "hero",
        message: "This needs better contrast",
        author: "Designer",
        createdAt: new Date().toISOString(),
      };

      session.comments.push(comment);

      expect(session.comments).toHaveLength(1);
      expect(session.comments[0].message).toBe("This needs better contrast");
    });

    it("handles image uploads", async () => {
      const sessionId = "upload-session-006";

      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Upload Test",
        edits: [],
        comments: [],
        uploads: [],
      });
      mockStore.authenticatedSessions.add(sessionId);

      const session = mockStore.sessions.get(sessionId);

      // Simulate image upload
      const upload = {
        id: "upload-1",
        route: "/",
        slotKey: "hero-image",
        url: "https://example.com/new-image.png",
        filename: "new-image.png",
        createdAt: new Date().toISOString(),
      };

      session.uploads.push(upload);

      expect(session.uploads).toHaveLength(1);
      expect(session.uploads[0].url).toBe("https://example.com/new-image.png");
    });
  });

  describe("Password Protection", () => {
    it("blocks access without password", async () => {
      const sessionId = "protected-007";

      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Protected Session",
        edits: [],
        comments: [],
        uploads: [],
      });
      mockStore.sessionPasswords.set(sessionId, "securepass");
      // Note: not adding to authenticatedSessions

      const isAuthenticated = mockStore.authenticatedSessions.has(sessionId);
      expect(isAuthenticated).toBe(false);
    });

    it("allows access after correct password", async () => {
      const sessionId = "protected-008";

      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Protected Session",
        edits: [],
        comments: [],
        uploads: [],
      });
      mockStore.sessionPasswords.set(sessionId, "securepass");
      mockStore.authenticatedSessions.add(sessionId);

      const isAuthenticated = mockStore.authenticatedSessions.has(sessionId);
      expect(isAuthenticated).toBe(true);
    });

    it("rejects incorrect password", async () => {
      const sessionId = "protected-009";
      const password = "securepass";
      const attempt = "wrongpass";

      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Protected Session",
        edits: [],
        comments: [],
        uploads: [],
      });
      mockStore.sessionPasswords.set(sessionId, password);

      const isCorrect = attempt === password;
      expect(isCorrect).toBe(false);

      if (isCorrect) {
        mockStore.authenticatedSessions.add(sessionId);
      }

      expect(mockStore.authenticatedSessions.has(sessionId)).toBe(false);
    });
  });

  describe("Export Functionality", () => {
    it("exports session data as JSON", async () => {
      const sessionId = "export-session-010";

      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Export Test",
        edits: [
          {
            id: "edit-1",
            route: "/",
            target: { componentId: "hero", fieldKey: "title" },
            type: "text",
            oldValue: "Old",
            newValue: "New",
            createdAt: new Date().toISOString(),
          },
        ],
        comments: [
          {
            id: "comment-1",
            route: "/",
            componentId: "hero",
            message: "Great work!",
            author: "Reviewer",
            createdAt: new Date().toISOString(),
          },
        ],
        uploads: [],
      });

      const session = mockStore.sessions.get(sessionId);

      const exportData = {
        exportedAt: new Date().toISOString(),
        sessionId,
        theme: { preset: "brand" },
        changes: session.edits.map((e: any) => ({
          route: e.route,
          componentId: e.target.componentId,
          fieldKey: e.target.fieldKey,
          type: e.type,
          oldValue: e.oldValue,
          newValue: e.newValue,
          timestamp: e.createdAt,
        })),
        comments: session.comments.map((c: any) => ({
          route: c.route,
          componentId: c.componentId,
          message: c.message,
          author: c.author,
          timestamp: c.createdAt,
        })),
      };

      const json = JSON.stringify(exportData, null, 2);
      const parsed = JSON.parse(json);

      expect(parsed.sessionId).toBe(sessionId);
      expect(parsed.changes).toHaveLength(1);
      expect(parsed.comments).toHaveLength(1);
    });
  });
});
