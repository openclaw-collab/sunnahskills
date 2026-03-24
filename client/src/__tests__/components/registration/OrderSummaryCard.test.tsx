import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/__tests__/test-utils";
import { OrderSummaryCard } from "@/components/registration/OrderSummaryCard";
import { PROGRAMS } from "@/lib/programConfig";

describe("OrderSummaryCard", () => {
  it("renders program name and fee label", () => {
    render(
      <OrderSummaryCard
        program={PROGRAMS.bjj}
        siblingCount={0}
        discountCode=""
        onDiscountCodeChange={() => {}}
      />,
    );

    expect(screen.getByText("Order Summary")).toBeInTheDocument();
    expect(screen.getByText("Brazilian Jiu-Jitsu")).toBeInTheDocument();
    expect(screen.getByText("Semester tuition")).toBeInTheDocument();
  });

  it("shows registration fee for BJJ program", () => {
    render(
      <OrderSummaryCard
        program={PROGRAMS.bjj}
        siblingCount={0}
        discountCode=""
        onDiscountCodeChange={() => {}}
      />,
    );

    expect(screen.getByText("Registration fee")).toBeInTheDocument();
    expect(screen.getByText("One-time")).toBeInTheDocument();
  });

  it("does not show registration fee for non-BJJ programs", () => {
    render(
      <OrderSummaryCard
        program={PROGRAMS.archery}
        siblingCount={0}
        discountCode=""
        onDiscountCodeChange={() => {}}
      />,
    );

    expect(screen.queryByText("Registration fee")).not.toBeInTheDocument();
  });

  it("shows sibling discount when siblings are registered", () => {
    render(
      <OrderSummaryCard
        program={PROGRAMS.bjj}
        siblingCount={1}
        discountCode=""
        onDiscountCodeChange={() => {}}
      />,
    );

    expect(screen.getByText("Sibling discount")).toBeInTheDocument();
    expect(screen.getByText(/1 sibling/)).toBeInTheDocument();
    expect(screen.getByText(/kids tracks/)).toBeInTheDocument();
  });

  it("shows plural form for multiple siblings", () => {
    render(
      <OrderSummaryCard
        program={PROGRAMS.bjj}
        siblingCount={2}
        discountCode=""
        onDiscountCodeChange={() => {}}
      />,
    );

    expect(screen.getByText(/2 siblings/)).toBeInTheDocument();
  });

  it("updates discount code on input change", () => {
    const handleChange = vi.fn();
    render(
      <OrderSummaryCard
        program={PROGRAMS.bjj}
        siblingCount={0}
        discountCode=""
        onDiscountCodeChange={handleChange}
      />,
    );

    const input = screen.getByPlaceholderText(/e\.g\. sibling10/i);
    fireEvent.change(input, { target: { value: "PROMO20" } });
    expect(handleChange).toHaveBeenCalledWith("PROMO20");
  });

  it("applies promo code when Apply button clicked", () => {
    const handleChange = vi.fn();
    render(
      <OrderSummaryCard
        program={PROGRAMS.bjj}
        siblingCount={0}
        discountCode="PROMO20"
        onDiscountCodeChange={handleChange}
      />,
    );

    const applyButton = screen.getByRole("button", { name: /apply/i });
    fireEvent.click(applyButton);

    expect(screen.getByText(/code applied/i)).toBeInTheDocument();
  });

  it("displays total section", () => {
    render(
      <OrderSummaryCard
        program={PROGRAMS.bjj}
        siblingCount={0}
        discountCode=""
        onDiscountCodeChange={() => {}}
      />,
    );

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText(/confirmed at checkout/i)).toBeInTheDocument();
  });

  it("displays disclaimer about server-side calculation", () => {
    render(
      <OrderSummaryCard
        program={PROGRAMS.bjj}
        siblingCount={0}
        discountCode=""
        onDiscountCodeChange={() => {}}
      />,
    );

    expect(screen.getByText(/final amounts are calculated server-side/i)).toBeInTheDocument();
  });
});
