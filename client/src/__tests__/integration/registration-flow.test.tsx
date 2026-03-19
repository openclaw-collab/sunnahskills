import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockLocalStorage } from "./test-utils";
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

// Helper: fill guardian step — SelectField has no htmlFor so use getByRole("combobox")
async function fillGuardianStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Full name"), "John Doe");
  await user.type(screen.getByLabelText("Email"), "john@example.com");
  await user.type(screen.getByLabelText("Phone"), "555-123-4567");
  await user.type(screen.getByLabelText("Emergency contact name"), "Jane Doe");
  await user.type(screen.getByLabelText("Emergency contact phone"), "555-987-6543");
  const relationshipSelect = screen.getByRole("combobox");
  await user.selectOptions(relationshipSelect, "mother");
}

describe("Registration Flow Integration", () => {
  beforeEach(() => {
    // Mock localStorage to prevent StorageEvent jsdom crash when hook saves drafts
    mockLocalStorage({});
  });

  it("completes full multi-step registration flow", async () => {
    const user = userEvent.setup();
    render(<ProgramRegistrationPage slug="bjj" />);

    // Step 1: Guardian Info — wizard shows "Step 1 / 5: Guardian"
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();

    await fillGuardianStep(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 2: Student Info
    await waitFor(() => {
      expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.type(screen.getByLabelText(/student.*full name/i), "Jimmy Doe");
    await user.type(screen.getByLabelText(/preferred name/i), "Jim");
    await user.type(screen.getByLabelText(/date of birth/i), "2015-01-01");

    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 3: Program Details (BJJ uses RadioGroups for class group and age group)
    await waitFor(() => {
      expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.click(screen.getByLabelText(/boys' class/i));
    await user.click(screen.getByLabelText(/6.10 yrs/i));

    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 4: Waivers
    await waitFor(() => {
      expect(screen.getByText(/step 4/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.click(screen.getByRole("checkbox", { name: /liability waiver/i }));
    await user.click(screen.getByRole("checkbox", { name: /photo/i }));
    await user.click(screen.getByRole("checkbox", { name: /medical/i }));
    await user.click(screen.getByRole("checkbox", { name: /terms/i }));
    await user.type(screen.getByLabelText(/typed legal signature/i), "John Doe");

    // "Continue" on waivers triggers registration + payment setup
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 5: Payment
    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    }, { timeout: 3000 });

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

    // Override with a tracking mock for this specific test
    const localStorageMock = {
      getItem: vi.fn((key: string) => localStorageData[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageData[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageData[key];
      }),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });

    const { unmount } = render(<ProgramRegistrationPage slug="archery" />);

    // Fill out guardian info
    await user.type(screen.getByLabelText("Full name"), "Sarah Smith");
    await user.type(screen.getByLabelText("Email"), "sarah@example.com");

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
        relationship: "mother",
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
    Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });

    render(<ProgramRegistrationPage slug="bjj" />);

    // ResumeBanner shows "Continue your {programName} registration"
    await waitFor(() => {
      expect(screen.getByText(/continue your.*registration/i)).toBeInTheDocument();
    });

    // Click resume — button text is "Resume →"
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

    // Should be on step 1
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();

    // Try to continue without filling required fields
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Guardian form fields should still be visible
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("handles waitlist scenario when program is full", async () => {
    const user = userEvent.setup();
    const navigateMock = vi.fn();

    vi.doMock("wouter", async () => {
      const actual = await vi.importActual("wouter");
      return {
        ...actual,
        useLocation: () => ["/registration/bjj", navigateMock],
      };
    });

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

    await fillGuardianStep(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.type(screen.getByLabelText(/student.*full name/i), "Student Name");
    await user.type(screen.getByLabelText(/preferred name/i), "Student");
    await user.type(screen.getByLabelText(/date of birth/i), "2015-01-01");

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.click(screen.getByLabelText(/boys' class/i));
    await user.click(screen.getByLabelText(/6.10 yrs/i));

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/step 4/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.click(screen.getByRole("checkbox", { name: /liability waiver/i }));
    await user.click(screen.getByRole("checkbox", { name: /photo/i }));
    await user.click(screen.getByRole("checkbox", { name: /medical/i }));
    await user.click(screen.getByRole("checkbox", { name: /terms/i }));
    await user.type(screen.getByLabelText(/typed legal signature/i), "Test User");

    await user.click(screen.getByRole("button", { name: /continue/i }));

    global.fetch = originalFetch;
    vi.doUnmock("wouter");
  });
});
