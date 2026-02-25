/**
 * Normalize Moroccan phone to canonical form for storage and lookup.
 * Accepts: +212 6 66 12 34 56, 06 66 12 34 56, 212666123456, 0666123456
 * Returns: +212666123456 (E.164) or null if invalid.
 */
export function normalizePhoneMorocco(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("6")) {
    return "+212" + digits;
  }
  if (digits.length === 10 && digits.startsWith("06")) {
    return "+212" + digits.slice(1);
  }
  if (digits.length === 11 && digits.startsWith("212")) {
    return "+" + digits;
  }
  if (digits.length === 12 && digits.startsWith("2126")) {
    return "+" + digits;
  }
  return null;
}

/** Returns true if input looks like a phone (digits, +, spaces) rather than email */
export function looksLikePhone(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.includes("@")) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 9 && /^[0-6]/.test(digits);
}
