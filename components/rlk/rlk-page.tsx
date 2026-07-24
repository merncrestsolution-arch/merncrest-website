import { cn } from "@/lib/utils";

/** Standard page wrapper for Stitch Portal + System surfaces */
export function RlkPage({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <h2 className="stitch-page-title">{title}</h2>
      {description ? <p className="stitch-page-sub">{description}</p> : null}
      {children}
    </div>
  );
}
