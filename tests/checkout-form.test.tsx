import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";

describe("confirmation avant Stripe", () => {
  it("laisse les consentements décochés et bloque le bouton", () => {
    render(<CheckoutForm />);
    const boxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(boxes.every((box) => !box.checked)).toBe(true);
    expect(screen.getByRole("button", { name: /obtenir/i })).toBeDisabled();
  });
  it("active seulement après les deux confirmations", () => {
    render(<CheckoutForm />);
    const boxes = screen.getAllByRole("checkbox");
    boxes.forEach((box) => fireEvent.click(box));
    expect(screen.getByRole("button", { name: /obtenir/i })).toBeEnabled();
  });
});
