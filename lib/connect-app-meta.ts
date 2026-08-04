import type { Metadata } from "next";

/** MernCrest Connect Android APK metadata (keep in sync with merncrest-connect/pubspec.yaml). */
export const CONNECT_APP = {
  name: "MernCrest Connect",
  tagline: "Staff mobile app for system.merncrest.lk",
  version: "1.0.11",
  build: 12,
  packageId: "lk.merncrest.merncrest_connect",
  minAndroid: "6.0",
  apkPath: "/downloads/merncrest-connect.apk",
  iconPath: "/downloads/connect-icon.png",
  apiHost: "https://system.merncrest.lk",
  forceUpdate: false,
  releaseNotes: [
    "Dead nav routes fixed: training, WhatsApp, live chat, clients tab, projects progress",
    "Hosting uses managed accounts (same as web) plus legacy hosting list",
    "Domains merge managed + customer domains; DNS/access request lists added",
    "WhatsApp CRM inbox and mail platform launcher on mobile",
    "Web clients list aligned to /api/staff/clients with billing summaries",
    "Chat conversation loads messages even if context API fails",
  ],
} as const;

export function connectApkFileName() {
  return `merncrest-connect-v${CONNECT_APP.version}.apk`;
}
