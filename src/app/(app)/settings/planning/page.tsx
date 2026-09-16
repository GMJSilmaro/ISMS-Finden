import Link from "next/link";

import {
  getPlanningDashboardAction,
  listAllocationGapsAction,
  listBranchesForPlanningAction,
  listPlanningTargetsAction,
} from "@/features/forecast/actions/forecast.actions";
import { forecastService } from "@/features/forecast/services/forecast.service";
import { ModuleGuide } from "@/components/module-guide";
import { parseTablePageSize } from "@/components/data-table/table-page-size";
import { requireAnyPermission } from "@/lib/auth/permissions";
import { PLANNING_MODULE_GUIDE } from "@/content/module-guides/planning";
import { PLANNING_PAGE_TUTORIAL } from "@/content/page-tutorials/planning";
import { PageHeader } from "@/app/(app)/_components/page-header";
import { PlanningPanel } from "@/app/(app)/settings/planning/_components/planning-panel";
import { Button } from "@/components/ui/button";

interface PlanningPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    branch?: string;
    q?: string;
    sort?: string;
    dir?: string;
  }>;
}

export default async function PlanningPage({ searchParams }: PlanningPageProps) {
  await requireAnyPermission(["forecast.manage", "planogram.manage"]);

  const params = await searchParams;
  const gapPage = Number(params.page) || 1;
  const gapLimit = parseTablePageSize(params.limit);

  const dashboard = await getPlanningDashboardAction();
  const period = dashboard.period;

  const [targets, gapsResult, branches] = period
    ? await Promise.all([
        listPlanningTargetsAction(period.id),
        listAllocationGapsAction(period.id, {
          page: gapPage,
          limit: gapLimit,
          branchId: params.branch,
          q: params.q,
          sort: params.sort,
          sortDir: params.dir,
        }),
        listBranchesForPlanningAction(),
      ])
    : [[], { items: [], total: 0, page: 1, limit: gapLimit, totalPages: 1 }, []];

  const formattedTargets = targets.map((t) => ({
    id: t.id,
    revenueLabel: forecastService.formatRevenueTarget(t.revenueTarget),
    branch: { name: t.branch.name, sapCode: t.branch.sapCode },
  }));

  const clientPeriod = period
    ? {
        id: period.id,
        label: period.label,
        isActive: period.isActive,
        _count: period._count,
      }
    : null;

  const clientGaps = {
    items: gapsResult.items.map((g) => ({
      id: g.id,
      gapQty: g.gapQty,
      planogramMax: g.planogramMax,
      currentStock: g.currentStock,
      branch: { name: g.branch.name },
      model: { skuCode: g.model.skuCode, name: g.model.name },
    })),
    total: gapsResult.total,
    page: gapsResult.page,
    limit: gapsResult.limit,
    totalPages: gapsResult.totalPages,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning & Forecast"
        tutorial={PLANNING_PAGE_TUTORIAL}
        description="Import branch revenue targets and per-SKU SFE forecasts. Run Demand Planning under Orders to compute Drop 1 and release to Auto replenish."
        sticky={false}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/orders/demand-planning">Demand Planning</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/orders/replenishment">Workbench</Link>
            </Button>
          </div>
        }
      />
      <ModuleGuide {...PLANNING_MODULE_GUIDE} />
      <PlanningPanel
        period={clientPeriod}
        gapCount={dashboard.gapCount}
        draftOrders={dashboard.draftOrders}
        targets={formattedTargets}
        gapsResult={clientGaps}
        branches={branches}
        currentBranch={params.branch}
        currentQ={params.q}
        initialSort={params.sort ?? ""}
        initialSortDir={params.dir ?? "desc"}
      />
    </div>
  );
}
