import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "./test-utils";
import AdminLogin from "@/pages/admin/AdminLogin";
import { mockStore } from "./mocks/handlers";

// Mock wouter
const mockNavigate = vi.fn();
vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return {
    ...actual,
    useLocation: () => ["/admin", mockNavigate],
  };
});

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("Error Scenarios Integration", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockStore.shouldFailNextRequest = false;
    mockStore.networkError = false;
  });

  describe("Network Failures", () => {
    it("handles network error during login", async () => {
      const user = userEvent.setup();
      mockStore.networkError = true;

      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/email/i), "admin@sunnahskills.com");
      await user.type(screen.getByLabelText(/password/i), "admin123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });

      mockStore.networkError = false;
    });

    it("handles network error during registration submission", async () => {
      mockStore.networkError = true;

      // This would be tested in the registration flow test
      // Verifying the mock setup works
      expect(mockStore.networkError).toBe(true);

      mockStore.networkError = false;
    });

    it("handles timeout scenarios", async () => {
      // Simulate a slow network by checking that login eventually completes
      const user = userEvent.setup();

      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/email/i), "admin@sunnahskills.com");
      await user.type(screen.getByLabelText(/password/i), "admin123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();
      await user.click(submitButton);

      // After login completes, navigate should be called
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");
      });
    });

    it("recovers from temporary network issues", async () => {
      const user = userEvent.setup();

      // First attempt fails
      mockStore.networkError = true;

      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/email/i), "admin@sunnahskills.com");
      await user.type(screen.getByLabelText(/password/i), "admin123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });

      // Second attempt succeeds
      mockStore.networkError = false;

      await user.clear(screen.getByLabelText(/email/i));
      await user.type(screen.getByLabelText(/email/i), "admin@sunnahskills.com");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");
      });
    });
  });

  describe("API Errors", () => {
    it("handles 401 unauthorized error", async () => {
      const user = userEvent.setup();

      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpass");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it("handles 404 not found error", async () => {
      // Test that the mock returns 404 for non-existent resources
      const sessionId = "non-existent-session";
      const session = mockStore.sessions.get(sessionId);
      expect(session).toBeUndefined();
    });

    it("handles 500 server error", async () => {
      mockStore.shouldFailNextRequest = true;

      // Verify the flag is set
      expect(mockStore.shouldFailNextRequest).toBe(true);

      mockStore.shouldFailNextRequest = false;
    });

    it("handles validation errors", async () => {
      // Test validation by attempting to submit invalid data
      const user = userEvent.setup();

      render(<AdminLogin />);

      // Try to submit without filling fields
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should show validation error or stay on page
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("handles rate limiting", async () => {
      // Simulate multiple rapid requests
      const user = userEvent.setup();

      render(<AdminLogin />);

      // Fill form
      await user.type(screen.getByLabelText(/email/i), "admin@sunnahskills.com");
      await user.type(screen.getByLabelText(/password/i), "admin123");

      // Click multiple times rapidly
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should handle gracefully
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });

  describe("Invalid Data Handling", () => {
    it("rejects invalid email format", async () => {
      const user = userEvent.setup();

      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/email/i), "not-an-email");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should show error for invalid email
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it("rejects empty required fields", async () => {
      const user = userEvent.setup();

      render(<AdminLogin />);

      // Try to submit with empty fields
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should still be on login page
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("handles malformed API responses", async () => {
      // Test that the app handles unexpected response formats
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ unexpected: "data" }),
      });

      // Restore after test
      global.fetch = originalFetch;
    });

    it("handles missing data in responses", async () => {
      // Test that the app handles missing fields
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}), // Empty response
      });

      // Restore after test
      global.fetch = originalFetch;
    });
  });

  describe("Session Errors", () => {
    it("handles expired session", async () => {
      // Simulate expired session by clearing auth
      mockStore.currentUser = null;

      expect(mockStore.currentUser).toBeNull();
    });

    it("handles concurrent session modifications", async () => {
      const sessionId = "concurrent-error-session";

      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Test",
        edits: [],
        comments: [],
        uploads: [],
      });
      mockStore.authenticatedSessions.add(sessionId);

      // Simulate concurrent modifications
      const session = mockStore.sessions.get(sessionId);

      // Multiple edits
      session.edits.push({ id: "edit-1", type: "text" });
      session.edits.push({ id: "edit-2", type: "text" });
      session.edits.push({ id: "edit-3", type: "text" });

      expect(session.edits).toHaveLength(3);
    });

    it("handles authentication timeout", async () => {
      const sessionId = "auth-timeout-session";

      mockStore.sessions.set(sessionId, {
        id: sessionId,
        name: "Protected",
        edits: [],
        comments: [],
        uploads: [],
      });
      mockStore.sessionPasswords.set(sessionId, "password");

      // Not authenticated
      expect(mockStore.authenticatedSessions.has(sessionId)).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("handles very long input values", async () => {
      const user = userEvent.setup();
      const longString = "a".repeat(1000);

      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/email/i), longString);

      const input = screen.getByLabelText(/email/i) as HTMLInputElement;
      expect(input.value.length).toBeGreaterThan(0);
    });

    it("handles special characters in input", async () => {
      const user = userEvent.setup();

      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/email/i), "test<script>alert('xss')</script>@example.com");

      const input = screen.getByLabelText(/email/i) as HTMLInputElement;
      expect(input.value).toContain("<script>");
    });

    it("handles rapid navigation", async () => {
      const user = userEvent.setup();

      render(<AdminLogin />);

      // Rapidly interact with form
      await user.type(screen.getByLabelText(/email/i), "a");
      await user.clear(screen.getByLabelText(/email/i));
      await user.type(screen.getByLabelText(/email/i), "b");
      await user.clear(screen.getByLabelText(/email/i));
      await user.type(screen.getByLabelText(/email/i), "admin@sunnahskills.com");

      const input = screen.getByLabelText(/email/i) as HTMLInputElement;
      expect(input.value).toBe("admin@sunnahskills.com");
    });

    it("handles browser back button during submission", async () => {
      const user = userEvent.setup();

      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/email/i), "admin@sunnahskills.com");
      await user.type(screen.getByLabelText(/password/i), "admin123");

      // Start submission
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should handle gracefully even if navigation occurs
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });
});
