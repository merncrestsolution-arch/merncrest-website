"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { TurnstileWidget, isTurnstileConfigured } from "@/components/security/turnstile-widget";
import "@/app/styles/stitch-portal.css";

export function SystemLoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const staffRequired = searchParams.get("reason") === "staff";

  return (
    <div className="stitch-app stitch-auth">
      <div className="stitch-auth-hero">
        <div>
          <div className="stitch-auth-brand">
            <span>System</span>.merncrest
          </div>
        </div>
        <div>
          <h1>Employee Self-Service</h1>
          <p>
            Attendance, leave, tasks, internal chat, CRM, ERP, and approvals — all in one
            workspace for MernCrest staff.
          </p>
          <div className="stitch-auth-features">
            {["Attendance & leave", "Tasks & calendar", "CRM & sales", "ERP & HR"].map((f) => (
              <div key={f} className="stitch-auth-feature">
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs opacity-60">System.merncrest.lk · v1</p>
      </div>

      <div className="stitch-auth-panel">
        <div className="stitch-auth-card">
          <h2>Welcome back</h2>
          <p className="subtitle">
            {staffRequired
              ? "Staff account required. Sign in with your MernCrest work email."
              : "Sign in to System.merncrest.lk"}
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (isTurnstileConfigured() && !captchaToken) {
                setError("Please complete the security check.");
                return;
              }
              setLoading(true);
              const form = e.currentTarget;
              const email = (form.elements.namedItem("email") as HTMLInputElement).value;
              const password = (form.elements.namedItem("password") as HTMLInputElement).value;

              try {
                const res = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, password, turnstileToken: captchaToken }),
                });
                const data = await res.json();
                if (!res.ok) {
                  setError(data.error || "Login failed");
                  return;
                }
                const role = data.user?.role as string | undefined;
                const isStaff = role === "ADMIN" || role === "OWNER" || role === "STAFF";
                if (!isStaff) {
                  setError("Use a staff account (e.g. staff@merncrest.lk).");
                  return;
                }
                router.push("/staff?system=1");
                router.refresh();
              } catch {
                setError("Network error. Please try again.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="stitch-field">
              <label htmlFor="system-email">Email address</label>
              <input
                id="system-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@merncrest.lk"
              />
            </div>
            <div className="stitch-field">
              <label htmlFor="system-password">Password</label>
              <input
                id="system-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <label className="flex items-center gap-2 text-[#666] cursor-pointer">
                <input type="checkbox" name="remember" />
                Remember me
              </label>
              <Link href="/forgot-password?system=1" className="text-violet-600 font-medium">
                Forgot password?
              </Link>
            </div>

            <TurnstileWidget onVerify={setCaptchaToken} className="mb-4" />
            {error ? <p className="stitch-auth-error">{error}</p> : null}

            <button type="submit" className="stitch-btn-primary" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="stitch-auth-foot">
            Customer?{" "}
            <Link href="/login">Open Portal.merncrest.lk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
