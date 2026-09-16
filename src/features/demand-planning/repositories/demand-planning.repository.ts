import type { DemandPlanOrigin, DemandPlanStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/database/client";
import {
  resolvePagination,
  toPaginatedResult,
  type PaginationInput,
} from "@/lib/shared/pagination";

export type DemandPlanListSort = "documentNumber" | "status" | "createdAt" | "name";

const lineInclude = {
  model: { select: { id: true, skuCode: true, name: true } },
  branch: {
    select: {
      id: true,
      name: true,
      sapCode: true,
      dealer: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.DemandPlanningLineInclude;

export const demandPlanningRepository = {
  listRuns(
    tenantId: string,
    pagination?: PaginationInput,
    filters?: { status?: DemandPlanStatus; q?: string },
    sort?: { field?: DemandPlanListSort; dir?: "asc" | "desc" },
  ) {
    const { limit, page, skip } = resolvePagination(pagination);
    const q = filters?.q?.trim();
    const where: Prisma.DemandPlanningRunWhereInput = {
      tenantId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(q
        ? {
            OR: [
              { documentNumber: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { salesPeriodLabel: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.DemandPlanningRunOrderByWithRelationInput =
      sort?.field === "documentNumber"
        ? { documentNumber: sort.dir ?? "desc" }
        : sort?.field === "status"
          ? { status: sort.dir ?? "asc" }
          : sort?.field === "name"
            ? { name: sort.dir ?? "asc" }
            : { createdAt: sort?.dir ?? "desc" };

    return Promise.all([
      prisma.demandPlanningRun.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          period: { select: { id: true, label: true } },
          _count: { select: { lines: true, branchOrders: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.demandPlanningRun.count({ where }),
    ]).then(([items, total]) => toPaginatedResult(items, total, page, limit));
  },

  findRun(tenantId: string, runId: string) {
    return prisma.demandPlanningRun.findFirst({
      where: { tenantId, id: runId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        releasedBy: { select: { id: true, name: true, email: true } },
        period: { select: { id: true, label: true } },
        lines: {
          include: lineInclude,
          orderBy: [{ branch: { name: "asc" } }, { model: { skuCode: "asc" } }],
        },
        _count: { select: { lines: true, branchOrders: true, overrideLogs: true } },
      },
    });
  },

  findLatestReleasedForBranch(tenantId: string, branchId: string, salesPeriodLabel?: string) {
    return prisma.demandPlanningRun.findFirst({
      where: {
        tenantId,
        status: "released",
        ...(salesPeriodLabel ? { salesPeriodLabel } : {}),
        lines: { some: { branchId } },
      },
      orderBy: [{ releasedAt: "desc" }, { version: "desc" }],
      include: {
        lines: {
          where: { branchId },
          include: lineInclude,
          orderBy: { model: { skuCode: "asc" } },
        },
      },
    });
  },

  async createRun(
    data: Prisma.DemandPlanningRunCreateInput,
  ) {
    return prisma.demandPlanningRun.create({
      data,
      include: {
        createdBy: { select: { id: true, name: true } },
        period: { select: { id: true, label: true } },
      },
    });
  },

  updateRun(tenantId: string, runId: string, data: Prisma.DemandPlanningRunUpdateInput) {
    return prisma.demandPlanningRun.update({
      where: { id: runId },
      data: { ...data, tenant: undefined },
      include: {
        createdBy: { select: { id: true, name: true } },
        period: { select: { id: true, label: true } },
      },
    }).then(async (run) => {
      if (run.tenantId !== tenantId) throw new Error("Run not found");
      return run;
    });
  },

  async replaceLines(
    tenantId: string,
    runId: string,
    lines: Prisma.DemandPlanningLineCreateManyInput[],
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.demandPlanningLine.deleteMany({ where: { tenantId, runId } });
      if (lines.length > 0) {
        await tx.demandPlanningLine.createMany({ data: lines });
      }
    });
  },

  updateLine(
    tenantId: string,
    lineId: string,
    data: Prisma.DemandPlanningLineUpdateInput,
  ) {
    return prisma.demandPlanningLine.updateMany({
      where: { id: lineId, tenantId },
      data: data as Prisma.DemandPlanningLineUpdateManyMutationInput,
    });
  },

  findLine(tenantId: string, lineId: string) {
    return prisma.demandPlanningLine.findFirst({
      where: { tenantId, id: lineId },
      include: lineInclude,
    });
  },

  addOverrideLog(data: Prisma.DemandPlanningOverrideLogCreateInput) {
    return prisma.demandPlanningOverrideLog.create({ data });
  },

  upsertDisplayUnit(
    tenantId: string,
    branchId: string,
    modelId: string,
    qty: number,
  ) {
    return prisma.branchDisplayUnit.upsert({
      where: { branchId_modelId: { branchId, modelId } },
      create: { tenantId, branchId, modelId, qty },
      update: { qty },
    });
  },

  upsertSkuForecast(
    tenantId: string,
    periodId: string,
    branchId: string,
    modelId: string,
    forecastQty: number,
  ) {
    return prisma.branchSkuForecast.upsert({
      where: {
        periodId_branchId_modelId: { periodId, branchId, modelId },
      },
      create: { tenantId, periodId, branchId, modelId, forecastQty },
      update: { forecastQty },
    });
  },

  listSkuForecasts(tenantId: string, periodId: string) {
    return prisma.branchSkuForecast.findMany({
      where: { tenantId, periodId },
      include: {
        branch: { select: { id: true, name: true, sapCode: true } },
        model: { select: { id: true, skuCode: true, name: true, srp: true } },
      },
      orderBy: [{ branch: { name: "asc" } }, { model: { skuCode: "asc" } }],
    });
  },
};

export type { DemandPlanOrigin, DemandPlanStatus };
