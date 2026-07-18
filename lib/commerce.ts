import { getSessionUser, isStaffRole, type SessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireUser(): Promise<
  { user: SessionUser; error?: never } | { user?: never; error: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

export async function requireStaff(): Promise<
  { user: SessionUser; error?: never } | { user?: never; error: NextResponse }
> {
  const result = await requireUser();
  if (result.error) return result;
  if (!isStaffRole(result.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}

export function formatMoney(cents: number, currency = "LKR") {
  const value = (cents / 100).toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${value}`;
}

export function nextNumber(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${stamp}-${rand}`;
}
