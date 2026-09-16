"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  computeDemandPlanAction,
  releaseDemandPlanAction,
  updateDemandPlanLineAction,
} from "@/features/demand-planning/actions/demand-planning.actions";
import {
  ReplenishmentGrid,
  type ReplenishmentGridLine,
} from "@/features/demand-planning/components/replenishment-grid";
import { Button } from "@/components/ui/button";

interface Line extends ReplenishmentGridLine {
  id: string;
  branchId: string;
  quotaPhp: number;
  minLevelDays: number;
  deliveryFreqMonth: number;
}

interface Props {
  run: {
    id: string;
    documentNumber: string;
    version: number;
    name: string;
    status: string;
    salesPeriodLabel: string;
    monthBasisDays: number;
    editable: boolean;
    lines: Line[];
  };
  branches: { id: string; name: string; dealerName: string | null }[];
}

export function DemandPlanDocumentClient({ run, branches }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [lines, setLines] = useState(run.lines);

  const branchLines = useMemo(
    () => lines.filter((l) => l.branchId === branchId),
    [lines, branchId],
  );

  const header = useMemo(() => {
    const first = branchLines[0];
    if (!first) return null;
    const allocQty = branchLines.reduce((s, l) => s + l.allocQty, 0);
    const allocPhp = branchLines.reduce((s, l) => s + l.allocPhp, 0);
    const drop1Qty = branchLines.reduce((s, l) => s + l.drop1Qty, 0);
    const drop1Php = branchLines.reduce((s, l) => s + l.drop1Php, 0);
    return {
      quotaPhp: first.quotaPhp,
      minLevelDays: first.minLevelDays,
      deliveryFreq: first.deliveryFreqMonth,
      allocQty,
      allocPhp,
      drop1Qty,
      drop1Php,
      planogramSkus: branchLines.filter((l) => l.onPlanogram).length,
    };
  }, [branchLines]);

  function recalculate() {
    startTransition(async () => {
      const result = await computeDemandPlanAction(run.id);
      if (!result.ok || !result.run) {
        toast.error(result.ok ? "Failed" : result.error);
        return;
      }
      toast.success("Recalculated");
      router.refresh();
    });
  }

  function release() {
    startTransition(async () => {
      const result = await releaseDemandPlanAction(run.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Released ${result.orders.length} order(s)`);
      router.refresh();
    });
  }

  function onChangeLine(
    modelId: string,
    patch: { displayUnits?: number; forecastQty?: number },
  ) {
    const line = lines.find((l) => l.modelId === modelId && l.branchId === branchId);
    if (!line) return;
    startTransition(async () => {
      const result = await updateDemandPlanLineAction({
        runId: run.id,
        lineId: line.id,
        ...patch,
      });
      if (!result.ok || !result.run) {
        toast.error(result.ok ? "Failed" : result.error);
        return;
      }
      setLines(
        result.run.lines.map((l) => ({
          id: l.id,
          branchId: l.branchId,
          modelId: l.modelId,
          skuCode: l.model.skuCode,
          seriesCode: l.seriesCode ?? l.model.skuCode.slice(0, 5),
          srp: Number(l.srp.toString()),
          historyQty: Number(l.historyQty.toString()),
          historyPhp: Number(l.historyPhp.toString()),
          hmix: Number(l.hmix.toString()),
          adjMix: Number(l.adjMix.toString()),
          milQty: l.milQty,
          milPhp: Number(l.milPhp.toString()),
          displayUnits: l.displayUnits,
          onHand: l.onHand,
          forecastQty: l.forecastQty,
          forecastPhp: Number(l.forecastPhp.toString()),
          allocQty: l.allocQty,
          allocPhp: Number(l.allocPhp.toString()),
          cycleQty: l.cycleQty,
          drop1Qty: l.drop1Qty,
          drop1Php: Number(l.drop1Php.toString()),
          onPlanogram: l.onPlanogram,
          quotaPhp: Number(l.quotaPhp.toString()),
          minLevelDays: Number(l.minLevelDays.toString()),
          deliveryFreqMonth: Number(l.deliveryFreqMonth.toString()),
        })),
      );
      toast.success("Updated");
    });
  }

  return (
    <div className="space-y-4">
      {header ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Planogram SKUs" value={String(header.planogramSkus)} />
          <Stat
            label="Quota ₱"
            value={`₱${Math.round(header.quotaPhp).toLocaleString()}`}
          />
          <Stat
            label="Min level"
            value={`${header.minLevelDays.toFixed(1)} d`}
          />
          <Stat
            label="Month allocation"
            value={`${header.allocQty} · ₱${Math.round(header.allocPhp).toLocaleString()}`}
          />
          <Stat
            label="Drop 1 suggested"
            value={`${header.drop1Qty} · ₱${Math.round(header.drop1Php).toLocaleString()}`}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {branches.map((b) => (
          <Button
            key={b.id}
            size="sm"
            variant={branchId === b.id ? "default" : "outline"}
            onClick={() => setBranchId(b.id)}
          >
            {b.dealerName ? `${b.dealerName} · ` : null}
            {b.name}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {run.editable ? (
          <>
            <Button disabled={pending} onClick={recalculate}>
              Recalculate
            </Button>
            <Button disabled={pending || lines.length === 0} onClick={release}>
              Release to Ordering
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            This plan is {run.status}. Lines are frozen; open Workbench for mid-cycle
            adjustments.
          </p>
        )}
      </div>

      <ReplenishmentGrid
        lines={branchLines}
        editable={run.editable}
        busy={pending}
        onChangeLine={onChangeLine}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold tabular-nums">{value}</div>
    </div>
  );
}
