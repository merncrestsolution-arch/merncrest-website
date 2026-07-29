/**
 * Shared upload allow-list and size limits for DMS, chat, and ticket attachments.
 * Malware scanning: heuristic scanUpload() for binary uploads; VirusTotal optional.
 */

export const DMS_ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"] as const;

export const DMS_ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "image/png": "png",
  "image/jpeg": "jpg",
};

export const TICKET_ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
  "text/plain": "txt",
};

export const DMS_MAX_BYTES = 25 * 1024 * 1024;
export const TICKET_MAX_BYTES = 10 * 1024 * 1024;

export type UrlValidationResult = { ok: true } | { ok: false; reason: string };

function extensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url, "https://placeholder.local").pathname;
    const dot = pathname.lastIndexOf(".");
    return dot >= 0 ? pathname.slice(dot).toLowerCase() : "";
  } catch {
    const dot = url.lastIndexOf(".");
    return dot >= 0 ? url.slice(dot).toLowerCase() : "";
  }
}

/** Validate a pre-hosted file URL for DMS document uploads. */
export function validateDmsFileUrl(fileUrl: string): UrlValidationResult {
  if (!fileUrl.trim()) return { ok: false, reason: "fileUrl is required" };
  if (fileUrl.startsWith("data:")) {
    return { ok: false, reason: "Inline data URLs are not allowed for DMS — use a hosted file URL." };
  }
  const ext = extensionFromUrl(fileUrl);
  if (!ext || !(DMS_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return {
      ok: false,
      reason: `DMS allows only: ${DMS_ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }
  return { ok: true };
}

/** Validate chat/ticket attachment URLs (pre-hosted files from /api/chat/upload). */
export function validateChatAttachmentUrl(url: string): UrlValidationResult {
  if (!url.trim()) return { ok: false, reason: "attachmentUrl is required" };
  if (url.startsWith("data:")) {
    return { ok: false, reason: "Inline data URLs are not allowed — upload via /api/chat/upload first." };
  }
  const ext = extensionFromUrl(url);
  const allowed = [".pdf", ".png", ".jpg", ".jpeg"];
  if (!ext || !allowed.includes(ext)) {
    return { ok: false, reason: "Attachments: PDF, PNG, or JPG only." };
  }
  return { ok: true };
}

/** Validate ticket attachment URL (portal / staff). */
export function validateTicketAttachmentUrl(url: string): UrlValidationResult {
  if (!url.trim()) return { ok: false, reason: "attachmentUrl is required" };
  const ext = extensionFromUrl(url);
  const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".txt"];
  if (!ext || !allowed.includes(ext)) {
    return { ok: false, reason: "Ticket attachments: PDF, PNG, JPG, or TXT only." };
  }
  return { ok: true };
}
