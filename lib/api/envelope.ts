import { NextResponse } from "next/server";

export type ApiError = { code: string; message: string };

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
};

export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200
): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json({ success: true, data, meta }, { status });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  meta?: Record<string, unknown>
): NextResponse<ApiEnvelope<never>> {
  return NextResponse.json({ success: false, error: { code, message }, meta }, { status });
}
