import { prisma } from "@/lib/database/client";

/**
 * Monthly sequential Demand Planning document number: DP-YYYYMM-nnn
 * Version is separate (v1, v2…) — re-runs bump version under the same documentNumber
 * when superseding, or allocate a new nnn for a fresh run.
 */
export async function nextDemandPlanDocumentNumber(
  tenantId: string,
  salesPeriodStart: Date,
): Promise<string> {
  const y = salesPeriodStart.getFullYear();
  const m = String(salesPeriodStart.getMonth() + 1).padStart(2, "0");
  const prefix = `DP-${y}${m}-`;

  return prisma.$transaction(async (tx) => {
    const latest = await tx.demandPlanningRun.findFirst({
      where: { tenantId, documentNumber: { startsWith: prefix } },
      orderBy: { documentNumber: "desc" },
      select: { documentNumber: true },
    });

    let next = 1;
    if (latest?.documentNumber) {
      const suffix = latest.documentNumber.slice(prefix.length);
      const parsed = Number.parseInt(suffix, 10);
      if (Number.isFinite(parsed)) next = parsed + 1;
    }

    return `${prefix}${String(next).padStart(3, "0")}`;
  });
}
