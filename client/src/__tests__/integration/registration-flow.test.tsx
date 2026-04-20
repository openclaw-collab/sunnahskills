import React from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockLocalStorage } from "./test-utils";
import { ProgramRegistrationPage } from "@/pages/registration/ProgramRegistrationPage";
import ArcheryRegistration from "@/pages/registration/ArcheryRegistration";
import { mockStore } from "./mocks/handlers";

const mockNavigate = vi.fn();

// Mock wouter's useLocation
vi.mock("wouter", () => {
  const Link = ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>;
  return {
    Link,
    useLocation: () => ["/registration/bjj", mockNavigate],
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
  const fullName = await screen.findByLabelText("Full name", {}, { timeout: 10000 });
  const email = screen.getByLabelText("Email");
  const phone = screen.getByLabelText("Phone");
  const emergencyName = screen.getByLabelText("Emergency contact name");
  const emergencyPhone = screen.getByLabelText("Emergency contact phone");

  fireEvent.change(fullName, { target: { value: "John Doe" } });
  fireEvent.change(email, { target: { value: "john@example.com" } });
  fireEvent.change(phone, { target: { value: "555-123-4567" } });
  fireEvent.change(emergencyName, { target: { value: "Jane Doe" } });
  fireEvent.change(emergencyPhone, { target: { value: "555-987-6543" } });
  const relationshipSelect = screen.getByRole("combobox");
  await user.selectOptions(relationshipSelect, "mother");
}

describe("Registration Flow Integration", () => {
  beforeEach(() => {
    // Mock localStorage to prevent StorageEvent jsdom crash when hook saves drafts
    mockLocalStorage({});
    mockNavigate.mockClear();
    mockStore.currentGuardian = {
      authenticated: true,
      email: "",
      accountNumber: "ACC-1001",
      fullName: null,
      phone: null,
    };
  });

  it("completes full multi-step registration flow", async () => {
    const user = userEvent.setup();
    render(<ProgramRegistrationPage slug="bjj" />);

    // Step 1: Guardian Info — wizard shows "Step 1 / 5: Guardian"
    expect(await screen.findByText(/step 1/i)).toBeInTheDocument();

    await fillGuardianStep(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 2: Student Info
    await waitFor(() => {
      expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Student's full name")).toBeInTheDocument();
    }, { timeout: 1000 });

    fireEvent.change(screen.getByPlaceholderText("Student's full name"), { target: { value: "Jimmy Doe" } });
    fireEvent.change(screen.getByPlaceholderText("What should we call them?"), { target: { value: "Jim" } });
    fireEvent.change(screen.getByPlaceholderText("YYYY-MM-DD"), { target: { value: "2015-01-01" } });

    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 3: Program Details — BJJ track + session + trial
    await waitFor(() => {
      expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.click(await screen.findByLabelText(/Boys 7–13/i));
    const sessionSelect = await screen.findByLabelText(/pick your session/i);
    await user.selectOptions(sessionSelect, "1");
    await user.click(await screen.findByLabelText(/No, enrol directly/i));

    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 4: Waivers
    await waitFor(() => {
      expect(screen.getByText(/step 4/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.click(await screen.findByRole("checkbox", { name: /liability waiver/i }));
    await user.click(await screen.findByRole("checkbox", { name: /photo/i }));
    await user.click(await screen.findByRole("checkbox", { name: /medical/i }));
    await user.click(await screen.findByRole("checkbox", { name: /terms/i }));
    fireEvent.change(screen.getByLabelText(/typed legal signature/i), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByLabelText(/^date$/i), { target: { value: "2026-03-18" } });

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

  it("allows continuing without optional media consent", async () => {
    const user = userEvent.setup();
    render(<ProgramRegistrationPage slug="bjj" />);

    expect(await screen.findByText(/step 1/i)).toBeInTheDocument();

    await fillGuardianStep(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Student's full name")).toBeInTheDocument();
    }, { timeout: 1000 });

    fireEvent.change(screen.getByPlaceholderText("Student's full name"), { target: { value: "Jimmy Doe" } });
    fireEvent.change(screen.getByPlaceholderText("What should we call them?"), { target: { value: "Jim" } });
    fireEvent.change(screen.getByPlaceholderText("YYYY-MM-DD"), { target: { value: "2015-01-01" } });

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.click(await screen.findByLabelText(/Boys 7–13/i));
    const sessionSelect = await screen.findByLabelText(/pick your session/i);
    await user.selectOptions(sessionSelect, "1");
    await user.click(await screen.findByLabelText(/No, enrol directly/i));

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/step 4/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.click(await screen.findByRole("checkbox", { name: /liability waiver/i }));
    await user.click(await screen.findByRole("checkbox", { name: /medical/i }));
    await user.click(await screen.findByRole("checkbox", { name: /terms/i }));
    fireEvent.change(screen.getByLabelText(/typed legal signature/i), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByLabelText(/^date$/i), { target: { value: "2026-03-18" } });

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockStore.registrations).toHaveLength(1);
    });
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

    const { unmount } = render(<ProgramRegistrationPage slug="bjj" />);

    // Fill out guardian info
    fireEvent.change(await screen.findByLabelText("Full name"), { target: { value: "Sarah Smith" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sarah@example.com" } });

    // Unmount component (simulate navigation away)
    unmount();

    // Verify localStorage was called with draft data
    await waitFor(() => {
      const draftKey = Object.keys(localStorageData).find((k) => k.includes("bjj"));
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
        programSpecific: { bjjTrack: "", trialClass: "", notes: "" },
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
    expect(await screen.findByText(/step 1/i)).toBeInTheDocument();

    // Try to continue without filling required fields
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Guardian form fields should still be visible
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("handles waitlist scenario when program is full", async () => {
    const user = userEvent.setup();
    mockStore.shouldFailNextRequest = false;
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      if (url === "/api/register/cart") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, enrollmentOrderId: 1, registrationIds: [], summary: { waitlisted: true } }),
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

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Student's full name")).toBeInTheDocument();
    }, { timeout: 1000 });

    await user.type(screen.getByPlaceholderText("Student's full name"), "Student Name");
    await user.type(screen.getByPlaceholderText("What should we call them?"), "Student");
    await user.type(screen.getByPlaceholderText("YYYY-MM-DD"), "2015-01-01");

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.click(await screen.findByLabelText(/Boys 7–13/i));
    const sessionSelectWl = await screen.findByLabelText(/pick your session/i);
    await user.selectOptions(sessionSelectWl, "1");
    await user.click(await screen.findByLabelText(/No, enrol directly/i));

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/step 4/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.click(await screen.findByRole("checkbox", { name: /liability waiver/i }));
    await user.click(await screen.findByRole("checkbox", { name: /photo/i }));
    await user.click(await screen.findByRole("checkbox", { name: /medical/i }));
    await user.click(await screen.findByRole("checkbox", { name: /terms/i }));
    await user.type(screen.getByLabelText(/typed legal signature/i), "Test User");
    await user.type(screen.getByLabelText(/^date$/i), "2026-03-18");

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/registration\/waitlist\?pos=1&program=/));
    });

    global.fetch = originalFetch;
  });

  it("adds archery to the authenticated family cart with eye dominance", async () => {
    const user = userEvent.setup();
    const localStorageData: Record<string, string> = {};
    const storage = mockLocalStorage(localStorageData);
    mockStore.currentGuardian = {
      authenticated: true,
      email: "parent@example.com",
      accountNumber: "ACC-2001",
      fullName: "Parent Example",
      phone: "5551234567",
      emergencyContactName: "Emergency Adult",
      emergencyContactPhone: "5559876543",
      accountRole: "parent_guardian",
      accountComplete: true,
    };
    mockStore.guardianStudents = [
      {
        id: 7,
        participant_type: "child",
        full_name: "Amin Example",
        date_of_birth: "2014-05-01",
        gender: "male",
        medical_notes: "",
      },
    ];

    render(<ArcheryRegistration />);

    expect(await screen.findByText(/add archery to your account checkout/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /watch the eye-dominance video/i })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=zzotW5QE4gQ",
    );

    await user.click(screen.getByRole("button", { name: /right eye dominant/i }));
    await user.click(screen.getByRole("button", { name: /add archery to cart/i }));

    await waitFor(() => {
      expect(storage.setItem).toHaveBeenCalledWith("sunnah-family-cart-v2", expect.any(String));
    });
    const cartWrite = storage.setItem.mock.calls.find(([key]) => key === "sunnah-family-cart-v2");
    expect(cartWrite).toBeDefined();
    const stored = JSON.parse(String(cartWrite?.[1]));
    expect(stored.lines[0].programSlug).toBe("archery");
    expect(stored.lines[0].programDetails.programSpecific.eyeDominance).toBe("right");
  });
});
