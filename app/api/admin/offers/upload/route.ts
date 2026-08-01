import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requirePermission } from "@/lib/erp/permissions";
import { scanUpload } from "@/lib/security/file-scan";
import { rateLimit, clientIp } from "@/lib/chat/rate-limit";

export const runtime = "nodejs";

const OFFER_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload offer card image or banner (JPG/PNG/WebP, max 5 MB). */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit({ key: `offers:upload:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }

  const auth = await requirePermission("website.offers.manage");
  if (auth.error) return auth.error;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const file = form.get("file");
  const kind = form.get("kind") === "banner" ? "banner" : "image";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 413 });
  }

  const ext = OFFER_IMAGE_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Only JPG or PNG images are allowed" },
      { status: 415 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const scan = await scanUpload(buf, file.type);
  if (!scan.ok) {
    return NextResponse.json({ error: scan.reason }, { status: 422 });
  }

  const filename = `${kind}-${randomUUID()}.${ext}`;
  const subdir = kind === "banner" ? "banners" : "cards";

  try {
    const dir = path.join(process.cwd(), "public", "uploads", "offers", subdir);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buf);
  } catch {
    return NextResponse.json({ error: "Could not store file" }, { status: 500 });
  }

  const url = `/uploads/offers/${subdir}/${filename}`;
  return NextResponse.json({ ok: true, url, filename, kind });
}
