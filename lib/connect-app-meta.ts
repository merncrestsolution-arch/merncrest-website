import type { Metadata } from "next";

/** MernCrest Connect Android APK metadata (keep in sync with merncrest-connect/pubspec.yaml). */
export const CONNECT_APP = {
  name: "MernCrest Connect",
  tagline: "Staff mobile app for system.merncrest.lk",
  version: "1.0.8",
  build: 9,
  packageId: "lk.merncrest.merncrest_connect",
  minAndroid: "6.0",
  apkPath: "/downloads/merncrest-connect.apk",
  iconPath: "/downloads/connect-icon.png",
  apiHost: "https://system.merncrest.lk",
  forceUpdate: false,
  releaseNotes: [
    "Finance: view invoices, payments & receipts in-app (no download required)",
    "Record client payments and create invoices from Client 360",
    "Add services & projects for clients from mobile",
    "Finance summary reports and payslip viewer in-app",
    "Light theme fixed — readable cards, text, and navigation",
    "Billing PDF/receipt share optional from document viewer",
  ],
} as const;

export function connectApkFileName() {
  return `merncrest-connect-v${CONNECT_APP.version}.apk`;
}
