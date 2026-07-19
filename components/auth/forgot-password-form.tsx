"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("resetTitle")}</h1>
        <p className="mt-2 text-muted">{t("resetSubtitle")}</p>
      </div>
      {sent ? (
        <p className="text-sm text-success">
          If an account exists for that email, a reset link will be sent. Check your inbox or contact support.
        </p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setTimeout(() => {
              setSent(true);
              setLoading(false);
            }, 600);
          }}
        >
          <div>
            <label className="text-sm font-medium mb-1.5 block" htmlFor="email">{t("email")}</label>
            <input id="email" name="email" type="email" required className="w-full h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Sending…" : t("resetCta")}
          </Button>
        </form>
      )}
      <Link href="/login" className="text-sm text-accent hover:underline">{t("loginCta")}</Link>
    </motion.div>
  );
}
