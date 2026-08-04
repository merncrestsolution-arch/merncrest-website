import type { Metadata } from "next";

/** MernCrest Connect Android APK metadata (keep in sync with merncrest-connect/pubspec.yaml). */
export const CONNECT_APP = {
  name: "MernCrest Connect",
  tagline: "Staff mobile app for system.merncrest.lk",
  version: "1.0.9",
  build: 10,
  packageId: "lk.merncrest.merncrest_connect",
  minAndroid: "6.0",
  apkPath: "/downloads/merncrest-connect.apk",
  iconPath: "/downloads/connect-icon.png",
  apiHost: "https://system.merncrest.lk",
  forceUpdate: false,
  releaseNotes: [
    "Sri Lanka time (UTC+5:30) for attendance, calendar, and dashboard",
    "Project hub shows client card and editable service billing cycles",
    "Live sync indicator fixed — online when API works (not SSE-only)",
    "Share invoices/receipts as PDF instead of HTML",
    "Staff can record payments and manage outstanding balances",
    "Finance tab shows due amounts and outstanding summary",
  ],
} as const;

export function connectApkFileName() {
  return `merncrest-connect-v${CONNECT_APP.version}.apk`;
}
