import React, { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockLocalStorage } from "./test-utils";
import Home from "@/pages/Home";
import Contact from "@/pages/Contact";
import Testimonials from "@/pages/Testimonials";
import TrialPage from "@/pages/TrialPage";
import RegistrationSuccess from "@/pages/registration/RegistrationSuccess";
import RegistrationCancel from "@/pages/registration/RegistrationCancel";
import RegistrationPending from "@/pages/registration/RegistrationPending";
import RegistrationWaitlist from "@/pages/registration/RegistrationWaitlist";
import ArcheryRegistration from "@/pages/registration/ArcheryRegistration";
import OutdoorRegistration from "@/pages/registration/OutdoorRegistration";
import BullyproofingRegistration from "@/pages/registration/BullyproofingRegistration";
import BJJRegistration from "@/pages/registration/BJJRegistration";
import { ProgramRegistrationPage } from "@/pages/registration/ProgramRegistrationPage";
import NotFound from "@/pages/not-found";
import { mockStore } from "./mocks/handlers";

vi.mock("@/components/grapplemap/TechniqueViewer", () => ({
  TechniqueViewer: () => <div data-testid="mock-technique-viewer">Technique Viewer</div>,
}));

vi.mock("@/components/programs/ProgramVisual", () => ({
  ProgramVisual: ({ slug }: { slug: string }) => <div data-testid={`mock-program-visual-${slug}`}>{slug}</div>,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

function renderAt(path: string, ui: React.ReactElement) {
  window.history.pushState({}, "", path);

  function useMemoryLocation() {
    const [loc, setLoc] = useState(path);
    return [loc, setLoc] as [string, React.Dispatch<React.SetStateAction<string>>];
  }

  return render(<Router hook={useMemoryLocation}>{ui}</Router>);
}

describe("Additional route surface coverage", () => {
  beforeEach(() => {
    mockLocalStorage({});
    mockStore.currentGuardian = {
      authenticated: true,
      email: "guardian@example.com",
      accountNumber: "ACC-1001",
      fullName: "Guardian Example",
      phone: "555-0100",
      accountComplete: true,
    };
    mockStore.guardianStudents = [];
  });

  it("renders the homepage hero and enrollment surfaces", async () => {
    renderAt("/", <Home />);

    expect(await screen.findByText("Built Through")).toBeInTheDocument();
    expect(screen.getByText("Discipline.")).toBeInTheDocument();
    expect(screen.getByText("This Week at Sunnah Skills")).toBeInTheDocument();
    expect(screen.getByText("Programs at a glance")).toBeInTheDocument();
    expect(screen.getByTestId("mock-technique-viewer")).toBeInTheDocument();
  });

  it("renders the contact page form and contact channels", async () => {
    renderAt("/contact", <Contact />);

    expect(await screen.findByRole("heading", { name: /get in touch/i })).toBeInTheDocument();
    expect(screen.getByText(/contact channels/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });

  it("renders the testimonials page call-to-action", async () => {
    renderAt("/testimonials", <Testimonials />);

    expect(await screen.findByRole("heading", { name: /what families say/i })).toBeInTheDocument();
    expect(screen.getByText(/ready to get started/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toBeInTheDocument();
  });

  it("validates the free trial form before submission", async () => {
    const user = userEvent.setup();
    renderAt("/trial", <TrialPage />);

    expect(await screen.findByRole("heading", { name: /start with one calm first class/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reserve free trial/i }));

    expect(await screen.findByText(/fill out all required fields to book your trial/i)).toBeInTheDocument();
    expect(screen.getAllByText(/enter a valid email address/i).length).toBeGreaterThan(0);
  });

  it("renders the success, cancel, pending, and waitlist registration states", async () => {
    const success = renderAt("/registration/success?rid=123", <RegistrationSuccess />);
    expect(await screen.findByRole("heading", { name: /you're enrolled/i })).toBeInTheDocument();
    expect(screen.getByText("#123")).toBeInTheDocument();
    success.unmount();

    const cancel = renderAt("/registration/cancel", <RegistrationCancel />);
    expect(await screen.findByRole("heading", { name: /payment cancelled/i })).toBeInTheDocument();
    cancel.unmount();

    const pending = renderAt("/registration/pending", <RegistrationPending />);
    expect(await screen.findByRole("heading", { name: /pending payment/i })).toBeInTheDocument();
    pending.unmount();

    renderAt("/registration/waitlist?pos=3&program=BJJ", <RegistrationWaitlist />);
    expect(await screen.findByRole("heading", { name: /you're on the waitlist/i })).toBeInTheDocument();
    expect(screen.getByText(/currently #/i)).toBeInTheDocument();
  });

  it("renders the live archery registration wrapper and keeps other closed programs on waitlist", async () => {
    const archery = renderAt("/programs/archery/register", <ArcheryRegistration />);
    expect(await screen.findByText(/archery registration/i)).toBeInTheDocument();
    expect(await screen.findByText(/finish your account setup first/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /join waitlist/i })).not.toBeInTheDocument();
    archery.unmount();

    const outdoor = renderAt("/programs/outdoor/register", <OutdoorRegistration />);
    expect(await screen.findByRole("heading", { name: /outdoor workshops/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join waitlist/i })).toBeInTheDocument();
    outdoor.unmount();

    renderAt("/programs/bullyproofing/register", <BullyproofingRegistration />);
    expect(await screen.findByRole("heading", { name: /bullyproofing workshops/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join waitlist/i })).toBeInTheDocument();
  });

  it("renders the BJJ registration sign-in gate for unauthenticated guardians", async () => {
    mockStore.currentGuardian = { authenticated: false };

    renderAt("/programs/bjj/register", <BJJRegistration />);

    expect(await screen.findByRole("heading", { name: /sign in before you register/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in to register/i })).toBeInTheDocument();
  });

  it("renders the registration waitlist for swimming and horseback while enrollment is closed", async () => {
    const swimming = renderAt("/programs/swimming/register", <ProgramRegistrationPage slug="swimming" />);
    expect(await screen.findByRole("heading", { name: /swimming/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join waitlist/i })).toBeInTheDocument();
    expect(screen.getByText(/online registration for this program isn't open yet/i)).toBeInTheDocument();
    swimming.unmount();

    renderAt("/programs/horseback/register", <ProgramRegistrationPage slug="horseback" />);
    expect(await screen.findByRole("heading", { name: /horseback riding/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join waitlist/i })).toBeInTheDocument();
  });

  it("renders the BJJ account-setup gate when no participant profiles exist yet", async () => {
    mockStore.currentGuardian = {
      authenticated: true,
      email: "guardian@example.com",
      accountNumber: "ACC-1001",
      fullName: "Guardian Example",
      phone: "555-0100",
      accountComplete: false,
    };
    mockStore.guardianStudents = [];

    renderAt("/programs/bjj/register", <BJJRegistration />);

    expect(await screen.findByRole("heading", { name: /finish your account setup first/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /finish account setup/i })).toBeInTheDocument();
  });

  it("shows location selection before BJJ tracks and filters Oakville schedule", async () => {
    const user = userEvent.setup();
    mockStore.currentGuardian = {
      authenticated: true,
      email: "guardian@example.com",
      accountNumber: "ACC-1001",
      fullName: "Guardian Example",
      phone: "555-0100",
      emergencyContactName: "Emergency Adult",
      emergencyContactPhone: "555-0199",
      accountRole: "parent_guardian",
      accountComplete: true,
    };
    mockStore.guardianStudents = [
      {
        id: 8,
        participant_type: "child",
        full_name: "Yusuf Example",
        date_of_birth: "2015-05-01",
        gender: "male",
        medical_notes: "",
      },
    ];

    renderAt("/programs/bjj/register", <BJJRegistration />);

    expect(await screen.findByText("Location")).toBeInTheDocument();
    expect(screen.getAllByText("Mississauga").length).toBeGreaterThan(0);
    await user.click(screen.getByText("Oakville, ON"));
    expect(await screen.findByText(/Showing classes for/i)).toBeInTheDocument();
    expect(screen.getByText(/Oakville · Tuesday 17:00-18:00/i)).toBeInTheDocument();
  });

  it("renders the not-found page recovery actions", async () => {
    renderAt("/missing", <NotFound />);

    expect(await screen.findByRole("heading", { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse programs/i })).toBeInTheDocument();
  });
});
