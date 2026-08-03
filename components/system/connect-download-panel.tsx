"use client";

import Image from "next/image";
import { Download, Shield, Smartphone, Wifi } from "lucide-react";
import { CONNECT_APP } from "@/lib/connect-app-meta";

type Props = {
  apkAvailable: boolean;
  apkSizeMb: string | null;
  downloadHref: string;
  downloadFileName: string;
  version: string;
  build: number;
  packageId: string;
  minAndroid: string;
};

export function ConnectDownloadPanel({
  apkAvailable,
  apkSizeMb,
  downloadHref,
  downloadFileName,
  version,
  build,
  packageId,
  minAndroid,
}: Props) {
  return (
    <div className="py-8 space-y-8">
      <header className="text-center space-y-3">
        <div className="mx-auto w-24 h-24 rounded-3xl overflow-hidden shadow-lg ring-1 ring-[var(--sp-border)]">
          <Image
            src={CONNECT_APP.iconPath}
            alt="MernCrest Connect"
            width={96}
            height={96}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <h1 className="text-3xl font-bold font-display">MernCrest Connect</h1>
        <p className="text-[var(--sp-muted)] max-w-lg mx-auto">
          Official staff mobile app for <strong>system.merncrest.lk</strong> — real-time sync with
          the web portal for attendance, live chat, tasks, tickets, and CRM.
        </p>
      </header>

      <section className="stitch-card stitch-card-body space-y-4">
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="stitch-chip">Android APK</span>
          <span className="stitch-chip">v{version} (build {build})</span>
          {apkSizeMb ? <span className="stitch-chip">{apkSizeMb} MB</span> : null}
          <span className="stitch-chip">Android {minAndroid}+</span>
        </div>

        {apkAvailable ? (
          <a
            href={downloadHref}
            download={downloadFileName}
            className="stitch-btn stitch-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Android APK
          </a>
        ) : (
          <p className="text-sm text-amber-600">
            APK is being prepared. Run <code className="text-xs">flutter build apk</code> and deploy
            to <code className="text-xs">public/downloads/</code>.
          </p>
        )}

        <p className="text-xs text-[var(--sp-muted)] font-mono">{packageId}</p>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Wifi, title: "Real-time sync", text: "Instant updates with system.merncrest.lk" },
          { icon: Shield, title: "Enterprise secure", text: "Cloudflare check + staff session" },
          { icon: Smartphone, title: "Staff only", text: "Use your MernCrest work email to sign in" },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="stitch-card stitch-card-body text-center space-y-2">
            <Icon className="h-6 w-6 mx-auto text-[var(--sp-primary)]" />
            <h2 className="font-semibold text-sm">{title}</h2>
            <p className="text-xs text-[var(--sp-muted)]">{text}</p>
          </div>
        ))}
      </section>

      <section className="stitch-card stitch-card-body space-y-3">
        <h2 className="font-semibold">Install steps</h2>
        <ol className="list-decimal list-inside text-sm text-[var(--sp-muted)] space-y-2">
          <li>Download the APK to your Android phone.</li>
          <li>Open the file and allow install from this source if prompted.</li>
          <li>Sign in with <strong>staff@merncrest.lk</strong> (your work email).</li>
          <li>Complete the Cloudflare security check on login.</li>
        </ol>
      </section>
    </div>
  );
}
