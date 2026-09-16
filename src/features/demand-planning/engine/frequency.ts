import type { DeliveryFrequency } from "@prisma/client";

/**
 * Map branch FrequencyCode cadence → deliveries per month for MIL days.
 * Aligns with Ordering F-codes: weekly ≈ 4×/mo (PDF demo).
 */
export function deliveriesPerMonthFromFrequency(frequency: DeliveryFrequency): number {
  switch (frequency) {
    case "daily":
      return 26;
    case "twice_weekly":
      return 8;
    case "weekly":
      return 4;
    case "biweekly":
      return 2;
    case "triweekly":
      return 30.5 / 21;
    case "thrice_monthly":
      return 3;
    case "monthly":
      return 1;
    default:
      return 4;
  }
}

export function minLevelDays(monthBasisDays: number, deliveriesPerMonth: number): number {
  if (deliveriesPerMonth <= 0) return monthBasisDays;
  return monthBasisDays / deliveriesPerMonth;
}
