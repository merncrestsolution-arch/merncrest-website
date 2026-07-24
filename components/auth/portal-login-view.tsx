"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { TurnstileWidget, isTurnstileConfigured } from "@/components/security/turnstile-widget";
import "@/app/styles/stitch-portal.css";

function safeNextPath(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function PortalLoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const nextPath = safeNextPath(searchParams.get("next"));

  return (
    <div className="stitch-app stitch-auth">
      <div className="stitch-auth-hero">
        <div>
          <div className="stitch-auth-brand">
            <span>Portal</span>.merncrest
          </div>
        </div>
        <div>
          <h1>Your customer workspace</h1>
          <p>
            Manage domains, hosting, invoices, support tickets, and custom projects — all from
            one secure portal.
          </p>
          <div className="stitch-auth-features">
            {["Domains & DNS", "Hosting & cloud", "Billing & orders", "Support tickets"].map(
              (f) => (
                <div key={f} className="stitch-auth-feature">
                  {f}
                </div>
              )
            )}
          </div>
        </div>
        <p className="text-xs opacity-60">Portal.merncrest.lk</p>
      </div>

      <div className="stitch-auth-panel">
        <div className="stitch-auth-card">
          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to your MernCrest customer account</p>

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
                if (isStaff && !nextPath) {
                  router.push("/staff?system=1");
                } else {
                  router.push(nextPath || "/portal");
                }
                router.refresh();
              } catch {
                setError("Network error. Please try again.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="stitch-field">
              <label htmlFor="portal-email">Email address</label>
              <input
                id="portal-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>
            <div className="stitch-field">
              <label htmlFor="portal-password">Password</label>
              <input
                id="portal-password"
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
              <Link href="/forgot-password" className="text-violet-600 font-medium">
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
            New customer? <Link href="/register">Create an account</Link>
          </p>
          <p className="stitch-auth-foot !mt-2">
            MernCrest staff? <Link href="/login?system=1">System.merncrest.lk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
