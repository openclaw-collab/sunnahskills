import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { Router } from "wouter";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../test-utils";
import About from "@/pages/About";
import Programs from "@/pages/Programs";
import Schedule from "@/pages/Schedule";
import RegistrationHub from "@/pages/RegistrationHub";
import BJJProgram from "@/pages/programs/BJJProgram";
import SwimmingProgram from "@/pages/programs/SwimmingProgram";
import HorsebackProgram from "@/pages/programs/HorsebackProgram";
import ArcheryProgram from "@/pages/programs/ArcheryProgram";
import OutdoorWorkshopsProgram from "@/pages/programs/OutdoorWorkshopsProgram";
import BullyproofingProgram from "@/pages/programs/BullyproofingProgram";

vi.mock("@/components/grapplemap/TechniqueViewer", () => ({
  TechniqueViewer: () => <div data-testid="mock-technique-viewer">Technique Viewer</div>,
}));

vi.mock("@/components/programs/ProgramVisual", () => ({
  ProgramVisual: ({ slug }: { slug: string }) => <div data-testid={`mock-program-visual-${slug}`}>{slug}</div>,
}));

function renderAt(path: string, ui: React.ReactElement) {
  window.history.pushState({}, "", path);

  function useMemoryLocation() {
    const [loc, setLoc] = useState(path);
    return [loc, setLoc] as [string, React.Dispatch<React.SetStateAction<string>>];
  }

  return render(<Router hook={useMemoryLocation}>{ui}</Router>);
}

describe("Public page integration surfaces", () => {
  it("renders the about page milestones and values", async () => {
    renderAt("/about", <About />);

    expect(await screen.findByText("The Founding Vision")).toBeInTheDocument();
    expect(screen.getByText("Show Up Consistently")).toBeInTheDocument();
    expect(screen.getByText("Safety First")).toBeInTheDocument();
  });

  it("renders the programs index with live enrollment messaging", async () => {
    renderAt("/programs", <Programs />);

    expect(await screen.findByText("Choose the Right Fit")).toBeInTheDocument();
    expect(screen.getByTestId("program-card-bjj")).toBeInTheDocument();
    expect(screen.getByTestId("program-card-swimming")).toBeInTheDocument();
    expect(screen.getByTestId("program-card-horseback")).toBeInTheDocument();
    expect(screen.getByTestId("program-card-archery")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open your family & member account/i })).toBeInTheDocument();
  });

  it("renders the schedule page with summary tracks and weekly calendar", async () => {
    renderAt("/schedule", <Schedule />);

    expect((await screen.findAllByText(/women 11\+/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/girls 5–10/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("schedule-weekly-view")).toBeInTheDocument();
  });

  it("renders the registration hub account-opening flow", async () => {
    renderAt("/register", <RegistrationHub />);

    expect(await screen.findByText(/open your account before you register/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /email me the sign-in link/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /create your account/i })).toBeInTheDocument();
  });

  it("renders the bjj program page with live cohort details", async () => {
    renderAt("/programs/bjj", <BJJProgram />);

    expect(await screen.findByText("Brazilian Jiu-Jitsu")).toBeInTheDocument();
    expect(screen.getByText(/weekly classes at 918 dundas st west/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Technique Over Strength" })).toBeInTheDocument();
  });

  it("renders the archery program page with session windows", async () => {
    renderAt("/programs/archery", <ArcheryProgram />);

    expect(await screen.findByText("Traditional Archery")).toBeInTheDocument();
    expect(screen.getByText(/session windows/i)).toBeInTheDocument();
    expect(screen.getByText(/safety comes first/i)).toBeInTheDocument();
  });

  it("renders the swimming and horseback coming soon pages", async () => {
    const swimming = renderAt("/programs/swimming", <SwimmingProgram />);
    expect(await screen.findByRole("heading", { name: /swimming/i })).toBeInTheDocument();
    expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /join waitlist/i }).length).toBeGreaterThan(0);
    swimming.unmount();

    renderAt("/programs/horseback", <HorsebackProgram />);
    expect(await screen.findByRole("heading", { name: /horseback riding/i })).toBeInTheDocument();
    expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /join waitlist/i }).length).toBeGreaterThan(0);
  });

  it("renders the outdoor program page with expedition structure", async () => {
    renderAt("/programs/outdoor", <OutdoorWorkshopsProgram />);

    expect(await screen.findByRole("heading", { name: "Outdoor Workshops" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Practical Outdoor Skills" })).toBeInTheDocument();
    expect(screen.getByText(/Field Notes/i)).toBeInTheDocument();
  });

  it("renders the bullyproofing program page with confidence track details", async () => {
    renderAt("/programs/bullyproofing", <BullyproofingProgram />);

    expect(await screen.findByRole("heading", { name: "Bullyproofing Workshops" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Confidence Without Aggression" })).toBeInTheDocument();
    expect(screen.getByText(/Share concerns. Choose the right series. Enroll\./i)).toBeInTheDocument();
  });

  it("opens the waitlist dialog from the programs page", async () => {
    const user = userEvent.setup();
    renderAt("/programs", <Programs />);

    const waitlistButtons = await screen.findAllByRole("button", { name: /join waitlist/i });
    await user.click(waitlistButtons[0]);

    expect(await screen.findByRole("heading", { name: /join the waitlist/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your full name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });
});
