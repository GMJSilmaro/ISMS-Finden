import type { DeliveryFrequency } from "@prisma/client";

import { deliveriesPerMonthFromFrequency } from "@/features/demand-planning/engine/frequency";
import type { DemandSkuInput } from "@/features/demand-planning/engine/types";
import { reasonStatusRepository } from "@/features/reason-status/repositories/reason-status.repository";
import { prisma } from "@/lib/database/client";

export interface DemandSourceWindow {
  salesPeriodStart: Date;
  salesPeriodEnd: Date;
  historyStart: Date;
  historyEnd: Date;
}

export interface BranchDemandSources {
  branchId: string;
  branchName: string;
  dealerName: string | null;
  deliveryFrequencyPerMonth: number;
  frequencyCode: string | null;
  revenueTargetPhp: number | null;
  skus: DemandSkuInput[];
  stamps: {
    historySkuCount: number;
    historyPhp: number;
    planogramSkuCount: number;
    forecastUnits: number;
    forecastPhp: number;
    onHandUnits: number;
    onHandPhp: number;
    displayUnits: number;
  };
}

function seriesFromModel(skuCode: string, seriesCode: string | null | undefined): string {
  if (seriesCode && seriesCode.trim()) return seriesCode.trim();
  return skuCode.slice(0, Math.min(5, skuCode.length));
}

function toNumber(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

/**
 * Load live ISMS inputs for one or more branches for the Demand Planning engine.
 * On-hand = STK serial count only (excludes in-transit / reserved).
 * History = 3-month average of Sold + Official Sold line qty & ₱.
 */
export async function loadBranchDemandSources(
  tenantId: string,
  branchIds: string[],
  periodId: string | null,
  window: DemandSourceWindow,
): Promise<BranchDemandSources[]> {
  if (branchIds.length === 0) return [];

  const [
    branches,
    planograms,
    models,
    stkCodeId,
    sldCodeId,
    ofsCodeId,
    displayUnits,
    skuForecasts,
    revenueTargets,
  ] = await Promise.all([
    prisma.branch.findMany({
      where: { tenantId, id: { in: branchIds }, deletedAt: null },
      select: {
        id: true,
        name: true,
        dealer: { select: { name: true } },
        deliveryScheduleConfig: {
          select: {
            frequencyCode: { select: { code: true, frequency: true } },
          },
        },
      },
    }),
    prisma.branchPlanogram.findMany({
      where: { tenantId, branchId: { in: branchIds } },
      select: { branchId: true, modelId: true },
    }),
    prisma.productModel.findMany({
      where: { tenantId, status: "active" },
      select: {
        id: true,
        skuCode: true,
        srp: true,
        series: { select: { code: true } },
      },
    }),
    reasonStatusRepository.findCodeId(tenantId, "inventory_system", "STK"),
    reasonStatusRepository.findCodeId(tenantId, "sales_atr", "SLD"),
    reasonStatusRepository.findCodeId(tenantId, "sales_atr", "OFS"),
    prisma.branchDisplayUnit.findMany({
      where: { tenantId, branchId: { in: branchIds } },
      select: { branchId: true, modelId: true, qty: true },
    }),
    periodId
      ? prisma.branchSkuForecast.findMany({
          where: { tenantId, periodId, branchId: { in: branchIds } },
          select: { branchId: true, modelId: true, forecastQty: true },
        })
      : Promise.resolve([]),
    periodId
      ? prisma.branchForecastTarget.findMany({
          where: { tenantId, periodId, branchId: { in: branchIds } },
          select: { branchId: true, revenueTarget: true },
        })
      : Promise.resolve([]),
  ]);

  const modelById = new Map(models.map((m) => [m.id, m]));
  const planogramSet = new Set(planograms.map((p) => `${p.branchId}:${p.modelId}`));
  const duMap = new Map(displayUnits.map((d) => [`${d.branchId}:${d.modelId}`, d.qty]));
  const fcMap = new Map(
    skuForecasts.map((f) => [`${f.branchId}:${f.modelId}`, f.forecastQty]),
  );
  const revenueMap = new Map(
    revenueTargets.map((t) => [t.branchId, toNumber(t.revenueTarget)]),
  );

  // History: average monthly sold qty/₱ over the history window.
  const soldCodeIds = [sldCodeId?.id, ofsCodeId?.id].filter(Boolean) as string[];
  const historyByBranchModel = new Map<string, { qty: number; php: number }>();
  if (soldCodeIds.length > 0) {
    const details = await prisma.branchSalesTransactionDetail.findMany({
      where: {
        modelId: { not: null },
        statusCodeId: { in: soldCodeIds },
        sale: {
          tenantId,
          branchId: { in: branchIds },
          transactionDate: {
            gte: window.historyStart,
            lte: window.historyEnd,
          },
        },
      },
      select: {
        modelId: true,
        saleAmount: true,
        amount: true,
        modelPrice: true,
        sale: { select: { branchId: true } },
      },
    });

    const months = Math.max(
      1,
      (window.historyEnd.getUTCFullYear() - window.historyStart.getUTCFullYear()) * 12 +
        (window.historyEnd.getUTCMonth() - window.historyStart.getUTCMonth()) +
        1,
    );

    for (const d of details) {
      if (!d.modelId) continue;
      const key = `${d.sale.branchId}:${d.modelId}`;
      const php = toNumber(d.saleAmount ?? d.amount ?? d.modelPrice);
      const cur = historyByBranchModel.get(key) ?? { qty: 0, php: 0 };
      cur.qty += 1;
      cur.php += php;
      historyByBranchModel.set(key, cur);
    }

    for (const [key, cur] of historyByBranchModel) {
      historyByBranchModel.set(key, {
        qty: cur.qty / months,
        php: cur.php / months,
      });
    }
  }

  // On-hand STK counts per branch×model (via serial → model)
  const stockByPair = new Map<string, number>();
  if (stkCodeId?.id) {
    const stocks = await prisma.branchInventory.findMany({
      where: {
        tenantId,
        branchId: { in: branchIds },
        statusCodeId: stkCodeId.id,
      },
      select: {
        branchId: true,
        serialNumber: { select: { modelId: true } },
      },
    });
    for (const row of stocks) {
      const key = `${row.branchId}:${row.serialNumber.modelId}`;
      stockByPair.set(key, (stockByPair.get(key) ?? 0) + 1);
    }
  }

  // Candidate SKUs per branch: union of planogram + history + forecast for that branch
  const result: BranchDemandSources[] = [];

  for (const branch of branches) {
    const freqEnum = branch.deliveryScheduleConfig?.frequencyCode.frequency as
      | DeliveryFrequency
      | undefined;
    const deliveryFrequencyPerMonth = freqEnum
      ? deliveriesPerMonthFromFrequency(freqEnum)
      : 4;

    const modelIds = new Set<string>();
    for (const p of planograms) {
      if (p.branchId === branch.id) modelIds.add(p.modelId);
    }
    for (const [key] of historyByBranchModel) {
      if (key.startsWith(`${branch.id}:`)) {
        modelIds.add(key.slice(branch.id.length + 1));
      }
    }
    for (const [key] of fcMap) {
      if (key.startsWith(`${branch.id}:`)) {
        modelIds.add(key.slice(branch.id.length + 1));
      }
    }

    const skus: DemandSkuInput[] = [];
    let historyPhp = 0;
    let forecastUnits = 0;
    let forecastPhp = 0;
    let onHandUnits = 0;
    let onHandPhp = 0;
    let displayUnitsTotal = 0;
    let historySkuCount = 0;
    let planogramSkuCount = 0;

    for (const modelId of modelIds) {
      const model = modelById.get(modelId);
      if (!model) continue;
      const key = `${branch.id}:${modelId}`;
      const hist = historyByBranchModel.get(key) ?? { qty: 0, php: 0 };
      const srp = toNumber(model.srp);
      const onPlanogram = planogramSet.has(key);
      if (onPlanogram) planogramSkuCount += 1;
      if (hist.qty > 0) historySkuCount += 1;

      const forecastQty = fcMap.get(key) ?? 0;
      const du = duMap.get(key) ?? 0;
      const onHand = stockByPair.get(key) ?? 0;
      const isFreeOrBundle = srp <= 0 && hist.qty > 0;

      skus.push({
        modelId,
        skuCode: model.skuCode,
        seriesCode: seriesFromModel(model.skuCode, model.series?.code),
        srp,
        onPlanogram,
        isFreeOrBundle,
        historyQty: hist.qty,
        historyPhp: hist.php,
        displayUnits: du,
        onHand,
        forecastQty,
      });

      if (!isFreeOrBundle) historyPhp += hist.php;
      forecastUnits += forecastQty;
      forecastPhp += forecastQty * srp;
      onHandUnits += onHand;
      onHandPhp += onHand * srp;
      displayUnitsTotal += du;
    }

    skus.sort((a, b) => a.skuCode.localeCompare(b.skuCode));

    result.push({
      branchId: branch.id,
      branchName: branch.name,
      dealerName: branch.dealer?.name ?? null,
      deliveryFrequencyPerMonth,
      frequencyCode: branch.deliveryScheduleConfig?.frequencyCode.code ?? null,
      revenueTargetPhp: revenueMap.get(branch.id) ?? null,
      skus,
      stamps: {
        historySkuCount,
        historyPhp,
        planogramSkuCount,
        forecastUnits,
        forecastPhp,
        onHandUnits,
        onHandPhp,
        displayUnits: displayUnitsTotal,
      },
    });
  }

  return result;
}
