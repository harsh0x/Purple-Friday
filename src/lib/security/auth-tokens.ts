// In-memory password reset token storage
export const RESET_TOKENS = new Map<string, { email: string; expiresAt: number }>();

