import type { Metadata } from "next";

/** MernCrest Connect Android APK metadata (keep in sync with merncrest-connect/pubspec.yaml). */
export const CONNECT_APP = {
  name: "MernCrest Connect",
  tagline: "Staff mobile app for system.merncrest.lk",
  version: "1.0.10",
  build: 11,
  packageId: "lk.merncrest.merncrest_connect",
  minAndroid: "6.0",
  apkPath: "/downloads/merncrest-connect.apk",
  iconPath: "/downloads/connect-icon.png",
  apiHost: "https://system.merncrest.lk",
  forceUpdate: false,
  releaseNotes: [
    "Finance loads invoices even when payments list is restricted",
    "Clients list uses staff API with outstanding balances on each row",
    "Dashboard and projects load independently — partial data instead of blank screens",
    "CRM/Clients navigation opens client list; domains, hosting, DNS, monitoring routes work",
    "Client detail shows due amounts on invoice rows",
  ],
} as const;

export function connectApkFileName() {
  return `merncrest-connect-v${CONNECT_APP.version}.apk`;
}
