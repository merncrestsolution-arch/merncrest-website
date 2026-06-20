"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch("https://formsubmit.co/ajax/merncrestsolution@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStatus("success");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatus("error");
    } finally {
      // Reset status after a delay
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  if (status === "success") {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center space-y-6 w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-3xl p-8"
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
            className="text-3xl font-bold mb-3 text-foreground dark:text-white"
          >
            Thank You For Your Message!
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-muted-foreground leading-relaxed text-lg"
          >
            We have received your inquiry and our team will get back to you shortly.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="w-full pt-4">
          <Button 
            className="h-12 text-lg bg-gradient-to-r from-accent to-purple-600 hover:from-accent hover:to-accent text-white font-medium rounded-xl px-8 transition-all shadow-lg hover:shadow-accent/25" 
            onClick={() => setStatus("idle")}
          >
            Send Another Message
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative">
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2 group">
          <label htmlFor="name" className="text-sm font-medium text-muted-foreground dark:text-white/80 group-focus-within:text-accent transition-colors">Full Name</label>
          <input 
            id="name"
            name="name"
            required
            type="text" 
            placeholder="John Doe"
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-foreground dark:text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          />
        </div>
        <div className="space-y-2 group">
          <label htmlFor="email" className="text-sm font-medium text-muted-foreground dark:text-white/80 group-focus-within:text-accent transition-colors">Email Address</label>
          <input 
            id="email"
            name="email"
            required
            type="email" 
            placeholder="john@example.com"
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-foreground dark:text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          />
        </div>
      </div>

      <div className="space-y-2 group">
        <label htmlFor="subject" className="text-sm font-medium text-muted-foreground dark:text-white/80 group-focus-within:text-accent transition-colors">Subject</label>
        <input 
          id="subject"
          name="subject"
          required
          type="text" 
          placeholder="How can we help you?"
          className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-foreground dark:text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
        />
      </div>

      <div className="space-y-2 group">
        <label htmlFor="message" className="text-sm font-medium text-muted-foreground dark:text-white/80 group-focus-within:text-accent transition-colors">Message</label>
        <textarea 
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us about your project..."
          className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-foreground dark:text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
        />
      </div>

      {status === "error" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Failed to send message. Please ensure SMTP is configured or try again later.
        </motion.div>
      )}

      <Button 
        type="submit" 
        size="lg" 
        className="w-full h-14 bg-gradient-to-r from-accent to-purple-600 hover:from-accent hover:to-accent text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-accent/25"
        disabled={status !== "idle"}
      >
        {status === "idle" && (
          <span className="flex items-center justify-center gap-2">
            Send Message
            <Send className="h-4 w-4" />
          </span>
        )}
        {status === "submitting" && (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </span>
        )}
        {status === "error" && (
          <span className="flex items-center justify-center gap-2 text-white">
            Try Again
          </span>
        )}
      </Button>
    </form>
  );
}
