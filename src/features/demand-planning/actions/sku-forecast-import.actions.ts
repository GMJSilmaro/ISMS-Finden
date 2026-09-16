"use server";

import { revalidatePath } from "next/cache";

import { skuForecastImportService } from "@/features/demand-planning/services/sku-forecast-import.service";
import { requireAnyPermission } from "@/lib/auth/permissions";

async function requireForecastManage() {
  return requireAnyPermission(["forecast.manage", "planogram.manage"]);
}

export async function downloadSkuForecastTemplateAction(periodLabel?: string) {
  const session = await requireForecastManage();
  const buffer = await skuForecastImportService.buildTemplate(
    session.user.tenantId,
    periodLabel,
  );
  return {
    fileName: `sku-forecast-template.xlsx`,
    base64: buffer.toString("base64"),
  };
}

export async function importSkuForecastAction(formData: FormData) {
  const session = await requireForecastManage();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false as const, error: "Choose an Excel file" };
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await skuForecastImportService.applyWorkbook(
      session.user.tenantId,
      buffer,
    );
    revalidatePath("/settings/planning");
    revalidatePath("/orders/demand-planning");
    revalidatePath("/orders/replenishment");
    return { ok: true as const, ...result };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Import failed",
    };
  }
}
