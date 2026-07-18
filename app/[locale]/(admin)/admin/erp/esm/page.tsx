import { ErpEsmPanel } from "@/components/erp/erp-esm-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Enterprise Service Management (5.9)</h1>
        <p className="text-sm text-muted mt-1">Service catalog, incidents, problems, changes, and SLA.</p>
      </div>
      <ErpEsmPanel />
    </div>
  );
}
