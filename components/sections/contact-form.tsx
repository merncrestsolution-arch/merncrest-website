"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TurnstileWidget, isTurnstileConfigured } from "@/components/security/turnstile-widget";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/routing";

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/15";

const labelClass = "mb-1.5 block text-[13px] font-medium text-slate-600";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCaptchaError("");
    if (isTurnstileConfigured() && !captchaToken) {
      setCaptchaError("Please complete the security check.");
      return;
    }
    setStatus("submitting");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      fullName: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      interest: String(formData.get("subject") || ""),
      message: String(formData.get("message") || ""),
      formType: "contact",
      channel: "WEBSITE" as const,
      turnstileToken: captchaToken,
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus("success");
        form.reset();
        setCaptchaToken("");
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatus("error");
    } finally {
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center space-y-5 py-10 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-semibold text-slate-900">
            Thank you for your message
          </h3>
          <p className="mt-2 text-slate-500">
            We received your inquiry and will reply within one business day.
          </p>
        </div>
        <Button
          className="h-11 rounded-full bg-rose-600 px-6 font-semibold text-white hover:bg-rose-700"
          onClick={() => setStatus("idle")}
        >
          Send another message
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full name
          </label>
          <input
            id="name"
            name="name"
            required
            type="text"
            placeholder="Jane Fernando"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email address
          </label>
          <input
            id="email"
            name="email"
            required
            type="email"
            placeholder="jane@company.com"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone / WhatsApp
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+94 7X XXX XXXX"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="subject" className={labelClass}>
            Interest
          </label>
          <select id="subject" name="subject" required defaultValue="" className={fieldClass}>
            <option value="" disabled>
              Select a topic
            </option>
            <option value="Software Development">Software Development</option>
            <option value="AI Solutions">AI Solutions</option>
            <option value="Cloud Consulting">Cloud Consulting</option>
            <option value="Domains & Hosting">Domains &amp; Hosting</option>
            <option value="Support">Support</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us about your project or question..."
          className={`${fieldClass} resize-none`}
        />
      </div>

      <TurnstileWidget onVerify={setCaptchaToken} />

      {captchaError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {captchaError}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Couldn&apos;t send your message. Please include an email or phone and try again.
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full rounded-full bg-rose-600 text-[15px] font-semibold text-white shadow-none hover:bg-rose-700 disabled:opacity-70"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Sending...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Send message
            <Send className="h-4 w-4" />
          </span>
        )}
      </Button>

      <p className="text-center text-[12px] leading-relaxed text-slate-400">
        By sending, you agree to our{" "}
        <Link href="/privacy" className="font-medium text-slate-600 underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        . We never share your details.
      </p>
    </form>
  );
}
