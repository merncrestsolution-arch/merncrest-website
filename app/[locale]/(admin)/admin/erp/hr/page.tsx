import { ErpHrPanel } from "@/components/erp/erp-hr-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">HRM</h1>
        <p className="text-sm text-muted mt-1">Employees, departments, and leave.</p>
      </div>
      <ErpHrPanel />
    </div>
  );
}
