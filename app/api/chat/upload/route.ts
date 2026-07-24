import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  scanUpload,
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/security/file-scan";

export const runtime = "nodejs";

/** Accepts a single chat attachment (JPG/PNG/PDF), security-scans it, and stores it. */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid upload request." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: "File exceeds the 10 MB limit." }, { status: 413 });
  }
  const ext = ALLOWED_UPLOAD_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { ok: false, error: "Only JPG, PNG, or PDF files are allowed." },
      { status: 415 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  const scan = await scanUpload(buf, file.type);
  if (!scan.ok) {
    return NextResponse.json({ ok: false, scan: "blocked", error: scan.reason }, { status: 422 });
  }

  const filename = `${randomUUID()}.${ext}`;
  try {
    const dir = path.join(process.cwd(), "public", "uploads", "chat");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buf);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not store the file. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    scan: "clean",
    name: file.name,
    url: `/uploads/chat/${filename}`,
    size: file.size,
    type: file.type,
  });
}
