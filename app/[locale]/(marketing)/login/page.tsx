import { Suspense } from "react";
import { PortalLoginView } from "@/components/auth/portal-login-view";
import { SystemLoginView } from "@/components/auth/system-login-view";
import { isSystemSurface } from "@/lib/system-surface";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ system?: string; reason?: string }>;
}) {
  const sp = await searchParams;
  const system =
    sp.system === "1" ||
    sp.reason === "staff" ||
    (await isSystemSurface());

  if (system) {
    return (
      <Suspense
        fallback={
          <div className="rlk-app flex min-h-screen items-center justify-center text-sm text-[#666]">
            Loading System login…
          </div>
        }
      >
        <SystemLoginView />
      </Suspense>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="rlk-app flex min-h-screen items-center justify-center text-sm text-[#666]">
          Loading Portal login…
        </div>
      }
    >
      <PortalLoginView />
    </Suspense>
  );
}

