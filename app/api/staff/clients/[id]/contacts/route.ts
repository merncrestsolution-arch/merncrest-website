import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";

const contactSchema = z.object({
  name: z.string().min(1).max(160),
  role: z.string().max(80).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  isPrimary: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const profile = await prisma.customerProfile.findFirst({
    where: {
      OR: [{ id }, { userId: id }, { customerCode: id }],
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!profile) {
    return apiError("NOT_FOUND", "Client not found", 404);
  }

  const contacts = await prisma.clientContact.findMany({
    where: { profileId: profile.id, deletedAt: null },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });

  return apiSuccess(contacts);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const profile = await prisma.customerProfile.findFirst({
    where: {
      OR: [{ id }, { userId: id }, { customerCode: id }],
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!profile) {
    return apiError("NOT_FOUND", "Client not found", 404);
  }

  if (parsed.data.isPrimary) {
    await prisma.clientContact.updateMany({
      where: { profileId: profile.id, deletedAt: null },
      data: { isPrimary: false, updatedBy: auth.user.id },
    });
  }

  const contact = await prisma.clientContact.create({
    data: {
      profileId: profile.id,
      name: parsed.data.name,
      role: parsed.data.role || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      isPrimary: parsed.data.isPrimary ?? false,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    },
  });

  return apiSuccess(contact, undefined, 201);
}
