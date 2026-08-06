export function safeInternalRedirect(value: string | null | undefined, fallback = "/espace") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) {
    return fallback;
  }
  try {
    const parsed = new URL(value, "https://reponseastrale.invalid");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
