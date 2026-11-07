/**
 * Privacy and Data Masking Utilities for Public Tracking
 */

/**
 * Masks a full name for privacy (e.g., "Vikram Sharma" -> "V*** S***")
 */
export function maskCustomerName(fullName: string): string {
  if (!fullName || typeof fullName !== "string") return "***";
  const parts = fullName.trim().split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 1) return part;
      return `${part[0]}***`;
    })
    .join(" ");
}

/**
 * Masks a 10-digit Indian phone number (e.g., "9876543210" -> "******3210")
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== "string") return "******0000";
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 4) return "******";
  const lastFour = clean.slice(-4);
  return `${"*".repeat(Math.max(0, clean.length - 4))}${lastFour}`;
}

/**
 * Masks an email address (e.g., "vikram@enterprise.in" -> "v***m@enterprise.in")
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***@***.***";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}
