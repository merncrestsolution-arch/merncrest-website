"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** True when a public site key is configured (protection active). */
export function isTurnstileConfigured() {
  return Boolean(SITE_KEY);
}

/**
 * Cloudflare Turnstile widget. Renders nothing when no site key is configured,
 * so forms keep working before Cloudflare is set up. Calls `onVerify` with the
 * token on success, or an empty string when it expires/errors.
 */
export function TurnstileWidget({
  onVerify,
  className,
  theme = "light",
}: {
  onVerify: (token: string) => void;
  className?: string;
  theme?: "light" | "dark" | "auto";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const cb = useRef(onVerify);
  cb.current = onVerify;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        if (widgetId.current) return; // guard double-render (StrictMode)
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          theme,
          callback: (token: string) => cb.current(token),
          "expired-callback": () => cb.current(""),
          "error-callback": () => cb.current(""),
        });
      })
      .catch(() => {
        /* script blocked/offline — leave unrendered */
      });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* ignore */
        }
        widgetId.current = null;
      }
    };
  }, [theme]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className={className} />;
}
