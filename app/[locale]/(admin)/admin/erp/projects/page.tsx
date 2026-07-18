import { ErpProjectsPanel } from "@/components/erp/erp-projects-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Projects</h1>
        <p className="text-sm text-muted mt-1">Delivery projects and tasks.</p>
      </div>
      <ErpProjectsPanel />
    </div>
  );
}
