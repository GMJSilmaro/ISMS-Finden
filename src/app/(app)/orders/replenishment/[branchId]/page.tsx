import { notFound } from "next/navigation";

import {
  listBranchesForWorkbenchAction,
  previewWorkbenchBranchAction,
} from "@/features/demand-planning/actions/demand-planning.actions";
import { WorkbenchClient } from "@/app/(app)/orders/replenishment/[branchId]/_components/workbench-client";
import { requireAnyPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/app/(app)/_components/page-header";

interface PageProps {
  params: Promise<{ branchId: string }>;
  searchParams: Promise<{ period?: string }>;
}

function defaultPeriodLabel() {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}

export default async function BranchWorkbenchPage({ params, searchParams }: PageProps) {
  await requireAnyPermission(["forecast.manage", "planogram.manage"]);
  const { branchId } = await params;
  const sp = await searchParams;
  const period = sp.period?.trim() || defaultPeriodLabel();

  const branches = await listBranchesForWorkbenchAction();
  const branch = branches.find((b) => b.id === branchId);
  if (!branch) notFound();

  const preview = await previewWorkbenchBranchAction({
    branchId,
    salesPeriodLabel: period,
  });

  if (!preview.ok) {
    return (
      <div className="space-y-4">
        <PageHeader title={branch.name} description="Replenishment workbench" />
        <p className="text-sm text-destructive">{preview.error}</p>
      </div>
    );
  }

  const { computed, coverageStages, source } = preview.preview;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${branch.dealerName ? `${branch.dealerName} / ` : ""}${branch.name}`}
        description={`Live on-hand workbench · ${period}`}
      />
      <WorkbenchClient
        branchId={branchId}
        branchName={branch.name}
        salesPeriodLabel={period}
        deliveryFrequencyPerMonth={source.deliveryFrequencyPerMonth}
        frequencyCode={source.frequencyCode}
        computed={{
          quotaPhp: computed.quotaPhp,
          minLevelDays: computed.minLevelDays,
          minLevelPhp: computed.minLevelPhp,
          historyPhpTotal: computed.historyPhpTotal,
          totals: computed.totals,
          lines: computed.lines.map((l) => ({
            modelId: l.modelId,
            skuCode: l.skuCode,
            seriesCode: l.seriesCode,
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
            onPlanogram: l.onPlanogram,
          })),
        }}
        coverageStages={coverageStages}
      />
    </div>
  );
}
