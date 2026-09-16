import { z } from "zod";

export const createDemandPlanDraftSchema = z.object({
  name: z.string().min(1).max(120),
  salesPeriodLabel: z.string().min(1).max(40),
  branchIds: z.array(z.string().min(1)).min(1),
  periodId: z.string().optional().nullable(),
  deliveryFrequencyPerMonth: z.number().positive().max(31).optional().nullable(),
  monthBasisDays: z.number().positive().max(31).optional(),
  deriveQuotaFromForecast: z.boolean().optional(),
  quotaOverridePhp: z.number().nonnegative().optional().nullable(),
  floorAllocationAtZero: z.boolean().optional(),
  roundUpSlowMovers: z.boolean().optional(),
  origin: z.enum(["wizard", "workbench", "mid_cycle"]).optional(),
});

export const updateDemandPlanLineSchema = z.object({
  runId: z.string().min(1),
  lineId: z.string().min(1),
  displayUnits: z.number().int().nonnegative().optional(),
  forecastQty: z.number().int().nonnegative().optional(),
});

export const workbenchSendSchema = z.object({
  branchId: z.string().min(1),
  salesPeriodLabel: z.string().min(1),
  releasedRunId: z.string().optional().nullable(),
  submitForReview: z.boolean().optional(),
  lines: z
    .array(
      z.object({
        modelId: z.string().min(1),
        quantity: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

export const skuForecastImportRowSchema = z.object({
  period: z.string().min(1),
  sapCode: z.string().min(1),
  sku: z.string().min(1),
  forecastQty: z.number().int().nonnegative(),
});

export const SKU_FORECAST_SHEET_NAME = "SkuForecast";
export const SKU_FORECAST_SHEET_HEADERS = [
  "period",
  "sap_code",
  "sku",
  "forecast_qty",
  "branch_name",
  "model_name",
] as const;
