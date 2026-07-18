import { NextResponse } from "next/server";
import { searchDomainAvailability } from "@/lib/domains/registry";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") || "";
  const result = searchDomainAvailability(q);
  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
