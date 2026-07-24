"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

type Step = "name" | "email" | "phone" | "company" | "requirement" | "done";

const ORDER: Step[] = ["name", "email", "phone", "company", "requirement"];

const PROMPTS: Record<Exclude<Step, "done">, string> = {
  name: "What's your name?",
  email: "What's the best email to reach you?",
  phone: "Phone / WhatsApp number?",
  company: "Company name? (optional — type skip)",
  requirement: "Briefly, what do you need help with?",
};

export type LeadDraft = {
  name: string;
  email: string;
  phone: string;
  company: string;
  requirement: string;
};

export function LeadCaptureForm({
  onComplete,
}: {
  onComplete: (data: LeadDraft) => void;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>("name");
  const [value, setValue] = useState("");
  const [data, setData] = useState<LeadDraft>({
    name: "",
    email: "",
    phone: "",
    company: "",
    requirement: "",
  });

  function submitField(e: React.FormEvent) {
    e.preventDefault();
    if (step === "done") return;
    const v = value.trim();
    if (step === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return;
    if (step !== "company" && !v) return;

    const nextData = {
      ...data,
      [step]: step === "company" && v.toLowerCase() === "skip" ? "" : v,
    };
    setData(nextData);
    setValue("");
    const idx = ORDER.indexOf(step);
    if (idx >= ORDER.length - 1) {
      setStep("done");
      onComplete(nextData);
      return;
    }
    setStep(ORDER[idx + 1]);
  }

  if (step === "done") {
    return (
      <div className="mx-4 mb-3 rounded-xl bg-[#EEF5FB] px-3 py-2 text-[13px] text-[#105691]">
        Thanks {data.name} — you're all set. Ask us anything below.
      </div>
    );
  }

  return (
    <div className="space-y-2 px-4 pb-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="rounded-xl bg-[#EEF5FB] px-3 py-2 text-[14px] text-[#105691]"
        >
          {PROMPTS[step]}
        </motion.div>
      </AnimatePresence>
      <form onSubmit={submitField} className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-full border border-[#c5dced] bg-white px-4 py-2 text-[14px] outline-none focus:border-[#1873A8]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type here…"
          autoFocus
        />
        <button
          type="submit"
          className="rounded-full px-4 py-2 text-[13px] font-semibold text-white transition duration-200 ease-out"
          style={{ background: "#F45627" }}
        >
          Next
        </button>
      </form>
    </div>
  );
}
