/**
 * Shared Demand Planning computation types (PDF seven-move pipeline).
 * Pure data — no Prisma / I/O.
 */

export interface DemandSkuInput {
  modelId: string;
  skuCode: string;
  /** Item-master series code; falls back to LEFT(sku,5) when absent. */
  seriesCode: string;
  srp: number;
  /** Planogram Y — only planogram SKUs receive MIL / allocation. */
  onPlanogram: boolean;
  /** Free / bundle items carry history qty but zero peso and stay out of mix. */
  isFreeOrBundle?: boolean;
  /** 3-month average sold qty. */
  historyQty: number;
  /** 3-month average sold ₱. */
  historyPhp: number;
  displayUnits: number;
  onHand: number;
  /** SFE per-SKU monthly forecast qty. */
  forecastQty: number;
}

export interface DemandBranchParams {
  branchId: string;
  /** Deliveries per month (e.g. 4). Drives min-level days. */
  deliveryFrequencyPerMonth: number;
  /** Month basis days — demo uses 30.5. */
  monthBasisDays?: number;
  /**
   * When true (default), quota ₱ = Σ (forecastQty × SRP) for this branch.
   * When false, `quotaPhp` must be provided.
   */
  deriveQuotaFromForecast?: boolean;
  /** Explicit branch quota ₱ when not deriving from forecast. */
  quotaPhp?: number;
  /** Floor month allocation at zero (default true). */
  floorAllocationAtZero?: boolean;
  /**
   * When a planogram SKU has any history but MIL rounds to 0 days of cover,
   * round MIL qty up to 1 (demo "one facing minimum"). Default true.
   */
  roundUpSlowMovers?: boolean;
}

export interface DemandLineResult {
  modelId: string;
  skuCode: string;
  seriesCode: string;
  onPlanogram: boolean;
  srp: number;
  historyQty: number;
  historyPhp: number;
  hmix: number;
  adjMix: number;
  milQty: number;
  milPhp: number;
  displayUnits: number;
  onHand: number;
  forecastQty: number;
  forecastPhp: number;
  allocQty: number;
  allocPhp: number;
  cycleQty: number;
  drop1Qty: number;
  drop1Php: number;
  minLevelDays: number;
  quotaPhp: number;
  deliveryFreqMonth: number;
  totalInventoryQty: number;
  totalInventoryPhp: number;
}

export interface DemandBranchResult {
  branchId: string;
  quotaPhp: number;
  minLevelDays: number;
  minLevelPhp: number;
  deliveryFreqMonth: number;
  monthBasisDays: number;
  historyPhpTotal: number;
  lines: DemandLineResult[];
  totals: {
    milQty: number;
    milPhp: number;
    displayUnits: number;
    onHand: number;
    forecastQty: number;
    forecastPhp: number;
    allocQty: number;
    allocPhp: number;
    drop1Qty: number;
    drop1Php: number;
    totalInventoryQty: number;
    totalInventoryPhp: number;
    coverageDaysAtAllocation: number;
    coverageDaysAtDrop1: number;
    milCoverageDays: number;
  };
}

export interface CoverageStageDays {
  label: string;
  php: number;
  days: number;
}
