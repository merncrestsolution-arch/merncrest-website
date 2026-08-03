import type { Metadata } from "next";

/** MernCrest Connect Android APK metadata (keep in sync with merncrest-connect/pubspec.yaml). */
export const CONNECT_APP = {
  name: "MernCrest Connect",
  tagline: "Staff mobile app for system.merncrest.lk",
  version: "1.0.5",
  build: 6,
  packageId: "lk.merncrest.merncrest_connect",
  minAndroid: "6.0",
  apkPath: "/downloads/merncrest-connect.apk",
  iconPath: "/downloads/connect-icon.png",
  apiHost: "https://system.merncrest.lk",
  forceUpdate: false,
  releaseNotes: [
    "Complete dark enterprise UI redesign",
    "Matches system.merncrest.lk Luminous Enterprise theme",
    "New login, dashboard, navigation, and module screens",
  ],
} as const;

export function connectApkFileName() {
  return `merncrest-connect-v${CONNECT_APP.version}.apk`;
}
