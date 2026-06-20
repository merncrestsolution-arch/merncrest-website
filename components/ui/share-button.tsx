"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ShareButton({ jobId }: { jobId: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#${jobId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="icon"
        onClick={handleShare}
        title="Copy link to this career"
      >
        <Link className="h-4 w-4" />
      </Button>

      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-3 whitespace-nowrap bg-background dark:bg-black border border-black/10 dark:border-white/10 shadow-xl rounded-lg py-2 px-3 flex items-center gap-2 text-sm text-foreground dark:text-white z-50"
          >
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Link copied to your clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
