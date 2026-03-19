import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "./test-utils";
import { ProgramRegistrationPage } from "@/pages/registration/ProgramRegistrationPage";
import { mockStore } from "./mocks/handlers";

// Mock wouter's useLocation
vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return {
    ...actual,
    useLocation: () => ["/registration/bjj", vi.fn()],
  };
});

// Mock Stripe Elements
vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  useStripe: () => ({
    confirmPayment: vi.fn().mockResolvedValue({ error: null }),
  }),
  useElements: () => ({}),
}));

describe("Registration Flow Integration", () => {
  it("completes full multi-step registration flow", async () => {
    const user = userEvent.setup();
    render(<ProgramRegistrationPage slug="bjj" />);

    // Step 1: Guardian Info
    expect(screen.getByText(/guardian information/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555-123-4567");
    await user.type(screen.getByLabelText(/emergency contact name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/emergency contact phone/i), "555-987-6543");
    await user.type(screen.getByLabelText(/relationship/i), "Parent");

    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 2: Student Info
    await waitFor(() => {
      expect(screen.getByText(/student information/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/student.*full name/i), "Jimmy Doe");
    await user.type(screen.getByLabelText(/preferred name/i), "Jim");
    await user.type(screen.getByLabelText(/date of birth/i), "2015-01-01");

    // Select gender
    const genderSelect = screen.getByRole("combobox", { name: /gender/i });
    await user.click(genderSelect);
    await user.click(screen.getByRole("option", { name: /male/i }));

    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 3: Program Details
    await waitFor(() => {
      expect(screen.getByText(/program details/i)).toBeInTheDocument();
    });

    // Select age group
    const ageGroupSelect = screen.getByRole("combobox", { name: /age group/i });
    await user.click(ageGroupSelect);
    await user.click(screen.getByRole("option", { name: /6-10/i }));

    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 4: Waivers
    await waitFor(() => {
      expect(screen.getByText(/waivers/i)).toBeInTheDocument();
    });

    // Check all waiver checkboxes
    const liabilityCheckbox = screen.getByLabelText(/liability waiver/i);
    const photoCheckbox = screen.getByLabelText(/photo consent/i);
    const medicalCheckbox = screen.getByLabelText(/medical consent/i);
    const termsCheckbox = screen.getByLabelText(/terms/i);

    await user.click(liabilityCheckbox);
    await user.click(photoCheckbox);
    await user.click(medicalCheckbox);
    await user.click(termsCheckbox);

    // Type signature
    await user.type(screen.getByLabelText(/signature/i), "John Doe");

    await user.click(screen.getByRole("button", { name: /continue to payment/i }));

    // Step 5: Payment
    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });

    // Verify registration was created
    await waitFor(() => {
      expect(mockStore.registrations).toHaveLength(1);
    });

    const registration = mockStore.registrations[0];
    expect(registration.guardian.fullName).toBe("John Doe");
    expect(registration.guardian.email).toBe("john@example.com");
    expect(registration.student.fullName).toBe("Jimmy Doe");
    expect(registration.programSlug).toBe("bjj");
  });

  it("persists draft data in localStorage", async () => {
    const user = userEvent.setup();
    const localStorageData: Record<string, string> = {};

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn((key: string) => localStorageData[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageData[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageData[key];
      }),
      clear: vi.fn(() => {
        Object.keys(localStorageData).forEach((key) => delete localStorageData[key]);
      }),
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    const { unmount } = render(<ProgramRegistrationPage slug="archery" />);

    // Fill out guardian info
    await user.type(screen.getByLabelText(/full name/i), "Sarah Smith");
    await user.type(screen.getByLabelText(/email/i), "sarah@example.com");

    // Unmount component (simulate navigation away)
    unmount();

    // Verify localStorage was called with draft data
    await waitFor(() => {
      const draftKey = Object.keys(localStorageData).find((k) => k.includes("archery"));
      expect(draftKey).toBeDefined();

      const draft = JSON.parse(localStorageData[draftKey!]);
      expect(draft.guardian.fullName).toBe("Sarah Smith");
      expect(draft.guardian.email).toBe("sarah@example.com");
    });
  });

  it("resumes from saved draft when returning", async () => {
    const user = userEvent.setup();
    const draftKey = "ss-reg-draft-bjj";
    const savedDraft = {
      programSlug: "bjj",
      guardian: {
        fullName: "Existing User",
        email: "existing@example.com",
        phone: "555-000-0000",
        emergencyContactName: "Contact",
        emergencyContactPhone: "555-111-1111",
        relationship: "Parent",
        notes: "",
      },
      student: {
        fullName: "",
        preferredName: "",
        dateOfBirth: "",
        age: null,
        gender: "",
        skillLevel: "",
        medicalNotes: "",
      },
      programDetails: {
        sessionId: null,
        priceId: null,
        siblingCount: 0,
        programSpecific: { gender: "", ageGroup: "", trialClass: "", notes: "" },
      },
      waivers: {
        liabilityWaiver: false,
        photoConsent: false,
        medicalConsent: false,
        termsAgreement: false,
        signatureText: "",
        signedAt: "",
      },
      payment: { discountCode: "" },
    };

    // Mock localStorage with saved draft
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === draftKey) return JSON.stringify(savedDraft);
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    render(<ProgramRegistrationPage slug="bjj" />);

    // Should show resume banner
    await waitFor(() => {
      expect(screen.getByText(/resume your registration/i)).toBeInTheDocument();
    });

    // Click resume
    await user.click(screen.getByRole("button", { name: /resume/i }));

    // Should have pre-filled data
    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("existing@example.com")).toBeInTheDocument();
    });
  });

  it("validates required fields before proceeding", async () => {
    const user = userEvent.setup();
    render(<ProgramRegistrationPage slug="bjj" />);

    // Try to continue without filling required fields
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Should still be on guardian step (validation should prevent proceeding)
    expect(screen.getByText(/guardian information/i)).toBeInTheDocument();
  });

  it("handles waitlist scenario when program is full", async () => {
    const user = userEvent.setup();
    const navigateMock = vi.fn();

    // Override the mock for this test
    vi.doMock("wouter", async () => {
      const actual = await vi.importActual("wouter");
      return {
        ...actual,
        useLocation: () => ["/registration/bjj", navigateMock],
      };
    });

    // Setup mock to return waitlist response
    mockStore.shouldFailNextRequest = false;
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      if (url === "/api/register") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ waitlisted: true, position: 5 }),
        });
      }
      return originalFetch(url, options);
    });

    render(<ProgramRegistrationPage slug="bjj" />);

    // Fill out all required fields quickly
    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555-123-4567");
    await user.type(screen.getByLabelText(/emergency contact name/i), "Contact");
    await user.type(screen.getByLabelText(/emergency contact phone/i), "555-987-6543");
    await user.type(screen.getByLabelText(/relationship/i), "Parent");

    // Navigate through steps
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/student information/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/student.*full name/i), "Student Name");
    await user.type(screen.getByLabelText(/preferred name/i), "Student");
    await user.type(screen.getByLabelText(/date of birth/i), "2015-01-01");

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/program details/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/waivers/i)).toBeInTheDocument();
    });

    // Check waivers
    await user.click(screen.getByLabelText(/liability waiver/i));
    await user.click(screen.getByLabelText(/photo consent/i));
    await user.click(screen.getByLabelText(/medical consent/i));
    await user.click(screen.getByLabelText(/terms/i));
    await user.type(screen.getByLabelText(/signature/i), "Test User");

    await user.click(screen.getByRole("button", { name: /continue to payment/i }));

    // Restore fetch
    global.fetch = originalFetch;
    vi.doUnmock("wouter");
  });
});
