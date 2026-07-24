"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, X } from "lucide-react";

interface QuoteDialogProps {
  /** Pre-fills the CRM "interest" field, e.g. a service or solution name. */
  interest?: string;
  /** Origin marker for CRM, e.g. "services", "pricing", "solutions". */
  formType?: string;
  /** Button label. */
  label?: string;
  /** Button visual variant. */
  variant?: "default" | "outline";
  className?: string;
  fullWidth?: boolean;
}

export function QuoteDialog({
  interest,
  formType = "quote",
  label = "Request a Quote",
  variant = "default",
  className,
  fullWidth,
}: QuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      fullName: String(fd.get("fullName") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      company: String(fd.get("company") || ""),
      message: String(fd.get("message") || ""),
      interest: interest || String(fd.get("interest") || ""),
      formType,
    };
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setStatus("idle");
      setError("");
    }, 300);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        className={`${fullWidth ? "w-full" : ""} rounded-full ${className || ""}`}
      >
        {label}
      </Button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md"
                  onClick={close}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 bg-background/95 dark:bg-card/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl"
                >
                  <button
                    onClick={close}
                    className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-black/10 dark:hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {status === "success" ? (
                    <div className="flex flex-col items-center gap-5 py-8 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
                        <CheckCircle2 className="h-10 w-10 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Thank you!</h3>
                        <p className="text-muted">
                          We&apos;ve received your request. Our team will review it and email your
                          quotation shortly.
                        </p>
                      </div>
                      <Button className="rounded-full" onClick={close}>
                        Close
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-foreground mb-1">{label}</h3>
                      <p className="text-sm text-muted mb-6">
                        {interest ? `Interested in: ${interest}. ` : ""}
                        Tell us a little about your needs and we&apos;ll be in touch.
                      </p>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <input
                            name="fullName"
                            required
                            placeholder="Full name *"
                            className="h-11 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 text-foreground outline-none focus:border-accent"
                          />
                          <input
                            name="email"
                            type="email"
                            required
                            placeholder="Email *"
                            className="h-11 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 text-foreground outline-none focus:border-accent"
                          />
                          <input
                            name="phone"
                            placeholder="Phone / WhatsApp"
                            className="h-11 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 text-foreground outline-none focus:border-accent"
                          />
                          <input
                            name="company"
                            placeholder="Company"
                            className="h-11 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 text-foreground outline-none focus:border-accent"
                          />
                        </div>
                        {!interest && (
                          <input
                            name="interest"
                            placeholder="What do you need?"
                            className="w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 text-foreground outline-none focus:border-accent"
                          />
                        )}
                        <textarea
                          name="message"
                          rows={4}
                          placeholder="Project details / message"
                          className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3 text-foreground outline-none focus:border-accent resize-none"
                        />
                        {status === "error" && (
                          <p className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
                            {error}
                          </p>
                        )}
                        <Button type="submit" disabled={status === "loading"} className="w-full h-12 rounded-xl">
                          {status === "loading" ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending…
                            </>
                          ) : (
                            "Send request"
                          )}
                        </Button>
                        <p className="text-center text-xs text-muted">
                          Your details go straight to our team — no spam.
                        </p>
                      </form>
                    </>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
