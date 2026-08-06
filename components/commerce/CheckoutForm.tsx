"use client";

import { useState } from "react";
import { SunTokenIcon } from "@/components/brand/SunTokenIcon";
import { commerceProducts, formatEuro, type ProductCode } from "@/content/commerce";
import { executionConsentText } from "@/content/legal";
import { trackEvent } from "@/lib/analytics";

export function CheckoutForm({ chartToken }: { chartToken?: string }) {
  const [productCode, setProductCode] = useState<ProductCode>("three_suns");
  const [email, setEmail] = useState("");
  const [acceptCgv, setAcceptCgv] = useState(false);
  const [acceptExecution, setAcceptExecution] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const selectedProduct = commerceProducts[productCode];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    trackEvent("checkout_start", { product: productCode });
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productCode, email, chartToken, acceptCgv, acceptExecution }),
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "CHECKOUT_FAILED");
      window.location.assign(result.url);
    } catch {
      setError("Le paiement n’est pas disponible pour le moment. Aucun débit n’a été effectué.");
      setPending(false);
    }
  }

  return (
    <form className="checkout-form" onSubmit={submit}>
      <fieldset className="product-grid">
        <legend className="sr-only">Choisir une offre</legend>
        {Object.values(commerceProducts).map((product) => (
          <label className={`product-card ${productCode === product.code ? "product-card--selected" : ""}`} key={product.code}>
            <input type="radio" name="product" value={product.code} checked={productCode === product.code} onChange={() => setProductCode(product.code)} />
            {product.badge && <span className="product-badge">{product.badge}</span>}
            <span className="product-card__sun"><SunTokenIcon/><strong>{product.name}</strong></span><span>{product.subtitle}</span>
            <b>{formatEuro(product.priceCents)} TTC</b><small>Valable {product.validityDays} jours · Aucun abonnement</small>
          </label>
        ))}
      </fieldset>
      <label className="field-label">E-mail de réception et d’accès
        <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <p className="checkout-summary"><strong>{selectedProduct.name} · {selectedProduct.sunCount} question{selectedProduct.sunCount > 1 ? "s" : ""} · {formatEuro(selectedProduct.priceCents)} TTC</strong><br/>{selectedProduct.sunCount > 1 ? "Vos 3 Soleils devront être utilisés dans les 30 jours suivant le paiement. Économisez 9,80 € par rapport à trois achats unitaires." : "Votre Soleil devra être utilisé dans les 7 jours suivant le paiement."}</p>
      <label className="consent-row"><input type="checkbox" checked={acceptCgv} onChange={(event) => setAcceptCgv(event.target.checked)} />
        <span>J’accepte les <a href="/conditions-generales-de-vente" target="_blank">conditions générales de vente</a> et la <a href="/politique-de-confidentialite" target="_blank">politique de confidentialité</a>.</span>
      </label>
      <label className="consent-row"><input type="checkbox" checked={acceptExecution} onChange={(event) => setAcceptExecution(event.target.checked)} />
        <span>{executionConsentText}</span>
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" disabled={pending || !acceptCgv || !acceptExecution}>{pending ? "Préparation…" : `Obtenir ${selectedProduct.name} — ${formatEuro(selectedProduct.priceCents)}`}</button>
      <p className="checkout-note">Paiement traité par Stripe. RéponseAstrale ne reçoit jamais vos données de carte.</p>
    </form>
  );
}
