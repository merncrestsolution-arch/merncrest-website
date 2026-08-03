import { setRequestLocale } from "next-intl/server";
import { existsSync, statSync } from "fs";
import path from "path";
import { CONNECT_APP, connectApkFileName } from "@/lib/connect-app-meta";
import { ConnectDownloadPanel } from "@/components/system/connect-download-panel";

export const metadata = {
  title: "Download MernCrest Connect | system.merncrest.lk",
  description:
    "Download the official MernCrest Connect Android app for staff — attendance, live chat, CRM, tasks, and more.",
};

function apkMeta() {
  const filePath = path.join(process.cwd(), "public", "downloads", "merncrest-connect.apk");
  if (!existsSync(filePath)) {
    return { available: false as const, sizeMb: null };
  }
  const bytes = statSync(filePath).size;
  return { available: true as const, sizeMb: (bytes / (1024 * 1024)).toFixed(1) };
}

export default async function SystemDownloadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const apk = apkMeta();

  return (
    <ConnectDownloadPanel
      apkAvailable={apk.available}
      apkSizeMb={apk.sizeMb}
      downloadHref={CONNECT_APP.apkPath}
      downloadFileName={connectApkFileName()}
      version={CONNECT_APP.version}
      build={CONNECT_APP.build}
      packageId={CONNECT_APP.packageId}
      minAndroid={CONNECT_APP.minAndroid}
    />
  );
}
