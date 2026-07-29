import { prisma } from "@/lib/db";
import { getSettingBool, getSettingNumber } from "@/lib/admin/settings";

const LOCK_WINDOW_MS = 15 * 60 * 1000;

export async function getSessionDays(): Promise<number> {
  const days = await getSettingNumber("security.sessionDays", 14);
  return Math.min(Math.max(days, 1), 90);
}

export async function getPasswordMinLength(): Promise<number> {
  const len = await getSettingNumber("security.passwordMinLength", 8);
  return Math.min(Math.max(len, 8), 128);
}

export async function getMaxLoginAttempts(): Promise<number> {
  const n = await getSettingNumber("security.maxLoginAttempts", 5);
  return Math.min(Math.max(n, 3), 20);
}

export function validatePasswordStrength(password: string, minLength: number): string | null {
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must include a number";
  return null;
}

/** Account lock via recent failed LoginHistory rows (no schema migration). */
export async function isAccountLocked(email: string): Promise<{ locked: boolean; attempts: number }> {
  const max = await getMaxLoginAttempts();
  const since = new Date(Date.now() - LOCK_WINDOW_MS);
  const failures = await prisma.loginHistory.count({
    where: { email: email.toLowerCase(), success: false, createdAt: { gte: since } },
  });
  return { locked: failures >= max, attempts: failures };
}

/** Clear failed login attempts after a successful authentication. */
export async function clearLoginFailures(email: string): Promise<void> {
  const since = new Date(Date.now() - LOCK_WINDOW_MS);
  await prisma.loginHistory.deleteMany({
    where: { email: email.toLowerCase(), success: false, createdAt: { gte: since } },
  });
}

export async function is2faRequired(): Promise<boolean> {
  return getSettingBool("security.require2fa", false);
}
