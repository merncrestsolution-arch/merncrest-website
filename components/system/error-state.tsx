import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center"
      role="alert"
    >
      <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
      <h3 className="text-sm font-semibold text-[var(--sp-text)]">Something went wrong</h3>
      <p className="mt-1 max-w-md text-sm text-[var(--sp-muted)]">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
