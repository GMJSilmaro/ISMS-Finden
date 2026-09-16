import { minLevelDays } from "@/features/demand-planning/engine/frequency";
import type {
  CoverageStageDays,
  DemandBranchParams,
  DemandBranchResult,
  DemandLineResult,
  DemandSkuInput,
} from "@/features/demand-planning/engine/types";

function roundNearest(n: number): number {
  return Math.round(n);
}

function roundUp(n: number): number {
  return Math.ceil(n);
}

function peso(qty: number, srp: number): number {
  return qty * srp;
}

/**
 * Compute historical mix, then redistribute non-planogram mix onto planogram
 * SKUs in the same series (ADJ HMIX). Free/bundle (zero ₱) never enter mix.
 */
function computeAdjustedMix(skus: DemandSkuInput[]): Map<string, { hmix: number; adjMix: number }> {
  const mixable = skus.filter((s) => !s.isFreeOrBundle && s.historyPhp > 0 && s.srp > 0);
  const branchPhp = mixable.reduce((sum, s) => sum + s.historyPhp, 0);

  const hmixById = new Map<string, number>();
  for (const s of skus) {
    if (s.isFreeOrBundle || s.srp <= 0 || branchPhp <= 0) {
      hmixById.set(s.modelId, 0);
    } else {
      hmixById.set(s.modelId, s.historyPhp / branchPhp);
    }
  }

  // Spill: non-planogram mix within a series → planogram SKUs in that series, proportional to their HMIX.
  const spillBySeries = new Map<string, number>();
  for (const s of skus) {
    if (s.onPlanogram || s.isFreeOrBundle) continue;
    const h = hmixById.get(s.modelId) ?? 0;
    if (h <= 0) continue;
    spillBySeries.set(s.seriesCode, (spillBySeries.get(s.seriesCode) ?? 0) + h);
  }

  const planogramHmixBySeries = new Map<string, number>();
  for (const s of skus) {
    if (!s.onPlanogram || s.isFreeOrBundle) continue;
    const h = hmixById.get(s.modelId) ?? 0;
    planogramHmixBySeries.set(s.seriesCode, (planogramHmixBySeries.get(s.seriesCode) ?? 0) + h);
  }

  const result = new Map<string, { hmix: number; adjMix: number }>();
  for (const s of skus) {
    const hmix = hmixById.get(s.modelId) ?? 0;
    if (!s.onPlanogram || s.isFreeOrBundle) {
      result.set(s.modelId, { hmix, adjMix: 0 });
      continue;
    }
    const spill = spillBySeries.get(s.seriesCode) ?? 0;
    const seriesPlanogramHmix = planogramHmixBySeries.get(s.seriesCode) ?? 0;
    const share = seriesPlanogramHmix > 0 ? hmix / seriesPlanogramHmix : 0;
    const adjMix = hmix + spill * share;
    result.set(s.modelId, { hmix, adjMix });
  }

  return result;
}

/**
 * Branch replenishment computation — identical under Option A and Option B.
 *
 * Pipeline:
 * 1. HMIX = SKU ₱ ÷ Σ branch ₱
 * 2. ADJ HMIX = HMIX + series spill from non-planogram
 * 3. Min₱ = Quota ÷ monthBasis × minDays; MIL qty = Min₱ × adj ÷ SRP
 * 4. Alloc = max(0, MIL − DU − OH + FC)
 * 5. Cycle = round(Alloc ÷ monthBasis × minDays); Drop1 = max(0, Cycle − OH)
 */
export function computeBranchDemand(
  skus: DemandSkuInput[],
  params: DemandBranchParams,
): DemandBranchResult {
  const monthBasisDays = params.monthBasisDays ?? 30.5;
  const deliveryFreqMonth = params.deliveryFrequencyPerMonth;
  const floorZero = params.floorAllocationAtZero !== false;
  const roundUpSlow = params.roundUpSlowMovers !== false;
  const days = minLevelDays(monthBasisDays, deliveryFreqMonth);

  const forecastPhpTotal = skus.reduce(
    (sum, s) => sum + (s.isFreeOrBundle || s.srp <= 0 ? 0 : s.forecastQty * s.srp),
    0,
  );

  const derive = params.deriveQuotaFromForecast !== false;
  const quotaPhp = derive
    ? forecastPhpTotal
    : (params.quotaPhp ?? forecastPhpTotal);

  const minLevelPhp = monthBasisDays > 0 ? (quotaPhp / monthBasisDays) * days : 0;
  const mixes = computeAdjustedMix(skus);
  const historyPhpTotal = skus.reduce(
    (sum, s) => sum + (s.isFreeOrBundle ? 0 : s.historyPhp),
    0,
  );

  const lines: DemandLineResult[] = [];

  for (const s of skus) {
    const { hmix, adjMix } = mixes.get(s.modelId) ?? { hmix: 0, adjMix: 0 };
    const srp = s.srp > 0 ? s.srp : 0;
    const forecastPhp = s.isFreeOrBundle || srp <= 0 ? 0 : s.forecastQty * srp;

    let milQty = 0;
    let milPhp = 0;

    if (s.onPlanogram && !s.isFreeOrBundle && srp > 0) {
      const rawMil = (minLevelPhp * adjMix) / srp;
      milQty = roundNearest(rawMil);
      // One-facing minimum: any history that would otherwise round to 0 MIL.
      if (roundUpSlow && milQty === 0 && s.historyQty > 0) {
        milQty = roundUp(Math.max(rawMil, Number.EPSILON));
        if (milQty < 1) milQty = 1;
      }
      milPhp = peso(milQty, srp);
    }

    const du = Math.max(0, s.displayUnits);
    const oh = Math.max(0, s.onHand);
    const fc = Math.max(0, s.forecastQty);

    let allocQty = milQty - du - oh + fc;
    if (floorZero) allocQty = Math.max(0, allocQty);
    const allocPhp = peso(allocQty, srp);

    const cycleRaw = monthBasisDays > 0 ? (allocQty / monthBasisDays) * days : 0;
    const cycleQty = roundNearest(cycleRaw);
    const drop1Qty = Math.max(0, cycleQty - oh);
    const drop1Php = peso(drop1Qty, srp);

    // Correct total inventory ₱ = MIL₱ + DU₱ + OH₱ + FC₱ (open item 01).
    const totalInventoryQty = milQty + du + oh + fc;
    const totalInventoryPhp = milPhp + peso(du, srp) + peso(oh, srp) + forecastPhp;

    lines.push({
      modelId: s.modelId,
      skuCode: s.skuCode,
      seriesCode: s.seriesCode,
      onPlanogram: s.onPlanogram,
      srp,
      historyQty: s.historyQty,
      historyPhp: s.historyPhp,
      hmix,
      adjMix,
      milQty,
      milPhp,
      displayUnits: du,
      onHand: oh,
      forecastQty: fc,
      forecastPhp,
      allocQty,
      allocPhp,
      cycleQty,
      drop1Qty,
      drop1Php,
      minLevelDays: days,
      quotaPhp,
      deliveryFreqMonth,
      totalInventoryQty,
      totalInventoryPhp,
    });
  }

  const sum = (pick: (l: DemandLineResult) => number) =>
    lines.reduce((acc, l) => acc + pick(l), 0);

  const allocPhp = sum((l) => l.allocPhp);
  const drop1Php = sum((l) => l.drop1Php);
  const milPhp = sum((l) => l.milPhp);
  const coverageDaysAtAllocation =
    quotaPhp > 0 ? (allocPhp / quotaPhp) * monthBasisDays : 0;
  const coverageDaysAtDrop1 =
    quotaPhp > 0 ? (drop1Php / quotaPhp) * monthBasisDays : 0;
  const milCoverageDays = quotaPhp > 0 ? (milPhp / quotaPhp) * monthBasisDays : 0;

  return {
    branchId: params.branchId,
    quotaPhp,
    minLevelDays: days,
    minLevelPhp,
    deliveryFreqMonth,
    monthBasisDays,
    historyPhpTotal,
    lines,
    totals: {
      milQty: sum((l) => l.milQty),
      milPhp,
      displayUnits: sum((l) => l.displayUnits),
      onHand: sum((l) => l.onHand),
      forecastQty: sum((l) => l.forecastQty),
      forecastPhp: sum((l) => l.forecastPhp),
      allocQty: sum((l) => l.allocQty),
      allocPhp,
      drop1Qty: sum((l) => l.drop1Qty),
      drop1Php,
      totalInventoryQty: sum((l) => l.totalInventoryQty),
      totalInventoryPhp: sum((l) => l.totalInventoryPhp),
      coverageDaysAtAllocation,
      coverageDaysAtDrop1,
      milCoverageDays,
    },
  };
}

/** DII by stage: stage ₱ ÷ quota × monthBasis. */
export function coverageStagesForBranch(
  result: DemandBranchResult,
): CoverageStageDays[] {
  const q = result.quotaPhp;
  const basis = result.monthBasisDays;
  const toDays = (php: number) => (q > 0 ? (php / q) * basis : 0);

  const duPhp = result.lines.reduce((s, l) => s + l.displayUnits * l.srp, 0);
  const ohPhp = result.lines.reduce((s, l) => s + l.onHand * l.srp, 0);

  return [
    { label: "History (3-mo avg)", php: result.historyPhpTotal, days: toDays(result.historyPhpTotal) },
    { label: "MIL — buffer", php: result.totals.milPhp, days: toDays(result.totals.milPhp) },
    { label: "Display units", php: duPhp, days: toDays(duPhp) },
    { label: "On hand", php: ohPhp, days: toDays(ohPhp) },
    { label: "SFE forecast", php: result.totals.forecastPhp, days: toDays(result.totals.forecastPhp) },
    { label: "Month allocation", php: result.totals.allocPhp, days: toDays(result.totals.allocPhp) },
    { label: "Drop 1 — suggested", php: result.totals.drop1Php, days: toDays(result.totals.drop1Php) },
    {
      label: "Total inventory",
      php: result.totals.totalInventoryPhp,
      days: toDays(result.totals.totalInventoryPhp),
    },
  ];
}

/**
 * Recompute a single branch after inline DU / FC overrides (workbench / review grid).
 * Merges overrides into SKU inputs then runs the same engine.
 */
export function recomputeWithOverrides(
  skus: DemandSkuInput[],
  params: DemandBranchParams,
  overrides: { modelId: string; displayUnits?: number; forecastQty?: number }[],
): DemandBranchResult {
  const byId = new Map(overrides.map((o) => [o.modelId, o]));
  const next = skus.map((s) => {
    const o = byId.get(s.modelId);
    if (!o) return s;
    return {
      ...s,
      displayUnits: o.displayUnits ?? s.displayUnits,
      forecastQty: o.forecastQty ?? s.forecastQty,
    };
  });
  return computeBranchDemand(next, params);
}
