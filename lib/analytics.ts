export type AnalyticsEvent = "cta_click" | "example_open" | "form_start" | "form_step_view" | "form_step_complete" | "form_validation_error" | "category_select" | "form_submit" | "form_submit_success" | "form_submit_error" | "testimonial_view" | "checkout_start" | "checkout_redirect" | "question_submit";

export function trackEvent(name: AnalyticsEvent, properties: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  const safe = Object.fromEntries(Object.entries(properties).filter(([key]) => !/name|email|birth|place|question|dossier/i.test(key)));
  window.dispatchEvent(new CustomEvent("reponseastrale:analytics", { detail: { name, properties: safe } }));
}
