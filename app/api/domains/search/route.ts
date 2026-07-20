import { NextResponse } from "next/server";
import { searchDomainAvailabilityAsync } from "@/lib/domains/registry";

/** Domain search via Reseller Provider API + Pricing Engine. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") || "";
  const result = await searchDomainAvailabilityAsync(q);
  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
