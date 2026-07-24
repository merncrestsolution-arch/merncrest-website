/** Meta Graph API version helpers (no DB imports — safe for gateway). */

export function whatsappApiVersion() {
  return process.env.WHATSAPP_API_VERSION || "v23.0";
}

export function whatsappGraphUrl(path: string) {
  const clean = path.replace(/^\//, "");
  return `https://graph.facebook.com/${whatsappApiVersion()}/${clean}`;
}
