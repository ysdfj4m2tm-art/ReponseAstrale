import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";

describe("confirmation avant Stripe", () => {
  afterEach(() => vi.restoreAllMocks());

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
  it("affiche un message générique en cas d’indisponibilité réelle", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "UNAVAILABLE" }) }));
    render(<CheckoutForm />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "client@example.fr" } });
    screen.getAllByRole("checkbox").forEach((box) => fireEvent.click(box));
    fireEvent.click(screen.getByRole("button", { name: /obtenir/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Le paiement n’est pas disponible pour le moment."));
    expect(screen.getByRole("alert")).not.toHaveTextContent("paiement de test");
  });
});
