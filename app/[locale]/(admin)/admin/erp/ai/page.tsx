import { ErpAiPanel } from "@/components/erp/erp-ai-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">AI Enterprise Platform (5.15)</h1>
        <p className="text-sm text-muted mt-1">
          Business assistant, report stubs, and forecasting context from live ERP data.
        </p>
      </div>
      <ErpAiPanel />
    </div>
  );
}
