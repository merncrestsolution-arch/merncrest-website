import { Link } from "@/i18n/routing";
import { ErpProcurementPanel } from "@/components/erp/erp-procurement-panel";
import { ErpInventoryPanel } from "@/components/erp/erp-inventory-panel";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Supply Chain (5.6)</h1>
        <p className="text-sm text-muted mt-1">
          Procurement, warehouse, logistics planning, and shipment tracking hooks.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline"><Link href="/admin/erp/procurement">Procurement</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/admin/erp/inventory">Inventory</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/admin/erp/fsm">Field delivery / FSM</Link></Button>
      </div>
      <section className="space-y-3">
        <h2 className="font-display font-semibold">Procurement slice</h2>
        <ErpProcurementPanel />
      </section>
      <section className="space-y-3">
        <h2 className="font-display font-semibold">Warehouse / inventory slice</h2>
        <ErpInventoryPanel />
      </section>
    </div>
  );
}
