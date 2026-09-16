import { auditService } from "@/features/audit/services/audit.service";
import {
  computeBranchDemand,
  coverageStagesForBranch,
  recomputeWithOverrides,
} from "@/features/demand-planning/engine";
import type { DemandBranchResult } from "@/features/demand-planning/engine/types";
import { demandPlanningRepository } from "@/features/demand-planning/repositories/demand-planning.repository";
import { loadBranchDemandSources } from "@/features/demand-planning/services/demand-planning-sources.service";
import { nextDemandPlanDocumentNumber } from "@/features/demand-planning/utils/next-demand-plan-number";
import { prisma } from "@/lib/database/client";

/** Prisma accepts number | string for Decimal fields on create/update. */
function dec(n: number): number {
  return n;
}

function monthBounds(year: number, monthIndex0: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, monthIndex0, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 0, 23, 59, 59));
  return { start, end };
}

/** Prior three full calendar months ending the month before sales period. */
export function historyWindowForSalesPeriod(salesPeriodStart: Date): {
  historyStart: Date;
  historyEnd: Date;
} {
  const y = salesPeriodStart.getUTCFullYear();
  const m = salesPeriodStart.getUTCMonth();
  const endMonth = m - 1;
  const endYear = endMonth < 0 ? y - 1 : y;
  const endM = (endMonth + 12) % 12;
  const startMonth = endM - 2;
  const startYear = startMonth < 0 ? endYear - 1 : endYear;
  const startM = (startMonth + 12) % 12;
  return {
    historyStart: monthBounds(startYear, startM).start,
    historyEnd: monthBounds(endYear, endM).end,
  };
}

export function parseSalesPeriodLabel(label: string): { start: Date; end: Date; label: string } {
  // Accept "December 2025", "2025-12", "Dec 2025"
  const iso = label.match(/^(\d{4})-(\d{2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]) - 1;
    const { start, end } = monthBounds(year, month);
    const pretty = start.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    return { start, end, label: pretty };
  }

  const parsed = new Date(`${label} 1`);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = parsed.getMonth();
    const { start, end } = monthBounds(year, month);
    const pretty = start.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    return { start, end, label: pretty };
  }

  throw new Error("Sales period must look like \"December 2025\" or \"2025-12\"");
}

export interface CreateDemandPlanDraftInput {
  name: string;
  salesPeriodLabel: string;
  branchIds: string[];
  periodId?: string | null;
  deliveryFrequencyPerMonth?: number | null;
  monthBasisDays?: number;
  deriveQuotaFromForecast?: boolean;
  quotaOverridePhp?: number | null;
  floorAllocationAtZero?: boolean;
  roundUpSlowMovers?: boolean;
  origin?: "wizard" | "workbench" | "mid_cycle";
}

function lineRowsFromBranchResult(
  tenantId: string,
  runId: string,
  branch: DemandBranchResult,
) {
  return branch.lines.map((l) => ({
    tenantId,
    runId,
    branchId: branch.branchId,
    modelId: l.modelId,
    seriesCode: l.seriesCode,
    onPlanogram: l.onPlanogram,
    srp: dec(l.srp),
    historyQty: dec(l.historyQty),
    historyPhp: dec(l.historyPhp),
    hmix: dec(l.hmix),
    adjMix: dec(l.adjMix),
    milQty: l.milQty,
    milPhp: dec(l.milPhp),
    displayUnits: l.displayUnits,
    onHand: l.onHand,
    forecastQty: l.forecastQty,
    forecastPhp: dec(l.forecastPhp),
    allocQty: l.allocQty,
    allocPhp: dec(l.allocPhp),
    cycleQty: l.cycleQty,
    drop1Qty: l.drop1Qty,
    drop1Php: dec(l.drop1Php),
    minLevelDays: dec(l.minLevelDays),
    quotaPhp: dec(l.quotaPhp),
    deliveryFreqMonth: dec(l.deliveryFreqMonth),
  }));
}

export const demandPlanningService = {
  parseSalesPeriodLabel,
  historyWindowForSalesPeriod,

  listRuns: demandPlanningRepository.listRuns,
  findRun: demandPlanningRepository.findRun,

  async createDraft(tenantId: string, userId: string, input: CreateDemandPlanDraftInput) {
    if (!input.branchIds.length) throw new Error("Select at least one branch");

    const period = parseSalesPeriodLabel(input.salesPeriodLabel);
    const history = historyWindowForSalesPeriod(period.start);
    const documentNumber = await nextDemandPlanDocumentNumber(tenantId, period.start);

    let periodId = input.periodId ?? null;
    if (!periodId) {
      const existing = await prisma.planningPeriod.findFirst({
        where: { tenantId, label: period.label },
        select: { id: true },
      });
      if (existing) periodId = existing.id;
      else {
        const created = await prisma.planningPeriod.create({
          data: {
            tenantId,
            label: period.label,
            startDate: period.start,
            endDate: period.end,
            isActive: true,
          },
        });
        // deactivate others
        await prisma.planningPeriod.updateMany({
          where: { tenantId, id: { not: created.id } },
          data: { isActive: false },
        });
        periodId = created.id;
      }
    }

    const run = await demandPlanningRepository.createRun({
      tenant: { connect: { id: tenantId } },
      createdBy: { connect: { id: userId } },
      ...(periodId ? { period: { connect: { id: periodId } } } : {}),
      documentNumber,
      version: 1,
      name: input.name.trim() || `${period.label} replenishment`,
      status: "draft",
      origin: input.origin ?? "wizard",
      salesPeriodLabel: period.label,
      salesPeriodStart: period.start,
      salesPeriodEnd: period.end,
      historyStart: history.historyStart,
      historyEnd: history.historyEnd,
      deliveryFrequencyPerMonth:
        input.deliveryFrequencyPerMonth != null
          ? dec(input.deliveryFrequencyPerMonth)
          : undefined,
      monthBasisDays: dec(input.monthBasisDays ?? 30.5),
      deriveQuotaFromForecast: input.deriveQuotaFromForecast !== false,
      quotaOverridePhp:
        input.quotaOverridePhp != null ? dec(input.quotaOverridePhp) : undefined,
      floorAllocationAtZero: input.floorAllocationAtZero !== false,
      roundUpSlowMovers: input.roundUpSlowMovers !== false,
      sourceSnapshot: { branchIds: input.branchIds },
    });

    await auditService.log({
      tenantId,
      userId,
      action: "demand_planning.draft_created",
      entityType: "DemandPlanningRun",
      entityId: run.id,
      metadata: { documentNumber, branchCount: input.branchIds.length },
    });

    return run;
  },

  async getDataSourceStamps(tenantId: string, runId: string) {
    const run = await demandPlanningRepository.findRun(tenantId, runId);
    if (!run) throw new Error("Demand plan not found");

    const branchIds =
      (run.sourceSnapshot as { branchIds?: string[] } | null)?.branchIds ??
      [...new Set(run.lines.map((l) => l.branchId))];

    const sources = await loadBranchDemandSources(
      tenantId,
      branchIds,
      run.periodId,
      {
        salesPeriodStart: run.salesPeriodStart,
        salesPeriodEnd: run.salesPeriodEnd,
        historyStart: run.historyStart,
        historyEnd: run.historyEnd,
      },
    );

    const totals = sources.reduce(
      (acc, s) => {
        acc.historyPhp += s.stamps.historyPhp;
        acc.historySkuCount += s.stamps.historySkuCount;
        acc.planogramSkuCount += s.stamps.planogramSkuCount;
        acc.forecastUnits += s.stamps.forecastUnits;
        acc.forecastPhp += s.stamps.forecastPhp;
        acc.onHandUnits += s.stamps.onHandUnits;
        acc.onHandPhp += s.stamps.onHandPhp;
        acc.displayUnits += s.stamps.displayUnits;
        return acc;
      },
      {
        historyPhp: 0,
        historySkuCount: 0,
        planogramSkuCount: 0,
        forecastUnits: 0,
        forecastPhp: 0,
        onHandUnits: 0,
        onHandPhp: 0,
        displayUnits: 0,
      },
    );

    return { run, sources, totals };
  },

  async computeAndPersist(tenantId: string, runId: string, userId: string) {
    const run = await demandPlanningRepository.findRun(tenantId, runId);
    if (!run) throw new Error("Demand plan not found");
    if (run.status === "released" || run.status === "superseded") {
      throw new Error("Released plans cannot be recomputed — create a new version");
    }

    const branchIds =
      (run.sourceSnapshot as { branchIds?: string[] } | null)?.branchIds ?? [];
    if (branchIds.length === 0) throw new Error("No branches in scope");

    const sources = await loadBranchDemandSources(
      tenantId,
      branchIds,
      run.periodId,
      {
        salesPeriodStart: run.salesPeriodStart,
        salesPeriodEnd: run.salesPeriodEnd,
        historyStart: run.historyStart,
        historyEnd: run.historyEnd,
      },
    );

    const runFreq =
      run.deliveryFrequencyPerMonth != null
        ? Number(run.deliveryFrequencyPerMonth.toString())
        : null;
    const monthBasis = Number(run.monthBasisDays.toString());
    const allLines: ReturnType<typeof lineRowsFromBranchResult>[number][] = [];
    const branchResults: DemandBranchResult[] = [];

    for (const source of sources) {
      const computed = computeBranchDemand(source.skus, {
        branchId: source.branchId,
        deliveryFrequencyPerMonth: runFreq ?? source.deliveryFrequencyPerMonth,
        monthBasisDays: monthBasis,
        deriveQuotaFromForecast: run.deriveQuotaFromForecast,
        quotaPhp: run.deriveQuotaFromForecast
          ? undefined
          : run.quotaOverridePhp
            ? Number(run.quotaOverridePhp.toString())
            : (source.revenueTargetPhp ?? undefined),
        floorAllocationAtZero: run.floorAllocationAtZero,
        roundUpSlowMovers: run.roundUpSlowMovers,
      });
      branchResults.push(computed);
      allLines.push(...lineRowsFromBranchResult(tenantId, runId, computed));
    }

    await demandPlanningRepository.replaceLines(tenantId, runId, allLines);

    const stamps = {
      branchIds,
      branches: sources.map((s) => ({
        branchId: s.branchId,
        branchName: s.branchName,
        stamps: s.stamps,
        deliveryFrequencyPerMonth: s.deliveryFrequencyPerMonth,
      })),
      computedBranchCount: branchResults.length,
    };

    await prisma.demandPlanningRun.update({
      where: { id: runId },
      data: {
        status: "generated",
        computedAt: new Date(),
        sourceSnapshot: stamps,
      },
    });

    await auditService.log({
      tenantId,
      userId,
      action: "demand_planning.computed",
      entityType: "DemandPlanningRun",
      entityId: runId,
      metadata: { lineCount: allLines.length },
    });

    return demandPlanningRepository.findRun(tenantId, runId);
  },

  async updateLineOverrides(
    tenantId: string,
    runId: string,
    userId: string,
    lineId: string,
    patch: { displayUnits?: number; forecastQty?: number },
  ) {
    const run = await demandPlanningRepository.findRun(tenantId, runId);
    if (!run) throw new Error("Demand plan not found");
    if (run.status === "released" || run.status === "superseded") {
      throw new Error("Cannot edit a released plan");
    }

    const line = run.lines.find((l) => l.id === lineId);
    if (!line) throw new Error("Line not found");

    const logs: { field: string; previousValue: string; newValue: string }[] = [];
    if (patch.displayUnits != null && patch.displayUnits !== line.displayUnits) {
      logs.push({
        field: "displayUnits",
        previousValue: String(line.displayUnits),
        newValue: String(patch.displayUnits),
      });
      await demandPlanningRepository.upsertDisplayUnit(
        tenantId,
        line.branchId,
        line.modelId,
        patch.displayUnits,
      );
    }
    if (patch.forecastQty != null && patch.forecastQty !== line.forecastQty) {
      logs.push({
        field: "forecastQty",
        previousValue: String(line.forecastQty),
        newValue: String(patch.forecastQty),
      });
      if (run.periodId) {
        await demandPlanningRepository.upsertSkuForecast(
          tenantId,
          run.periodId,
          line.branchId,
          line.modelId,
          patch.forecastQty,
        );
      }
    }

    for (const log of logs) {
      await demandPlanningRepository.addOverrideLog({
        tenant: { connect: { id: tenantId } },
        run: { connect: { id: runId } },
        line: { connect: { id: lineId } },
        user: { connect: { id: userId } },
        field: log.field,
        previousValue: log.previousValue,
        newValue: log.newValue,
      });
    }

    // Recompute just this branch with overrides applied to all its lines.
    const branchLines = run.lines.filter((l) => l.branchId === line.branchId);
    const skus = branchLines.map((l) => ({
      modelId: l.modelId,
      skuCode: l.model.skuCode,
      seriesCode: l.seriesCode ?? l.model.skuCode.slice(0, 5),
      srp: Number(l.srp.toString()),
      onPlanogram: l.onPlanogram,
      historyQty: Number(l.historyQty.toString()),
      historyPhp: Number(l.historyPhp.toString()),
      displayUnits:
        l.id === lineId && patch.displayUnits != null
          ? patch.displayUnits
          : l.displayUnits,
      onHand: l.onHand,
      forecastQty:
        l.id === lineId && patch.forecastQty != null
          ? patch.forecastQty
          : l.forecastQty,
    }));

    const freq = Number(line.deliveryFreqMonth.toString());
    const recomputed = recomputeWithOverrides(
      skus,
      {
        branchId: line.branchId,
        deliveryFrequencyPerMonth: freq,
        monthBasisDays: Number(run.monthBasisDays.toString()),
        deriveQuotaFromForecast: run.deriveQuotaFromForecast,
        quotaPhp: Number(line.quotaPhp.toString()),
        floorAllocationAtZero: run.floorAllocationAtZero,
        roundUpSlowMovers: run.roundUpSlowMovers,
      },
      [],
    );

    const otherLines = run.lines
      .filter((l) => l.branchId !== line.branchId)
      .map((l) => ({
        tenantId,
        runId,
        branchId: l.branchId,
        modelId: l.modelId,
        seriesCode: l.seriesCode,
        onPlanogram: l.onPlanogram,
        srp: l.srp,
        historyQty: l.historyQty,
        historyPhp: l.historyPhp,
        hmix: l.hmix,
        adjMix: l.adjMix,
        milQty: l.milQty,
        milPhp: l.milPhp,
        displayUnits: l.displayUnits,
        onHand: l.onHand,
        forecastQty: l.forecastQty,
        forecastPhp: l.forecastPhp,
        allocQty: l.allocQty,
        allocPhp: l.allocPhp,
        cycleQty: l.cycleQty,
        drop1Qty: l.drop1Qty,
        drop1Php: l.drop1Php,
        minLevelDays: l.minLevelDays,
        quotaPhp: l.quotaPhp,
        deliveryFreqMonth: l.deliveryFreqMonth,
      }));

    await demandPlanningRepository.replaceLines(tenantId, runId, [
      ...otherLines,
      ...lineRowsFromBranchResult(tenantId, runId, recomputed),
    ]);

    return demandPlanningRepository.findRun(tenantId, runId);
  },

  async previewLiveBranch(
    tenantId: string,
    branchId: string,
    salesPeriodLabel: string,
    opts?: {
      periodId?: string | null;
      deliveryFrequencyPerMonth?: number;
      deriveQuotaFromForecast?: boolean;
      quotaPhp?: number;
    },
  ) {
    const period = parseSalesPeriodLabel(salesPeriodLabel);
    const history = historyWindowForSalesPeriod(period.start);

    let periodId = opts?.periodId ?? null;
    if (!periodId) {
      const existing = await prisma.planningPeriod.findFirst({
        where: { tenantId, label: period.label },
        select: { id: true },
      });
      periodId = existing?.id ?? null;
    }

    const [source] = await loadBranchDemandSources(
      tenantId,
      [branchId],
      periodId,
      {
        salesPeriodStart: period.start,
        salesPeriodEnd: period.end,
        historyStart: history.historyStart,
        historyEnd: history.historyEnd,
      },
    );
    if (!source) throw new Error("Branch not found");

    const computed = computeBranchDemand(source.skus, {
      branchId,
      deliveryFrequencyPerMonth:
        opts?.deliveryFrequencyPerMonth ?? source.deliveryFrequencyPerMonth,
      deriveQuotaFromForecast: opts?.deriveQuotaFromForecast !== false,
      quotaPhp: opts?.quotaPhp ?? source.revenueTargetPhp ?? undefined,
    });

    return {
      source,
      computed,
      coverageStages: coverageStagesForBranch(computed),
      period,
      history,
    };
  },

  async coverageMonitor(tenantId: string, salesPeriodLabel: string) {
    const period = parseSalesPeriodLabel(salesPeriodLabel);
    const runs = await prisma.demandPlanningRun.findMany({
      where: {
        tenantId,
        salesPeriodLabel: period.label,
        status: { in: ["generated", "released"] },
      },
      include: {
        lines: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                sapCode: true,
                dealer: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { version: "desc" },
    });

    // Prefer released, else latest generated per period
    const primary =
      runs.find((r) => r.status === "released") ?? runs[0] ?? null;

    const allBranches = await prisma.branch.findMany({
      where: { tenantId, deletedAt: null, status: "active" },
      select: {
        id: true,
        name: true,
        sapCode: true,
        dealer: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    const targets = await prisma.branchForecastTarget.findMany({
      where: {
        tenantId,
        period: { label: period.label },
      },
      select: { branchId: true, revenueTarget: true },
    });
    const targetMap = new Map(
      targets.map((t) => [t.branchId, Number(t.revenueTarget.toString())]),
    );

    const skuFc = await prisma.branchSkuForecast.findMany({
      where: { tenantId, period: { label: period.label } },
      include: { model: { select: { srp: true } } },
    });
    const skuTargetUnits = new Map<string, number>();
    const skuTargetPhp = new Map<string, number>();
    for (const row of skuFc) {
      skuTargetUnits.set(
        row.branchId,
        (skuTargetUnits.get(row.branchId) ?? 0) + row.forecastQty,
      );
      skuTargetPhp.set(
        row.branchId,
        (skuTargetPhp.get(row.branchId) ?? 0) +
          row.forecastQty * Number(row.model.srp?.toString() ?? 0),
      );
    }

    const plannedByBranch = new Map<
      string,
      {
        milQty: number;
        onHand: number;
        allocQty: number;
        drop1Qty: number;
        allocPhp: number;
        quotaPhp: number;
        coverageDays: number;
      }
    >();

    if (primary) {
      for (const line of primary.lines) {
        const cur = plannedByBranch.get(line.branchId) ?? {
          milQty: 0,
          onHand: 0,
          allocQty: 0,
          drop1Qty: 0,
          allocPhp: 0,
          quotaPhp: Number(line.quotaPhp.toString()),
          coverageDays: 0,
        };
        cur.milQty += line.milQty;
        cur.onHand += line.onHand;
        cur.allocQty += line.allocQty;
        cur.drop1Qty += line.drop1Qty;
        cur.allocPhp += Number(line.allocPhp.toString());
        plannedByBranch.set(line.branchId, cur);
      }
      for (const [branchId, cur] of plannedByBranch) {
        cur.coverageDays =
          cur.quotaPhp > 0
            ? (cur.allocPhp / cur.quotaPhp) * Number(primary.monthBasisDays.toString())
            : 0;
        plannedByBranch.set(branchId, cur);
      }
    }

    const branchRollup = allBranches.map((b) => {
      const planned = plannedByBranch.get(b.id);
      const targetPhp =
        skuTargetPhp.get(b.id) ?? targetMap.get(b.id) ?? 0;
      const targetUnits = skuTargetUnits.get(b.id) ?? 0;
      return {
        branchId: b.id,
        branchName: b.name,
        sapCode: b.sapCode,
        dealerName: b.dealer?.name ?? null,
        planogramSkus: primary
          ? primary.lines.filter((l) => l.branchId === b.id && l.onPlanogram).length
          : 0,
        targetPhp,
        targetUnits,
        milQty: planned?.milQty ?? null,
        onHand: planned?.onHand ?? null,
        allocQty: planned?.allocQty ?? null,
        drop1Qty: planned?.drop1Qty ?? null,
        coverageDays: planned?.coverageDays ?? null,
        status: planned
          ? ("PLANNED" as const)
          : targetPhp > 0
            ? ("NO HISTORY" as const)
            : ("AWAITING" as const),
      };
    });

    const networkTargetPhp = branchRollup.reduce((s, b) => s + b.targetPhp, 0);
    const networkTargetUnits = branchRollup.reduce((s, b) => s + b.targetUnits, 0);
    const plannedAllocPhp = [...plannedByBranch.values()].reduce(
      (s, b) => s + b.allocPhp,
      0,
    );
    const plannedAllocUnits = [...plannedByBranch.values()].reduce(
      (s, b) => s + b.allocQty,
      0,
    );

    let coverageStages = null;
    if (primary) {
      const firstBranchId = primary.lines[0]?.branchId;
      if (firstBranchId) {
        const preview = await this.previewLiveBranch(
          tenantId,
          firstBranchId,
          period.label,
          { periodId: primary.periodId },
        );
        coverageStages = {
          branchId: firstBranchId,
          branchName: preview.source.branchName,
          stages: preview.coverageStages,
          minLevelDays: preview.computed.minLevelDays,
        };
      }
    }

    return {
      period,
      run: primary
        ? {
            id: primary.id,
            documentNumber: primary.documentNumber,
            version: primary.version,
            status: primary.status,
          }
        : null,
      kpis: {
        branchesPlanned: plannedByBranch.size,
        branchesTotal: allBranches.length,
        networkTargetPhp,
        networkTargetUnits,
        plannedAllocPhp,
        plannedAllocUnits,
        coverageDaysAtAllocation:
          networkTargetPhp > 0
            ? (plannedAllocPhp / networkTargetPhp) *
              (primary ? Number(primary.monthBasisDays.toString()) : 30.5)
            : 0,
      },
      branchRollup,
      coverageStages,
    };
  },
};
