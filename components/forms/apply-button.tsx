"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ApplyButtonProps {
  jobTitle: string;
}

const terms = [
  "You must provide accurate and truthful information in your application.",
  "MERNcrest Solutions reserves the right to verify your educational and professional background.",
  "This is an unpaid internship position and does not guarantee future employment.",
  "You agree to maintain the confidentiality of any proprietary information shared during the interview process.",
  "All intellectual property created during the internship remains the property of MERNcrest Solutions.",
  "You must be available to work the agreed-upon hours for the duration of the program.",
  "MERNcrest promotes a harassment-free workplace; any violation will result in immediate termination.",
  "We process your personal data in accordance with our Privacy Policy for recruitment purposes only.",
  "You must provide your own working equipment and a stable internet connection for remote roles.",
  "MERNcrest Solutions may terminate the internship at any time without prior notice."
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
    scale: 0.95
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 30 : -30,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  })
};

export function ApplyButton({ jobTitle }: ApplyButtonProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"terms" | "form" | "success">("terms");
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setTimeout(() => {
        setStep("terms");
        setDirection(1);
      }, 300);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const changeStep = (newStep: "terms" | "form" | "success", dir: number) => {
    setDirection(dir);
    setStep(newStep);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    formData.append("position", jobTitle);
    formData.append("agreeTerms", "true");

    const file = formData.get("attachment") as File;
    if (file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB.");
        setLoading(false);
        return;
      }
      const allowedTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/jpeg', 
        'image/png', 
        'image/jpg'
      ];
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
        setError("Only PDF, DOCX, and Image files are allowed.");
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        changeStep("success", 1);
      } else {
        setError(result.error || "Failed to submit application.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        variant="outline" 
        className="shrink-0 group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all"
      >
        Apply Now
      </Button>

      {mounted && createPortal(
        <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-background/95 dark:bg-card/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <button 
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 z-20 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground hover:text-foreground dark:hover:text-white" />
              </button>

              <div className="p-6 sm:p-8 relative overflow-hidden min-h-[400px]">
                <AnimatePresence mode="wait" custom={direction}>
                  
                  {/* STEP 1: Terms & Conditions */}
                  {step === "terms" && (
                    <motion.div 
                      key="terms"
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-6 w-full"
                    >
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Terms and Conditions</h2>
                        <p className="text-muted text-sm">Please read and agree to the following terms before applying for {jobTitle}.</p>
                      </div>
                      
                      <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-5 space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-inner">
                        <ol className="list-decimal pl-5 space-y-3 text-sm text-muted-foreground">
                          {terms.map((term, i) => (
                            <li key={i} className="pl-1 leading-relaxed text-foreground dark:text-muted">{term}</li>
                          ))}
                        </ol>
                      </div>

                      <Button onClick={() => changeStep("form", 1)} className="w-full h-12 text-lg relative overflow-hidden group">
                        <span className="relative z-10">I Agree & Continue</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      </Button>
                    </motion.div>
                  )}

                  {/* STEP 2: Application Form */}
                  {step === "form" && (
                    <motion.div 
                      key="form"
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-6 w-full"
                    >
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Apply for {jobTitle}</h2>
                        <p className="text-muted text-sm">Enter your details below to submit your application.</p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-muted-foreground">Full Name <span className="text-red-500">*</span></label>
                            <input
                              id="name"
                              name="name"
                              type="text"
                              required
                              className="w-full h-12 px-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-accent focus:ring-1 focus:ring-accent transition-colors outline-none text-foreground dark:text-white placeholder:text-muted-foreground/50"
                              placeholder="John Doe"
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email Address <span className="text-red-500">*</span></label>
                            <input
                              id="email"
                              name="email"
                              type="email"
                              required
                              className="w-full h-12 px-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-accent focus:ring-1 focus:ring-accent transition-colors outline-none text-foreground dark:text-white placeholder:text-muted-foreground/50"
                              placeholder="john@example.com"
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone Number <span className="text-red-500">*</span></label>
                            <input
                              id="phone"
                              name="phone"
                              type="tel"
                              required
                              className="w-full h-12 px-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-accent focus:ring-1 focus:ring-accent transition-colors outline-none text-foreground dark:text-white placeholder:text-muted-foreground/50"
                              placeholder="+94 71 234 5678"
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="attachment" className="text-sm font-medium text-muted-foreground">Resume / CV (PDF, DOCX, or Image, max 5MB)</label>
                            <input
                              id="attachment"
                              name="attachment"
                              type="file"
                              accept=".pdf,.docx,.doc,image/png,image/jpeg,image/jpg"
                              className="w-full h-12 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-accent focus:ring-1 focus:ring-accent transition-colors outline-none text-foreground dark:text-white file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
                            />
                          </div>
                        </div>

                        {error && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                            {error}
                          </motion.div>
                        )}

                        <div className="pt-2 flex gap-3">
                          <Button type="button" variant="outline" onClick={() => changeStep("terms", -1)} className="flex-1 h-12 hover:bg-black/5 dark:hover:bg-white/5">
                            Back
                          </Button>
                          <Button type="submit" disabled={loading} className="flex-[2] h-12 text-lg">
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...
                              </>
                            ) : (
                              "Submit"
                            )}
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* STEP 3: Success Message */}
                  {step === "success" && (
                    <motion.div 
                      key="success"
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="flex flex-col items-center justify-center py-12 text-center space-y-6 w-full"
                    >
                      <motion.div 
                        initial={{ scale: 0, rotate: -180 }} 
                        animate={{ scale: 1, rotate: 0 }} 
                        transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                        className="h-24 w-24 bg-accent/20 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(var(--accent),0.3)]"
                      >
                        <CheckCircle2 className="h-12 w-12 text-accent" />
                      </motion.div>
                      <div>
                        <motion.h3 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                          className="text-3xl font-bold mb-3"
                        >
                          Thank You!
                        </motion.h3>
                        <motion.p 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                          className="text-muted leading-relaxed text-lg"
                        >
                          We have received your application and will reach out to you soon.
                        </motion.p>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                          className="mt-6 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
                        >
                          <p className="text-muted text-sm mb-1">For urgent inquiries, please contact our Customer Care:</p>
                          <span className="font-mono text-accent text-xl font-bold">+94713838638</span>
                        </motion.div>
                      </div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="w-full pt-4">
                        <Button className="w-full h-12 text-lg" onClick={() => setOpen(false)}>
                          Close
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
