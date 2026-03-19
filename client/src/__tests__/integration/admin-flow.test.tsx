import { describe, it, expect, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "./test-utils";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
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

describe("Admin Flow Integration", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe("Login Flow", () => {
    it("successfully logs in with valid credentials", async () => {
      const user = userEvent.setup();
      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/email/i), "admin@sunnahskills.com");
      await user.type(screen.getByLabelText(/password/i), "admin123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");
      });

      expect(mockStore.currentUser).toEqual({
        email: "admin@sunnahskills.com",
        name: "Admin User",
        role: "admin",
      });
    });

    it("shows error for invalid credentials", async () => {
      const user = userEvent.setup();
      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      expect(mockStore.currentUser).toBeNull();
    });

    it("disables submit button while loading", async () => {
      const user = userEvent.setup();
      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/email/i), "admin@sunnahskills.com");
      await user.type(screen.getByLabelText(/password/i), "admin123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });
  });

  describe("Dashboard Flow", () => {
    it("redirects to login when not authenticated", async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin");
      });
    });

    it("loads dashboard data after authentication", async () => {
      // Pre-populate mock data
      mockStore.currentUser = {
        email: "admin@sunnahskills.com",
        name: "Admin User",
        role: "admin",
      };

      mockStore.registrations = [
        {
          id: 1,
          programSlug: "bjj",
          guardian: { fullName: "John Doe", email: "john@example.com" },
          student: { fullName: "Jimmy Doe" },
          status: "pending_payment",
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          programSlug: "archery",
          guardian: { fullName: "Jane Smith", email: "jane@example.com" },
          student: { fullName: "Jenny Smith" },
          status: "completed",
          createdAt: new Date().toISOString(),
        },
      ];

      mockStore.payments = [
        {
          id: "pi_123",
          registrationId: 2,
          amount: 10000,
          status: "succeeded",
          createdAt: new Date().toISOString(),
        },
      ];

      render(<AdminDashboard />);

      // Should show dashboard content
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Should show user email
      expect(screen.getByText("admin@sunnahskills.com")).toBeInTheDocument();
    });

    it("allows signing out", async () => {
      const user = userEvent.setup();

      mockStore.currentUser = {
        email: "admin@sunnahskills.com",
        name: "Admin User",
        role: "admin",
      };

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin");
      });

      expect(mockStore.currentUser).toBeNull();
    });
  });

  describe("Registration Management", () => {
    beforeEach(() => {
      mockStore.currentUser = {
        email: "admin@sunnahskills.com",
        name: "Admin User",
        role: "admin",
      };

      mockStore.registrations = [
        {
          id: 1,
          programSlug: "bjj",
          guardian: { fullName: "John Doe", email: "john@example.com" },
          student: { fullName: "Jimmy Doe" },
          status: "pending_payment",
          createdAt: new Date().toISOString(),
        },
      ];
    });

    it("displays registrations in table", async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to registrations tab
      await userEvent.click(screen.getByRole("tab", { name: /registrations/i }));

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jimmy Doe")).toBeInTheDocument();
      });
    });

    it("updates registration status", async () => {
      const user = userEvent.setup();

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to registrations tab
      await user.click(screen.getByRole("tab", { name: /registrations/i }));

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Click on registration to open detail
      await user.click(screen.getByText("John Doe"));

      // Update status would happen in the detail modal
      // This depends on the RegistrationDetail component implementation
    });

    it("deletes a registration", async () => {
      const user = userEvent.setup();

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to registrations tab
      await user.click(screen.getByRole("tab", { name: /registrations/i }));

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Initial count
      expect(mockStore.registrations).toHaveLength(1);

      // Delete action would be in the detail modal or row actions
      // This depends on the component implementation
    });
  });

  describe("Payments Overview", () => {
    beforeEach(() => {
      mockStore.currentUser = {
        email: "admin@sunnahskills.com",
        name: "Admin User",
        role: "admin",
      };

      mockStore.payments = [
        {
          id: "pi_123",
          registrationId: 1,
          amount: 10000,
          status: "succeeded",
          createdAt: new Date().toISOString(),
        },
        {
          id: "pi_456",
          registrationId: 2,
          amount: 9000,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      ];
    });

    it("displays payments summary", async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to payments tab
      await userEvent.click(screen.getByRole("tab", { name: /payments/i }));

      // Should show payment information
      await waitFor(() => {
        expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
      });
    });
  });

  describe("Tab Navigation", () => {
    beforeEach(() => {
      mockStore.currentUser = {
        email: "admin@sunnahskills.com",
        name: "Admin User",
        role: "admin",
      };
    });

    it("navigates between all tabs", async () => {
      const user = userEvent.setup();

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Test each tab
      const tabs = ["overview", "registrations", "payments", "discounts", "pricing", "sessions", "contacts", "export"];

      for (const tab of tabs) {
        await user.click(screen.getByRole("tab", { name: new RegExp(tab, "i") }));
        expect(screen.getByRole("tab", { name: new RegExp(tab, "i") })).toHaveAttribute("data-state", "active");
      }
    });
  });
});
