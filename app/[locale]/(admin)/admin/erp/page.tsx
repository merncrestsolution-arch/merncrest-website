import { ErpDashboard } from "@/components/erp/erp-dashboard";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">ERP · Enterprise Platform</h1>
        <p className="text-sm text-muted mt-1">
          Part 05 — 50+ capability areas across 20 module groups (HRM → Executive Dashboards)
        </p>
      </div>
      <ErpDashboard />
    </div>
  );
}
