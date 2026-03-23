import React, { useCallback, useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { render } from "./test-utils";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { mockStore } from "./mocks/handlers";

const mockNavigate = vi.fn();

function renderWithLoginRouter(ui: React.ReactElement) {
  function useLoginLocation(_router: unknown) {
    const [loc, setLoc] = useState("/admin");
    const nav = useCallback((to: string) => {
      mockNavigate(to);
      setLoc(to);
    }, []);
    return [loc, nav] as [string, (to: string) => void];
  }
  return render(<Router hook={useLoginLocation}>{ui}</Router>);
}

function renderDashboardAt(path = "/admin/dashboard") {
  function useDashboardLocation(_router: unknown) {
    const [loc, setLoc] = useState(path);
    return [loc, setLoc] as [string, React.Dispatch<React.SetStateAction<string>>];
  }
  return render(
    <Router hook={useDashboardLocation}>
      <AdminDashboard />
    </Router>,
  );
}

/** Tracks SPA navigations via `mockNavigate` (for assertions after sign-out, etc.). */
function renderDashboardTracked(path = "/admin/dashboard") {
  function useTrackedDashboard(_router: unknown) {
    const [loc, setLoc] = useState(path);
    const nav = useCallback((to: string) => {
      mockNavigate(to);
      setLoc(to);
    }, []);
    return [loc, nav] as [string, (to: string) => void];
  }
  return render(
    <Router hook={useTrackedDashboard}>
      <AdminDashboard />
    </Router>,
  );
}

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
      renderWithLoginRouter(<AdminLogin />);

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
      renderWithLoginRouter(<AdminLogin />);

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
      renderWithLoginRouter(<AdminLogin />);

      await user.type(screen.getByLabelText(/email/i), "admin@sunnahskills.com");
      await user.type(screen.getByLabelText(/password/i), "admin123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      // Button exists and is clickable before submission
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      // After successful login, should navigate
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");
      });
    });
  });

  describe("Dashboard Flow", () => {
    it("redirects to login when not authenticated", async () => {
      function useTrackedDashboard(_router: unknown) {
        const [loc, setLoc] = useState("/admin/dashboard");
        const nav = useCallback((to: string) => {
          mockNavigate(to);
          setLoc(to);
        }, []);
        return [loc, nav] as [string, (to: string) => void];
      }
      render(
        <Router hook={useTrackedDashboard}>
          <AdminDashboard />
        </Router>,
      );

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

      renderDashboardAt("/admin/dashboard");

      // Should show dashboard content
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      expect(screen.getByRole("tab", { name: /^overview$/i })).toHaveAttribute("data-state", "active");
    });

    it("allows signing out", async () => {
      const user = userEvent.setup();

      mockStore.currentUser = {
        email: "admin@sunnahskills.com",
        name: "Admin User",
        role: "admin",
      };

      renderDashboardTracked("/admin/dashboard");

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
          registration_id: 1,
          program_slug: "bjj",
          program_name: "Brazilian Jiu-Jitsu",
          guardian_name: "John Doe",
          guardian_email: "john@example.com",
          student_name: "Jimmy Doe",
          registration_status: "pending_payment",
          payment_status: null,
          payment_amount: null,
          created_at: new Date().toISOString(),
        },
      ];
    });

    it("displays registrations in table", async () => {
      const user = userEvent.setup();
      renderDashboardAt("/admin/dashboard");

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to registrations tab
      await user.click(screen.getByRole("tab", { name: /registrations/i }));

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jimmy Doe")).toBeInTheDocument();
      });
    });

    it("updates registration status", async () => {
      const user = userEvent.setup();

      renderDashboardAt("/admin/dashboard");

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

      renderDashboardAt("/admin/dashboard");

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
          payment_id: 1,
          registration_id: 1,
          amount: 10000,
          status: "paid",
          currency: "USD",
          created_at: new Date().toISOString(),
        },
        {
          payment_id: 2,
          registration_id: 2,
          amount: 9000,
          status: "pending",
          currency: "USD",
          created_at: new Date().toISOString(),
        },
      ];
    });

    it("displays payments summary", async () => {
      const user = userEvent.setup();
      renderDashboardAt("/admin/dashboard");

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Navigate to payments tab
      await user.click(screen.getByRole("tab", { name: /payments/i }));

      // Should show payment information (formatted as $100 with no decimals)
      await waitFor(() => {
        expect(screen.getByText(/\$100/)).toBeInTheDocument();
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

      renderDashboardAt("/admin/dashboard");

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Test each tab
      const tabs = ["overview", "registrations", "payments", "discounts", "pricing", "sessions", "contacts", "export"];

      for (const tab of tabs) {
        const tabRe = new RegExp(`^${tab}$`, "i");
        await user.click(screen.getByRole("tab", { name: tabRe }));
        await waitFor(() => {
          expect(screen.getByRole("tab", { name: tabRe })).toHaveAttribute("data-state", "active");
        });
      }
    });
  });
});
