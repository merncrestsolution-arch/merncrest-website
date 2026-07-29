import { Suspense } from "react";
import { CreateServiceWizard } from "@/components/staff/create-service-wizard";
import { LoadingState } from "@/components/system/loading-state";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CreateServiceWizard />
    </Suspense>
  );
}
