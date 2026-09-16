"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { useState, useTransition } from "react";

import { Upload } from "lucide-react";
import { toast } from "sonner";

import {
  generateSuggestedOrdersAction,
  runAllocationAction,
  submitSuggestedOrdersAction,
} from "@/features/forecast/actions/forecast.actions";
import {
  downloadSkuForecastTemplateAction,
  importSkuForecastAction,
} from "@/features/demand-planning/actions/sku-forecast-import.actions";

import { AllocationGapsTable } from "@/features/forecast/components/allocation-gaps-table";
import { ImportForecastDialog } from "@/app/(app)/settings/planning/_components/import-forecast-dialog";

import { useTableSelection } from "@/components/data-table/use-table-selection";
import { GlobalDataTable, GlobalTableHead, useClientTableSort } from "@/lib/data-table";
import { KpiCard } from "@/lib/kpi-cards";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface PlanningPanelProps {
  period: {
    id: string;

    label: string;

    isActive: boolean;

    _count?: { allocations: number };
  } | null;

  gapCount: number;

  draftOrders: number;

  targets: {
    id: string;

    revenueLabel: string;

    branch: { name: string; sapCode: string };
  }[];

  gapsResult: {
    items: {
      id: string;
      gapQty: number;
      planogramMax: number;
      currentStock: number;
      branch: { name: string };
      model: { skuCode: string; name: string };
    }[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  branches: { id: string; name: string }[];

  currentBranch?: string;

  currentQ?: string;

  initialSort?: string;

  initialSortDir?: string;
}

export function PlanningPanel({
  period,

  gapCount,

  draftOrders,

  targets,

  gapsResult,

  branches,

  currentBranch,

  currentQ,

  initialSort,

  initialSortDir,
}: PlanningPanelProps) {
  const router = useRouter();

  const [importing, setImporting] = useState(false);

  const [pending, startTransition] = useTransition();
  const targetSelection = useTableSelection(targets.map((target) => target.id));
  const targetSort = useClientTableSort(targets, {
    branch: (t) => t.branch.name,
    sap: (t) => t.branch.sapCode,
    target: (t) => t.revenueLabel,
  });

  function runAction(
    label: string,
    fn: () => Promise<{ error?: string; success?: boolean }>,
  ) {
    startTransition(async () => {
      const result = await fn();

      if (result.error) {
        toast.error(result.error);

        return;
      }

      toast.success(label);

      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <p className="font-medium">Demand Planning is the primary replenishment flow</p>
        <p className="mt-1 text-muted-foreground">
          Import per-SKU SFE forecasts below, then open{" "}
          <Link href="/orders/demand-planning" className="underline underline-offset-2">
            Orders → Demand Planning
          </Link>{" "}
          to run the wizard, review Drop 1, and release Order Requests. The legacy
          shelf-gap allocation buttons remain for reference only.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const file = await downloadSkuForecastTemplateAction(period?.label);
                const bytes = Uint8Array.from(atob(file.base64), (c) => c.charCodeAt(0));
                const blob = new Blob([bytes], {
                  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = file.fileName;
                a.click();
                URL.revokeObjectURL(url);
              })
            }
          >
            Download SKU forecast template
          </Button>
          <label htmlFor="sku-forecast-upload" className="inline-flex cursor-pointer">
            <Input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              id="sku-forecast-upload"
              disabled={pending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                startTransition(async () => {
                  const fd = new FormData();
                  fd.set("file", f);
                  const result = await importSkuForecastAction(fd);
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success(
                    `Imported ${result.upserted} SKU forecasts for ${result.periodLabel}` +
                      (result.skipped ? ` (${result.skipped} skipped)` : ""),
                  );
                  router.refresh();
                });
                e.target.value = "";
              }}
            />
            <Button size="sm" variant="outline" asChild disabled={pending}>
              <span>
                <Upload className="mr-1 size-4" />
                Import SKU forecast
              </span>
            </Button>
          </label>
          <Button size="sm" asChild>
            <Link href="/orders/demand-planning/new">New Demand Planning run</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active period" value={period?.label ?? "None"} />

        <KpiCard label="Allocation gaps" value={String(gapCount)} />

        <KpiCard label="Draft suggestions" value={String(draftOrders)} />

        <KpiCard
          label="Allocation rows"
          value={String(period?._count?.allocations ?? 0)}
        />
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border bg-card p-1.5 shadow-sm">
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg"
          disabled={pending}
          onClick={() => setImporting(true)}
        >
          <Upload className="mr-1 size-4" />
          Import forecast
        </Button>

        {period ? (
          <>
            <Button
              size="sm"
              className="rounded-lg"
              disabled={pending}
              onClick={() =>
                runAction("Allocation computed", () =>
                  runAllocationAction(period.id),
                )
              }
            >
              Run allocation
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={pending}
              onClick={() =>
                runAction("Suggested orders created", () =>
                  generateSuggestedOrdersAction(period.id),
                )
              }
            >
              Generate suggested orders
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={pending || draftOrders === 0}
              onClick={() =>
                runAction("Submitted for TL review", () =>
                  submitSuggestedOrdersAction(),
                )
              }
            >
              Submit drafts for TL review
            </Button>
          </>
        ) : null}

        <Button size="sm" variant="outline" className="rounded-lg" asChild>
          <Link href="/planning/suggested-orders">View suggested orders</Link>
        </Button>
      </div>

      {period ? (
        <>
          <GlobalDataTable
            stickyHeader
            toolbarLeading={
              <span className="text-sm font-medium">Branch revenue targets</span>
            }
            empty={targets.length === 0}
            emptyMessage="No branch revenue targets for this period."
            toolbarActions={
              targetSelection.selectedCount > 0 ? (
                <Button variant="secondary" size="sm" onClick={targetSelection.clearSelection}>
                  {targetSelection.selectedCount} selected
                </Button>
              ) : null
            }
          >
                <TableHeader>
                  <TableRow>
                    <GlobalTableHead className="w-10">
                      <Checkbox
                        checked={targetSelection.isAllSelected || (targetSelection.isPartiallySelected ? "indeterminate" : false)}
                        onCheckedChange={(checked) => targetSelection.toggleAll(checked === true)}
                        aria-label="Select all revenue targets"
                      />
                    </GlobalTableHead>
                    <GlobalTableHead className="w-12">#</GlobalTableHead>
                    <GlobalTableHead {...targetSort.sortProps("branch")}>Branch</GlobalTableHead>
                    <GlobalTableHead {...targetSort.sortProps("sap")}>SAP</GlobalTableHead>
                    <GlobalTableHead
                      className="text-right"
                      {...targetSort.sortProps("target")}
                    >
                      Target
                    </GlobalTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetSort.sorted.map((t, index) => (
                    <TableRow key={t.id} data-state={targetSelection.isRowSelected(t.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={targetSelection.isRowSelected(t.id)}
                          onCheckedChange={(checked) => targetSelection.toggleRow(t.id, checked === true)}
                          aria-label={`Select target for ${t.branch.name}`}
                        />
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{t.branch.name}</TableCell>
                      <TableCell className="font-mono text-sm">{t.branch.sapCode}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.revenueLabel}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
          </GlobalDataTable>

          <AllocationGapsTable
            basePath="/settings/planning"
            result={gapsResult}
            branches={branches}
            currentBranch={currentBranch}
            currentQ={currentQ}
            initialSort={initialSort}
            initialSortDir={initialSortDir}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No active planning period. Download the Forecast template to set the period
          and each branch&apos;s revenue target.
        </p>
      )}

      <ImportForecastDialog open={importing} onOpenChange={setImporting} />
    </div>
  );
}