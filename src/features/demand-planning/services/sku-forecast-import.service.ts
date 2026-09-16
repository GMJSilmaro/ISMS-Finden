import ExcelJS from "exceljs";

import {
  SKU_FORECAST_SHEET_HEADERS,
  SKU_FORECAST_SHEET_NAME,
} from "@/features/demand-planning/schemas/demand-planning.schema";
import { demandPlanningRepository } from "@/features/demand-planning/repositories/demand-planning.repository";
import { prisma } from "@/lib/database/client";
import { normalizeHeader } from "@/lib/shared/parse-csv";

function cellToString(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("result" in value && value.result != null) return cellToString(value.result as ExcelJS.CellValue);
    if ("text" in value && typeof value.text === "string") return value.text.trim();
  }
  return "";
}

/**
 * Import per-SKU SFE forecast: period, sap_code, sku, forecast_qty.
 * Creates/activates the planning period and upserts BranchSkuForecast rows.
 */
export const skuForecastImportService = {
  async buildTemplate(tenantId: string, periodLabel?: string) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(SKU_FORECAST_SHEET_NAME);
    sheet.addRow([...SKU_FORECAST_SHEET_HEADERS]);

    const period =
      periodLabel ??
      (
        await prisma.planningPeriod.findFirst({
          where: { tenantId, isActive: true },
          select: { label: true },
        })
      )?.label ??
      new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

    const existing = await prisma.branchSkuForecast.findMany({
      where: { tenantId, period: { label: period } },
      include: {
        branch: { select: { sapCode: true, name: true } },
        model: { select: { skuCode: true, name: true } },
      },
      take: 5000,
    });

    for (const row of existing) {
      sheet.addRow([
        period,
        row.branch.sapCode,
        row.model.skuCode,
        row.forecastQty,
        row.branch.name,
        row.model.name,
      ]);
    }

    if (existing.length === 0) {
      sheet.addRow([period, "BR001", "55UHW201", 90, "Sample branch", "Sample model"]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  },

  async applyWorkbook(tenantId: string, file: ArrayBuffer | Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file as ExcelJS.Buffer);
    const sheet = workbook.getWorksheet(SKU_FORECAST_SHEET_NAME) ?? workbook.worksheets[0];
    if (!sheet) throw new Error("Workbook has no sheets");

    let headers: string[] = [];
    const rows: { period: string; sapCode: string; sku: string; forecastQty: number }[] = [];

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        cells[col - 1] = cellToString(cell.value);
      });
      if (rowNumber === 1) {
        headers = cells.map((c) => normalizeHeader(c));
        return;
      }
      const get = (key: string) => {
        const idx = headers.findIndex((h) => h === key || h.replace(/_/g, "") === key.replace(/_/g, ""));
        return idx >= 0 ? (cells[idx] ?? "") : "";
      };
      const period = get("period");
      const sapCode = get("sapcode") || get("sap_code");
      const sku = get("sku") || get("skucode") || get("model");
      const qtyRaw = get("forecastqty") || get("forecast_qty") || get("qty");
      const forecastQty = Number(qtyRaw);
      if (!period || !sapCode || !sku || !Number.isFinite(forecastQty)) return;
      rows.push({ period, sapCode, sku, forecastQty: Math.max(0, Math.trunc(forecastQty)) });
    });

    if (rows.length === 0) throw new Error("No SkuForecast rows found");

    const periodLabel = rows[0]!.period;
    let period = await prisma.planningPeriod.findFirst({
      where: { tenantId, label: periodLabel },
    });
    if (!period) {
      period = await prisma.planningPeriod.create({
        data: { tenantId, label: periodLabel, isActive: true },
      });
    }
    await prisma.planningPeriod.updateMany({
      where: { tenantId, id: { not: period.id } },
      data: { isActive: false },
    });
    await prisma.planningPeriod.update({
      where: { id: period.id },
      data: { isActive: true },
    });

    const branches = await prisma.branch.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, sapCode: true },
    });
    const models = await prisma.productModel.findMany({
      where: { tenantId },
      select: { id: true, skuCode: true },
    });
    const branchBySap = new Map(branches.map((b) => [b.sapCode.toLowerCase(), b.id]));
    const modelBySku = new Map(models.map((m) => [m.skuCode.toLowerCase(), m.id]));

    let upserted = 0;
    let skipped = 0;
    for (const row of rows) {
      const branchId = branchBySap.get(row.sapCode.toLowerCase());
      const modelId = modelBySku.get(row.sku.toLowerCase());
      if (!branchId || !modelId) {
        skipped += 1;
        continue;
      }
      await demandPlanningRepository.upsertSkuForecast(
        tenantId,
        period.id,
        branchId,
        modelId,
        row.forecastQty,
      );
      upserted += 1;
    }

    return { periodLabel, upserted, skipped, periodId: period.id };
  },
};
