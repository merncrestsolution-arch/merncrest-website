import { ErpDashboardsPanel } from "@/components/erp/erp-dashboards-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Executive Dashboards (5.20)</h1>
        <p className="text-sm text-muted mt-1">
          CEO · Finance · HR · Sales · Support · Ops · Projects · System Health
        </p>
      </div>
      <ErpDashboardsPanel />
    </div>
  );
}
