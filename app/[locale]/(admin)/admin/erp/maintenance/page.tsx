import { Link } from "@/i18n/routing";
import { ErpAssetsPanel } from "@/components/erp/erp-assets-panel";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Predictive Maintenance (5.14)</h1>
        <p className="text-sm text-muted mt-1">
          Asset health, maintenance schedules, and AI failure hints (paired with IoT).
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline"><Link href="/admin/erp/iot">IoT devices</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/admin/erp/assets">Asset registry</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/admin/erp/ai">AI assistant</Link></Button>
      </div>
      <ErpAssetsPanel />
    </div>
  );
}
