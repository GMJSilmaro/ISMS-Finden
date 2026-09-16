/**
 * Lightweight regression checks for the Demand Planning engine against the
 * BRS workbook figures cited in the PDF (Dealer 1 / Branch 1, Dec 2025).
 *
 * Run: pnpm exec tsx src/features/demand-planning/engine/compute.selftest.ts
 */

import { computeBranchDemand } from "@/features/demand-planning/engine/compute";
import type { DemandSkuInput } from "@/features/demand-planning/engine/types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function approx(a: number, b: number, tol = 1): boolean {
  return Math.abs(a - b) <= tol;
}

// Subset of workbook lines that drive headline totals (55UHW201 alone is ~45% mix).
const skus: DemandSkuInput[] = [
  {
    modelId: "55UHW201",
    skuCode: "55UHW201",
    seriesCode: "55UHW",
    srp: 24450,
    onPlanogram: true,
    historyQty: 45.67,
    historyPhp: 1_332_550,
    displayUnits: 2,
    onHand: 11,
    forecastQty: 90,
  },
  {
    modelId: "43STW101",
    skuCode: "43STW101",
    seriesCode: "43STW",
    srp: 14950,
    onPlanogram: true,
    historyQty: 34.67,
    historyPhp: 566_933,
    displayUnits: 1,
    onHand: 9,
    forecastQty: 65,
  },
  {
    modelId: "SWS-01",
    skuCode: "SWS-01",
    seriesCode: "SWS-01",
    srp: 4450,
    onPlanogram: true,
    isFreeOrBundle: true,
    historyQty: 34,
    historyPhp: 0,
    displayUnits: 0,
    onHand: 9,
    forecastQty: 0,
  },
];

const result = computeBranchDemand(skus, {
  branchId: "b1",
  deliveryFrequencyPerMonth: 4,
  monthBasisDays: 30.5,
  deriveQuotaFromForecast: true,
  roundUpSlowMovers: true,
});

assert(result.minLevelDays === 30.5 / 4, `min days expected 7.625 got ${result.minLevelDays}`);
assert(result.quotaPhp > 0, "quota should derive from forecast ₱");

const hero = result.lines.find((l) => l.skuCode === "55UHW201")!;
assert(hero.hmix > 0.4, `55UHW mix should dominate, got ${hero.hmix}`);
assert(hero.milQty >= 1, "MIL qty should be positive");
assert(hero.allocQty === Math.max(0, hero.milQty - 2 - 11 + 90), "alloc formula");
assert(hero.drop1Qty === Math.max(0, hero.cycleQty - 11), "drop1 formula");

const free = result.lines.find((l) => l.skuCode === "SWS-01")!;
assert(free.hmix === 0 && free.adjMix === 0 && free.milQty === 0, "free item stays out of mix");

// Total inventory ₱ must use MIL₱ not adj-mix fraction (open item 01).
for (const line of result.lines) {
  const expected =
    line.milPhp + line.displayUnits * line.srp + line.onHand * line.srp + line.forecastPhp;
  assert(approx(line.totalInventoryPhp, expected, 0.01), `inventory ₱ for ${line.skuCode}`);
}

console.log("demand-planning engine selftest OK", {
  quotaPhp: result.quotaPhp,
  minLevelDays: result.minLevelDays,
  drop1Qty: result.totals.drop1Qty,
  allocQty: result.totals.allocQty,
});
