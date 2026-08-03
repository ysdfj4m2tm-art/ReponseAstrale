const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateDossierId(date = new Date(), randomValues?: Uint8Array) {
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  const bytes = randomValues ?? crypto.getRandomValues(new Uint8Array(6));
  const suffix = Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join("");
  return `RA-${stamp}-${suffix}`;
}
