import { auditService } from "@/features/audit/services/audit.service";
import { demandPlanningRepository } from "@/features/demand-planning/repositories/demand-planning.repository";
import { getOrderApprovalChain } from "@/features/orders/constants/order-workflow";
import { nextSalesOrderNumber } from "@/features/orders/utils/next-sales-order-number";
import { prisma } from "@/lib/database/client";

/**
 * Freeze Drop 1 quantities on the run and raise one auto-replenish Order Request
 * per branch (Process II handoff). Re-release is blocked; create a new version instead.
 */
export const demandPlanningReleaseService = {
  async releaseToOrdering(tenantId: string, runId: string, userId: string) {
    const run = await demandPlanningRepository.findRun(tenantId, runId);
    if (!run) throw new Error("Demand plan not found");
    if (run.status === "released") {
      throw new Error("This plan is already released");
    }
    if (run.status === "superseded") {
      throw new Error("Superseded plans cannot be released");
    }
    if (run.lines.length === 0) {
      throw new Error("Compute the recommendation before releasing");
    }

    const byBranch = new Map<string, typeof run.lines>();
    for (const line of run.lines) {
      if (line.drop1Qty <= 0) continue;
      const list = byBranch.get(line.branchId) ?? [];
      list.push(line);
      byBranch.set(line.branchId, list);
    }

    if (byBranch.size === 0) {
      throw new Error("No Drop 1 quantities to release — every line is zero");
    }

    for (const line of run.lines) {
      await prisma.demandPlanningLine.update({
        where: { id: line.id },
        data: { releasedDrop1Qty: line.drop1Qty },
      });
    }

    const approvalChain = getOrderApprovalChain("auto_replenish");
    const createdOrders: { id: string; orderNumber: string; branchId: string }[] =
      [];

    for (const [branchId, lines] of byBranch) {
      const orderNumber = await nextSalesOrderNumber(tenantId);
      const order = await prisma.branchOrder.create({
        data: {
          tenantId,
          branchId,
          orderType: "auto_replenish",
          orderNumber,
          status: "pending_tl",
          createdById: userId,
          demandPlanningRunId: runId,
          notes: `Demand Planning ${run.documentNumber} v${run.version}`,
          details: {
            create: lines.map((line) => ({
              modelId: line.modelId,
              quantity: line.drop1Qty,
            })),
          },
          approvalLevels: {
            create: approvalChain.map((step) => ({
              level: step.level,
              roleSlug: step.roleSlug,
            })),
          },
        },
      });
      createdOrders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        branchId,
      });
    }

    await prisma.demandPlanningRun.update({
      where: { id: runId },
      data: {
        status: "released",
        releasedAt: new Date(),
        releasedById: userId,
      },
    });

    await auditService.log({
      tenantId,
      userId,
      action: "demand_planning.released",
      entityType: "DemandPlanningRun",
      entityId: runId,
      metadata: {
        documentNumber: run.documentNumber,
        version: run.version,
        orderCount: createdOrders.length,
      },
    });

    return { runId, orders: createdOrders };
  },

  /**
   * Mid-cycle workbench send: create a supplementary auto-replenish order for
   * selected Drop 1 lines, linked to the latest released plan when present.
   */
  async sendWorkbenchSelection(
    tenantId: string,
    userId: string,
    input: {
      branchId: string;
      salesPeriodLabel: string;
      lines: { modelId: string; quantity: number }[];
      releasedRunId?: string | null;
      submitForReview?: boolean;
    },
  ) {
    const selected = input.lines.filter((l) => l.quantity > 0);
    if (selected.length === 0) {
      throw new Error("Select at least one line with quantity");
    }

    const approvalChain = getOrderApprovalChain("auto_replenish");
    const orderNumber = await nextSalesOrderNumber(tenantId);
    const status = input.submitForReview === false ? "draft" : "pending_tl";

    const order = await prisma.branchOrder.create({
      data: {
        tenantId,
        branchId: input.branchId,
        orderType: "auto_replenish",
        orderNumber,
        status,
        createdById: userId,
        demandPlanningRunId: input.releasedRunId ?? undefined,
        notes: `Mid-cycle replenishment (${input.salesPeriodLabel})`,
        details: {
          create: selected.map((l) => ({
            modelId: l.modelId,
            quantity: l.quantity,
          })),
        },
        approvalLevels: {
          create: approvalChain.map((step) => ({
            level: step.level,
            roleSlug: step.roleSlug,
          })),
        },
      },
      include: { branch: { select: { name: true } } },
    });

    await auditService.log({
      tenantId,
      userId,
      action: "demand_planning.workbench_sent",
      entityType: "BranchOrder",
      entityId: order.id,
      metadata: {
        branchId: input.branchId,
        lineCount: selected.length,
        releasedRunId: input.releasedRunId ?? null,
      },
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      branchName: order.branch.name,
      status: order.status,
    };
  },
};
