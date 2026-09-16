import Link from "next/link";
import { notFound } from "next/navigation";

import { getDemandPlanAction } from "@/features/demand-planning/actions/demand-planning.actions";
import { DemandPlanDocumentClient } from "@/app/(app)/orders/demand-planning/[runId]/_components/demand-plan-document-client";
import { requireAnyPermission } from "@/lib/auth/permissions";
import { decimalToNumber } from "@/lib/database/decimal";
import { PageHeader } from "@/app/(app)/_components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ runId: string }>;
}

export default async function DemandPlanDocumentPage({ params }: PageProps) {
  await requireAnyPermission(["forecast.manage", "planogram.manage"]);
  const { runId } = await params;
  const run = await getDemandPlanAction(runId);
  if (!run) notFound();

  const branches = [...new Map(
    run.lines.map((l) => [
      l.branchId,
      {
        id: l.branchId,
        name: l.branch.name,
        dealerName: l.branch.dealer?.name ?? null,
      },
    ]),
  ).values()];

  const clientRun = {
    id: run.id,
    documentNumber: run.documentNumber,
    version: run.version,
    name: run.name,
    status: run.status,
    salesPeriodLabel: run.salesPeriodLabel,
    monthBasisDays: decimalToNumber(run.monthBasisDays),
    editable: run.status === "draft" || run.status === "generated",
    lines: run.lines.map((l) => ({
      id: l.id,
      branchId: l.branchId,
      modelId: l.modelId,
      skuCode: l.model.skuCode,
      seriesCode: l.seriesCode ?? l.model.skuCode.slice(0, 5),
      srp: decimalToNumber(l.srp),
      historyQty: decimalToNumber(l.historyQty),
      historyPhp: decimalToNumber(l.historyPhp),
      hmix: decimalToNumber(l.hmix),
      adjMix: decimalToNumber(l.adjMix),
      milQty: l.milQty,
      milPhp: decimalToNumber(l.milPhp),
      displayUnits: l.displayUnits,
      onHand: l.onHand,
      forecastQty: l.forecastQty,
      forecastPhp: decimalToNumber(l.forecastPhp),
      allocQty: l.allocQty,
      allocPhp: decimalToNumber(l.allocPhp),
      cycleQty: l.cycleQty,
      drop1Qty: l.drop1Qty,
      drop1Php: decimalToNumber(l.drop1Php),
      onPlanogram: l.onPlanogram,
      quotaPhp: decimalToNumber(l.quotaPhp),
      minLevelDays: decimalToNumber(l.minLevelDays),
      deliveryFreqMonth: decimalToNumber(l.deliveryFreqMonth),
    })),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${run.documentNumber} · v${run.version}`}
        description={run.name}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{run.status}</Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/orders/demand-planning">All runs</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/orders/auto-replenish">Auto replenish</Link>
            </Button>
          </div>
        }
      />
      <DemandPlanDocumentClient run={clientRun} branches={branches} />
    </div>
  );
}
