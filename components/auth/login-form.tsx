"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { TurnstileWidget, isTurnstileConfigured } from "@/components/security/turnstile-widget";
import { motion } from "framer-motion";

function safeNextPath(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const systemIntent =
    searchParams.get("system") === "1" || searchParams.get("reason") === "staff";
  const nextPath = safeNextPath(searchParams.get("next"));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-8 stitch-card !p-8 shadow-lg"
    >
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {systemIntent ? "System login" : t("loginTitle")}
        </h1>
        <p className="mt-2 text-muted">
          {searchParams.get("reason") === "staff"
            ? "Staff account required. Sign in with your MernCrest work email."
            : systemIntent
              ? "Sign in to System.merncrest.lk (staff ESS)."
              : t("loginSubtitle")}
        </p>
      </div>

      <form
        className="space-y-4"
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
              if (systemIntent) {
                setError(
                  "This is the staff System. Use a staff account (e.g. staff@merncrest.lk)."
                );
                return;
              }
              router.push("/portal");
            } else if (systemIntent || nextPath?.includes("/staff")) {
              router.push("/staff?system=1");
            } else if (role === "ADMIN" || role === "OWNER") {
              router.push("/admin");
            } else {
              router.push("/staff?system=1");
            }
            router.refresh();
          } catch {
            setError("Network error. Please try again.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <label className="text-sm font-medium mb-1.5 block text-foreground" htmlFor="email">
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="auth-input"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block text-foreground" htmlFor="password">
            {t("password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="auth-input"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-stitch-outline text-stitch-primary accent-[var(--stitch-primary)]"
            />
            {t("rememberMe")}
          </label>
          <Link href="/forgot-password" className="text-accent hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
        <TurnstileWidget onVerify={setCaptchaToken} />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Signing in..." : t("loginCta")}
        </Button>
      </form>

      <p className="text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-accent hover:underline">
          {t("registerCta")}
        </Link>
      </p>
    </motion.div>
  );
}
