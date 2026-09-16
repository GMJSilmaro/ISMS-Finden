"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  previewWorkbenchBranchAction,
  sendWorkbenchSelectionAction,
} from "@/features/demand-planning/actions/demand-planning.actions";
import {
  ReplenishmentGrid,
  type ReplenishmentGridLine,
} from "@/features/demand-planning/components/replenishment-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  branchId: string;
  branchName: string;
  salesPeriodLabel: string;
  deliveryFrequencyPerMonth: number;
  frequencyCode: string | null;
  computed: {
    quotaPhp: number;
    minLevelDays: number;
    minLevelPhp: number;
    historyPhpTotal: number;
    totals: {
      milQty: number;
      onHand: number;
      displayUnits: number;
      forecastQty: number;
      allocQty: number;
      drop1Qty: number;
    };
    lines: ReplenishmentGridLine[];
  };
  coverageStages: { label: string; php: number; days: number }[];
}

export function WorkbenchClient({
  branchId,
  salesPeriodLabel: initialPeriod,
  deliveryFrequencyPerMonth: initialFreq,
  frequencyCode,
  computed: initialComputed,
  coverageStages: initialStages,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [period, setPeriod] = useState(initialPeriod);
  const [freq, setFreq] = useState(String(initialFreq));
  const [deriveQuota, setDeriveQuota] = useState(true);
  const [lines, setLines] = useState(initialComputed.lines);
  const [totals, setTotals] = useState(initialComputed.totals);
  const [quotaPhp, setQuotaPhp] = useState(initialComputed.quotaPhp);
  const [minLevelDays, setMinLevelDays] = useState(initialComputed.minLevelDays);
  const [minLevelPhp, setMinLevelPhp] = useState(initialComputed.minLevelPhp);
  const [historyPhp, setHistoryPhp] = useState(initialComputed.historyPhpTotal);
  const [stages, setStages] = useState(initialStages);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<
    Map<string, { displayUnits?: number; forecastQty?: number }>
  >(new Map());

  const selectedCount = useMemo(
    () => [...selected].filter((id) => (lines.find((l) => l.modelId === id)?.drop1Qty ?? 0) > 0)
      .length,
    [selected, lines],
  );

  function refresh(nextOverrides = overrides) {
    startTransition(async () => {
      const result = await previewWorkbenchBranchAction({
        branchId,
        salesPeriodLabel: period,
        deliveryFrequencyPerMonth: Number(freq) || undefined,
        deriveQuotaFromForecast: deriveQuota,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { computed, coverageStages } = result.preview;
      // Apply local DU/FC overrides on top of live preview for immediate feedback.
      let nextLines = computed.lines.map((l) => {
        const o = nextOverrides.get(l.modelId);
        return {
          ...l,
          displayUnits: o?.displayUnits ?? l.displayUnits,
          forecastQty: o?.forecastQty ?? l.forecastQty,
        };
      });
      // If overrides exist, ask server again is heavy — for UX, keep server lines and
      // only patch displayed DU/FC; Drop 1 updates after full refresh without override map
      // unless we recompute client-side. Keep simple: clear means server truth.
      if (nextOverrides.size === 0) {
        nextLines = computed.lines;
      }
      setLines(nextLines);
      setTotals(computed.totals);
      setQuotaPhp(computed.quotaPhp);
      setMinLevelDays(computed.minLevelDays);
      setMinLevelPhp(computed.minLevelPhp);
      setHistoryPhp(computed.historyPhpTotal);
      setStages(coverageStages);
      router.replace(
        `/orders/replenishment/${branchId}?period=${encodeURIComponent(period)}`,
      );
    });
  }

  function onChangeLine(
    modelId: string,
    patch: { displayUnits?: number; forecastQty?: number },
  ) {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(modelId, { ...next.get(modelId), ...patch });
      return next;
    });
    setLines((prev) =>
      prev.map((l) => (l.modelId === modelId ? { ...l, ...patch } : l)),
    );
    toast.message("Override noted — recalculate to refresh Drop 1");
  }

  function sendSelected() {
    const payload = lines
      .filter((l) => selected.has(l.modelId) && l.drop1Qty > 0)
      .map((l) => ({ modelId: l.modelId, quantity: l.drop1Qty }));
    if (payload.length === 0) {
      toast.error("Select lines with Drop 1 quantity");
      return;
    }
    startTransition(async () => {
      const result = await sendWorkbenchSelectionAction({
        branchId,
        salesPeriodLabel: period,
        lines: payload,
        submitForReview: true,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Sent ${result.order.orderNumber} for ${result.order.branchName}`);
      setSelected(new Set());
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-4 rounded-lg border p-4 h-fit">
        <div className="space-y-2">
          <Label htmlFor="wb-period">Sales period</Label>
          <Input id="wb-period" value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wb-freq">Delivery frequency / mo</Label>
          <Input
            id="wb-freq"
            type="number"
            min={1}
            step={0.1}
            value={freq}
            onChange={(e) => setFreq(e.target.value)}
          />
          {frequencyCode ? (
            <p className="text-xs text-muted-foreground">Branch schedule: {frequencyCode}</p>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={deriveQuota} onCheckedChange={(v) => setDeriveQuota(Boolean(v))} />
          Derive quota from forecast total
        </label>
        <Button className="w-full" disabled={pending} onClick={() => refresh(new Map())}>
          {pending ? "Updating…" : "Recalculate"}
        </Button>

        <div className="space-y-1 border-t pt-3 text-sm">
          <Row label="Min level" value={`${minLevelDays.toFixed(1)} d`} />
          <Row label="Quota ₱" value={`₱${Math.round(quotaPhp).toLocaleString()}`} />
          <Row label="Min level ₱" value={`₱${Math.round(minLevelPhp).toLocaleString()}`} />
          <Row label="History ₱" value={`₱${Math.round(historyPhp).toLocaleString()}`} />
          <Row label="MIL" value={`${totals.milQty} u`} />
          <Row label="On hand" value={`${totals.onHand} u`} />
          <Row label="Display units" value={`${totals.displayUnits} u`} />
          <Row label="Forecast" value={`${totals.forecastQty} u`} />
          <Row label="Allocation" value={`${totals.allocQty} u`} />
          <Row label="Drop 1" value={`${totals.drop1Qty} u`} />
        </div>

        <div className="space-y-1 border-t pt-3">
          <div className="text-xs font-medium uppercase text-muted-foreground">Coverage (DII)</div>
          {stages.map((s) => (
            <Row key={s.label} label={s.label} value={`${s.days.toFixed(1)} d`} />
          ))}
        </div>
      </aside>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending || selectedCount === 0} onClick={sendSelected}>
            Send selected to Ordering ({selectedCount})
          </Button>
          <Button
            variant="outline"
            disabled={pending || overrides.size === 0}
            onClick={() => {
              setOverrides(new Map());
              refresh(new Map());
            }}
          >
            Reset overrides
          </Button>
        </div>
        <ReplenishmentGrid
          lines={lines}
          editable
          selectable
          busy={pending}
          selectedModelIds={selected}
          onToggleSelect={(modelId, on) =>
            setSelected((prev) => {
              const next = new Set(prev);
              if (on) next.add(modelId);
              else next.delete(modelId);
              return next;
            })
          }
          onChangeLine={onChangeLine}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  );
}
