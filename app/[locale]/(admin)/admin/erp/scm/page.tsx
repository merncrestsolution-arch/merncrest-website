import { Link } from "@/i18n/routing";
import { ErpProcurementPanel } from "@/components/erp/erp-procurement-panel";
import { ErpInventoryPanel } from "@/components/erp/erp-inventory-panel";
import { Button } from "@/components/ui/button";

/** Stitch screen: Supply Chain - MernCrest ERP (UI shell only) */
export default function Page() {
  return (
    <div className="space-y-8">
      <div className="stitch-card border-[#7c3aed]/30">
        <h1 className="font-display text-2xl font-bold text-white">Supply Chain</h1>
        <p className="text-sm text-[#ccc3d8] mt-2">
          Procurement, warehouse, logistics planning, and shipment tracking — Luminous Enterprise ERP
          shell.
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          <Button asChild size="sm" variant="outline" className="rounded-xl border-[#4a4455]">
            <Link href="/admin/erp/procurement">Procurement</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl border-[#4a4455]">
            <Link href="/admin/erp/inventory">Inventory</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl border-[#4a4455]">
            <Link href="/admin/erp/fsm">Field delivery / FSM</Link>
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-white">Procurement slice</h2>
        <div className="stitch-card">
          <ErpProcurementPanel />
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-display font-semibold text-white">Warehouse / inventory slice</h2>
        <div className="stitch-card">
          <ErpInventoryPanel />
        </div>
      </section>
    </div>
  );
}
