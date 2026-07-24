import { InvoicesList } from "@/components/commerce/invoices-list";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalInvoicesPage() {
  return (
    <RlkPage title="Invoices" description="View and pay invoices for your services.">
      <InvoicesList />
    </RlkPage>
  );
}
