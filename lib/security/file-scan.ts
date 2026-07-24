import { createHash } from "crypto";

/** Allowed chat upload MIME types → file extension. */
export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/** Leading magic-byte signatures used to detect type spoofing. */
const SIGNATURES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
};

export type ScanResult = { ok: true } | { ok: false; reason: string };

function matchesSignature(buf: Buffer, mime: string): boolean {
  const sig = SIGNATURES[mime];
  if (!sig || buf.length < sig.length) return false;
  return sig.every((b, i) => buf[i] === b);
}

/**
 * Security-scan an uploaded chat attachment.
 * Layers: type allow-list → magic-byte anti-spoofing → executable block →
 * active-content heuristics (PDF JS/launch, image polyglots) →
 * optional VirusTotal reputation lookup (if VIRUSTOTAL_API_KEY is set).
 */
export async function scanUpload(buf: Buffer, mime: string): Promise<ScanResult> {
  if (!ALLOWED_UPLOAD_TYPES[mime]) {
    return { ok: false, reason: "Only JPG, PNG, or PDF files are allowed." };
  }
  if (buf.length === 0) return { ok: false, reason: "The file is empty." };
  if (buf.length > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: "File exceeds the 10 MB limit." };
  }

  // 1) Magic-byte check — prevents renamed/spoofed files.
  if (!matchesSignature(buf, mime)) {
    return { ok: false, reason: "File content doesn't match its type (possible spoofing)." };
  }

  // 2) Block native executables outright (MZ = Windows PE, 0x7F ELF = Unix).
  if (buf[0] === 0x4d && buf[1] === 0x5a) {
    return { ok: false, reason: "Executable files are not allowed." };
  }
  if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) {
    return { ok: false, reason: "Executable files are not allowed." };
  }

  // 3) Active/embedded content heuristics.
  const head = buf.subarray(0, Math.min(buf.length, 3_000_000)).toString("latin1");
  if (mime === "application/pdf") {
    const danger = ["/JavaScript", "/JS", "/Launch", "/EmbeddedFile", "/OpenAction", "/AA"];
    if (danger.some((d) => head.includes(d))) {
      return {
        ok: false,
        reason: "This PDF contains active or embedded content and was blocked for security.",
      };
    }
  } else {
    const lower = head.toLowerCase();
    const danger = ["<script", "<?php", "<%", "#!/bin/"];
    if (danger.some((d) => lower.includes(d))) {
      return { ok: false, reason: "The image contains suspicious embedded code and was blocked." };
    }
  }

  // 4) Optional real-time AV reputation via VirusTotal (best-effort, by hash).
  const vtKey = process.env.VIRUSTOTAL_API_KEY;
  if (vtKey) {
    try {
      const sha256 = createHash("sha256").update(buf).digest("hex");
      const res = await fetch(`https://www.virustotal.com/api/v3/files/${sha256}`, {
        headers: { "x-apikey": vtKey },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const stats = data?.data?.attributes?.last_analysis_stats;
        if (stats && (stats.malicious > 0 || stats.suspicious > 2)) {
          return { ok: false, reason: "Security scan flagged this file as unsafe." };
        }
      }
    } catch {
      // VirusTotal is a best-effort enhancement; heuristic checks already passed.
    }
  }

  return { ok: true };
}
