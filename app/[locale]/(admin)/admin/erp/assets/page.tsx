import { ErpAssetsPanel } from "@/components/erp/erp-assets-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Assets (EAM)</h1>
        <p className="text-sm text-muted mt-1">Company asset registry and status.</p>
      </div>
      <ErpAssetsPanel />
    </div>
  );
}
