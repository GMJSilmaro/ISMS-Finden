"use server";

import { revalidatePath } from "next/cache";

import { demandPlanningReleaseService } from "@/features/demand-planning/services/demand-planning-release.service";
import { demandPlanningService } from "@/features/demand-planning/services/demand-planning.service";
import {
  createDemandPlanDraftSchema,
  updateDemandPlanLineSchema,
  workbenchSendSchema,
} from "@/features/demand-planning/schemas/demand-planning.schema";
import type { DemandPlanListSort } from "@/features/demand-planning/repositories/demand-planning.repository";
import { branchService } from "@/features/branches/services/branch.service";
import { requireAnyPermission } from "@/lib/auth/permissions";
import type { DemandPlanStatus } from "@prisma/client";

function revalidateDemandPlanning(runId?: string) {
  revalidatePath("/orders/demand-planning");
  revalidatePath("/orders/replenishment");
  revalidatePath("/reports/demand-planning-coverage");
  revalidatePath("/settings/planning");
  revalidatePath("/orders/auto-replenish");
  revalidatePath("/dashboard");
  if (runId) revalidatePath(`/orders/demand-planning/${runId}`);
}

async function requireForecastManage() {
  return requireAnyPermission(["forecast.manage", "planogram.manage"]);
}

export async function listDemandPlansAction(input?: {
  page?: number;
  limit?: number;
  status?: DemandPlanStatus;
  q?: string;
  sort?: string;
  sortDir?: "asc" | "desc";
}) {
  const session = await requireForecastManage();
  const sortField = (
    ["documentNumber", "status", "createdAt", "name"] as DemandPlanListSort[]
  ).includes(input?.sort as DemandPlanListSort)
    ? (input?.sort as DemandPlanListSort)
    : undefined;

  return demandPlanningService.listRuns(
    session.user.tenantId,
    { page: input?.page, limit: input?.limit },
    { status: input?.status, q: input?.q },
    { field: sortField, dir: input?.sortDir },
  );
}

export async function getDemandPlanAction(runId: string) {
  const session = await requireForecastManage();
  return demandPlanningService.findRun(session.user.tenantId, runId);
}

export async function listBranchesForDemandPlanAction() {
  const session = await requireForecastManage();
  const branches = await branchService.listBranches(session.user.tenantId);
  return branches.map((b) => ({
    id: b.id,
    name: b.name,
    sapCode: b.sapCode,
    dealerName: b.dealer?.name ?? null,
  }));
}

export async function createDemandPlanDraftAction(raw: unknown) {
  const session = await requireForecastManage();
  const parsed = createDemandPlanDraftSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const run = await demandPlanningService.createDraft(
      session.user.tenantId,
      session.user.id,
      parsed.data,
    );
    revalidateDemandPlanning(run.id);
    return { ok: true as const, runId: run.id, documentNumber: run.documentNumber };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to create draft" };
  }
}

export async function getDemandPlanDataSourcesAction(runId: string) {
  const session = await requireForecastManage();
  try {
    return {
      ok: true as const,
      ...(await demandPlanningService.getDataSourceStamps(session.user.tenantId, runId)),
    };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function computeDemandPlanAction(runId: string) {
  const session = await requireForecastManage();
  try {
    const run = await demandPlanningService.computeAndPersist(
      session.user.tenantId,
      runId,
      session.user.id,
    );
    revalidateDemandPlanning(runId);
    return { ok: true as const, run };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Compute failed" };
  }
}

export async function updateDemandPlanLineAction(raw: unknown) {
  const session = await requireForecastManage();
  const parsed = updateDemandPlanLineSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const run = await demandPlanningService.updateLineOverrides(
      session.user.tenantId,
      parsed.data.runId,
      session.user.id,
      parsed.data.lineId,
      {
        displayUnits: parsed.data.displayUnits,
        forecastQty: parsed.data.forecastQty,
      },
    );
    revalidateDemandPlanning(parsed.data.runId);
    return { ok: true as const, run };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Update failed" };
  }
}

export async function releaseDemandPlanAction(runId: string) {
  const session = await requireForecastManage();
  try {
    const result = await demandPlanningReleaseService.releaseToOrdering(
      session.user.tenantId,
      runId,
      session.user.id,
    );
    revalidateDemandPlanning(runId);
    return { ok: true as const, ...result };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Release failed" };
  }
}

export async function previewWorkbenchBranchAction(input: {
  branchId: string;
  salesPeriodLabel: string;
  deliveryFrequencyPerMonth?: number;
  deriveQuotaFromForecast?: boolean;
  quotaPhp?: number;
}) {
  const session = await requireForecastManage();
  try {
    const preview = await demandPlanningService.previewLiveBranch(
      session.user.tenantId,
      input.branchId,
      input.salesPeriodLabel,
      {
        deliveryFrequencyPerMonth: input.deliveryFrequencyPerMonth,
        deriveQuotaFromForecast: input.deriveQuotaFromForecast,
        quotaPhp: input.quotaPhp,
      },
    );
    return { ok: true as const, preview };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Preview failed" };
  }
}

export async function sendWorkbenchSelectionAction(raw: unknown) {
  const session = await requireForecastManage();
  const parsed = workbenchSendSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const order = await demandPlanningReleaseService.sendWorkbenchSelection(
      session.user.tenantId,
      session.user.id,
      parsed.data,
    );
    revalidateDemandPlanning();
    return { ok: true as const, order };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Send failed" };
  }
}

export async function getCoverageMonitorAction(salesPeriodLabel: string) {
  const session = await requireForecastManage();
  try {
    const data = await demandPlanningService.coverageMonitor(
      session.user.tenantId,
      salesPeriodLabel,
    );
    return { ok: true as const, data };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function listBranchesForWorkbenchAction() {
  return listBranchesForDemandPlanAction();
}
