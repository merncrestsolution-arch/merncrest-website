"use client";

export function TypingIndicator() {
  return (
    <div className="flex justify-start" aria-live="polite" aria-label="Typing">
      <div className="flex items-center gap-1.5 rounded-xl bg-[#EEF5FB] px-3 py-2.5 motion-reduce:gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1873A8] [animation-delay:0ms] motion-reduce:animate-none" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1873A8] [animation-delay:150ms] motion-reduce:animate-none" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1873A8] [animation-delay:300ms] motion-reduce:animate-none" />
      </div>
    </div>
  );
}
