import { AdminPaymentVerificationPanel } from "@/components/admin/admin-payment-verification-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Pending Verification</h1>
      <p className="text-sm text-muted">
        Bank transfer queue — approve to confirm payment and start automated provisioning.
      </p>
      <AdminPaymentVerificationPanel />
    </div>
  );
}
