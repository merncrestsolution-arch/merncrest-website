import "@/app/styles/stitch-portal.css";
import { Link } from "@/i18n/routing";
import { Hexagon } from "lucide-react";

/** Public shell for system.merncrest.lk pages that do not require login (e.g. /downloads). */
export default function SystemPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="stitch-app stitch-system min-h-screen">
      <header className="stitch-topbar border-b border-[var(--sp-border)]">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between px-4 py-3">
          <Link href="/login?system=1" className="flex items-center gap-2 text-sm font-semibold">
            <span className="stitch-brand-icon inline-flex">
              <Hexagon className="h-4 w-4" />
            </span>
            system.merncrest.lk
          </Link>
          <Link href="/login?system=1" className="stitch-btn-sm">
            Staff login
          </Link>
        </div>
      </header>
      <main className="stitch-content max-w-4xl mx-auto w-full">{children}</main>
    </div>
  );
}
