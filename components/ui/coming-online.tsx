"use client";

import { useTranslations } from "next-intl";

export function ComingOnline({ title }: { title?: string }) {
  const t = useTranslations("common");

  return (
    <div className="coming-online">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">
        {t("comingOnline")}
      </p>
      {title && (
        <h2 className="font-display text-2xl font-bold mb-2">{title}</h2>
      )}
      <p className="text-sm text-muted max-w-md leading-relaxed">{t("comingOnlineBody")}</p>
    </div>
  );
}
