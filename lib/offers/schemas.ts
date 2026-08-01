import { z } from "zod";

export const offerStatusEnum = z.enum(["DRAFT", "PUBLISHED", "EXPIRED"]);
export const gradientThemeEnum = z.enum(["blue", "purple", "green"]);

export const offerUpsertSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  price: z.string().max(120).optional().nullable(),
  badge: z.string().max(60).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  imageUrl: z.string().max(2000).optional().nullable(),
  bannerImageUrl: z.string().max(2000).optional().nullable(),
  featuresJson: z.string().optional().nullable(),
  gradientTheme: gradientThemeEnum.optional(),
  ctaText: z.string().max(60).optional(),
  ctaUrl: z.string().max(500).optional().nullable(),
  priority: z.number().int().min(0).max(9999).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isEnabled: z.boolean().optional(),
  status: offerStatusEnum.optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
});

export const offerUpdateSchema = offerUpsertSchema.partial().extend({
  id: z.string(),
});

export type OfferUpsertInput = z.infer<typeof offerUpsertSchema>;
