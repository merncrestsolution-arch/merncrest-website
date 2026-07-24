import { cookies, headers } from "next/headers";

function hostName() {
  return headers().then((h) => (h.get("host") || "").split(":")[0].toLowerCase());
}

/** True when browsing System.merncrest.lk (or ?system=1 / mc_system cookie). */
export async function isSystemSurface() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  if (cookieStore.get("mc_system")?.value === "1") return true;
  if (headerStore.get("x-merncrest-surface") === "system") return true;
  const host = (headerStore.get("host") || "").split(":")[0].toLowerCase();
  if (host.startsWith("system.") || host === "system.merncrest.lk") return true;
  const envHost = (process.env.SYSTEM_HOST || "").toLowerCase();
  if (envHost && host === envHost) return true;
  return false;
}

/** Localhost OR system surface — use Register.lk StaffShell for /admin + /staff. */
export async function useSystemShell() {
  if (await isSystemSurface()) return true;
  const host = await hostName();
  return host === "localhost" || host === "127.0.0.1";
}
