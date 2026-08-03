import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({
  rows = 4,
  label = "Loading",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label={label}>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-xl border border-[var(--sp-border)] p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
