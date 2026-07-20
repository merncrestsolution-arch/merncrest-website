import { NextResponse } from "next/server";
import { recommendHosting, type HostingNeed } from "@/lib/hosting/recommend";
import { z } from "zod";

const schema = z.object({
  description: z.string().min(3).max(2000),
  projectType: z.string().optional(),
  visitors: z.union([z.string(), z.number()]).optional(),
  storageGb: z.union([z.string(), z.number()]).optional(),
  needsEmail: z.boolean().optional(),
  needsSsl: z.boolean().optional(),
  budgetCents: z.number().int().optional(),
});

/** AI hosting recommendation from synced provider packages */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Describe your project (at least 3 characters)" },
        { status: 400 }
      );
    }

    const need: HostingNeed = parsed.data;
    const result = await recommendHosting(need);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[hosting:recommend]", error);
    return NextResponse.json({ error: "Recommendation failed" }, { status: 500 });
  }
}
