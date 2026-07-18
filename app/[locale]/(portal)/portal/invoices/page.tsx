import { InvoicesList } from "@/components/commerce/invoices-list";

export default function PortalInvoicesPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Invoices</h1>
      <InvoicesList />
    </div>
  );
}
