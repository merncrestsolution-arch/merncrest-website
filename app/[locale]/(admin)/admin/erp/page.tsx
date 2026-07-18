import { ErpDashboard } from "@/components/erp/erp-dashboard";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">ERP</h1>
        <p className="text-sm text-muted mt-1">
          HRM · Finance · Projects · EAM · SCM · FSM · Roles
        </p>
      </div>
      <ErpDashboard />
    </div>
  );
}
