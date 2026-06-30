import { z } from "zod";

export const lifecycleStages = [
  "A1-A3",
  "A4",
  "A5",
  "B1",
  "B2",
  "B3",
  "B4",
  "B5",
  "B6",
  "B7",
  "C1",
  "C2",
  "C3",
  "C4",
  "D"
] as const;

export type LifecycleStage = (typeof lifecycleStages)[number];

export const stageStatusSchema = z.enum([
  "declared",
  "not_declared",
  "not_applicable",
  "unclear"
]);

export const provenanceSchema = z.object({
  sourcePdf: z.string().min(1),
  page: z.number().int().positive(),
  tableOrSection: z.string().min(1),
  excerpt: z.string().min(1),
  extractionMethod: z.enum(["pdftotext", "visual_review", "manual_cross_check"]),
  confidence: z.enum(["high", "medium", "low"]),
  annotation: z
    .object({
      left: z.number(),
      top: z.number(),
      width: z.number(),
      height: z.number()
    })
    .optional(),
  notes: z.string().optional()
});

export const carbonFigureSchema = z.object({
  stage: z.enum(lifecycleStages),
  status: stageStatusSchema,
  value: z.number().nullable(),
  unit: z.string(),
  provenance: provenanceSchema.nullable()
});

export const epdProductSchema = z.object({
  id: z.string().min(1),
  sourcePdf: z.string().min(1),
  epdNumber: z.string().optional(),
  supplier: z.string().min(1),
  productName: z.string().min(1),
  productType: z.string().min(1),
  declaredUnit: z.string().min(1),
  declaredUnitMassKg: z.number().nullable(),
  compressiveStrength: z
    .object({
      value: z.number().nullable(),
      unit: z.literal("MPa"),
      status: stageStatusSchema,
      notes: z.string().optional()
    })
    .nullable(),
  manufacturingLocation: z.object({
    country: z.string().min(1),
    region: z.string().min(1),
    site: z.string().optional()
  }),
  lifecycleScope: z.string().min(1),
  comparabilityNotes: z.array(z.string()),
  carbon: z.array(carbonFigureSchema).length(lifecycleStages.length),
  extractedAt: z.string().datetime()
});

export type EpdProduct = z.infer<typeof epdProductSchema>;
export type CarbonFigure = z.infer<typeof carbonFigureSchema>;
