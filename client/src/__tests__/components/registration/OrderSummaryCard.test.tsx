import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/__tests__/test-utils";
import { OrderSummaryCard } from "@/components/registration/OrderSummaryCard";
import { PROGRAMS } from "@/lib/programConfig";

vi.mock("@/hooks/useProgramsCatalog", () => ({
  useProgramsCatalog: () => ({
    isLoading: false,
    data: {
      programs: [
        {
          slug: "bjj",
          active_semester: {
            classes_in_semester: 13,
            price_per_class_cents: 1200,
            registration_fee_cents: 0,
            later_payment_date: "2026-05-12",
            start_date: "2026-03-31",
            end_date: "2026-06-27",
          },
          prices: [
            {
              id: 1,
              age_group: "boys-7-13",
              amount: 1200,
              registration_fee: 0,
              frequency: "semester",
              metadata: null,
            },
          ],
        },
      ],
    },
  }),
}));

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
    expect(screen.getByText(/child sibling lines/)).toBeInTheDocument();
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

  it("shows the live-validation promo helper copy", () => {
    render(
      <OrderSummaryCard
        program={PROGRAMS.bjj}
        siblingCount={0}
        discountCode="PROMO20"
        onDiscountCodeChange={() => {}}
      />,
    );

    expect(screen.getByText(/validated by the live payment endpoint/i)).toBeInTheDocument();
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

  it("shows BJJ semester totals without per-class math", async () => {
    render(
      <OrderSummaryCard
        program={PROGRAMS.bjj}
        siblingCount={0}
        discountCode=""
        onDiscountCodeChange={() => {}}
        selectedPriceId={1}
        bjjLinePreview={{
          track: "boys-7-13",
          paymentChoice: "full",
          priceId: 1,
        }}
      />,
    );

    expect((await screen.findAllByText(/Semester tuition/i)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/classes\s*×/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/per class/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sessions\s*×/i)).not.toBeInTheDocument();
  });
});
