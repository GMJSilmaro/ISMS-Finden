"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  computeDemandPlanAction,
  createDemandPlanDraftAction,
  getDemandPlanDataSourcesAction,
  releaseDemandPlanAction,
  updateDemandPlanLineAction,
} from "@/features/demand-planning/actions/demand-planning.actions";
import {
  ReplenishmentGrid,
  type ReplenishmentGridLine,
} from "@/features/demand-planning/components/replenishment-grid";
import { decimalToNumber } from "@/lib/database/decimal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";

interface BranchOption {
  id: string;
  name: string;
  sapCode: string;
  dealerName: string | null;
}

const STEPS = ["Scope", "Parameters", "Data sources", "Run & review"] as const;

function defaultPeriodLabel() {
  const d = new Date();
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function linesFromRun(run: {
  lines: Array<{
    id: string;
    modelId: string;
    seriesCode: string | null;
    onPlanogram: boolean;
    srp: unknown;
    historyQty: unknown;
    historyPhp: unknown;
    hmix: unknown;
    adjMix: unknown;
    milQty: number;
    milPhp: unknown;
    displayUnits: number;
    onHand: number;
    forecastQty: number;
    forecastPhp: unknown;
    allocQty: number;
    allocPhp: unknown;
    cycleQty: number;
    drop1Qty: number;
    drop1Php: unknown;
    model: { skuCode: string };
  }>;
}): ReplenishmentGridLine[] {
  return run.lines.map((l) => ({
    id: l.id,
    modelId: l.modelId,
    skuCode: l.model.skuCode,
    seriesCode: l.seriesCode ?? l.model.skuCode.slice(0, 5),
    srp: decimalToNumber(l.srp as { toString(): string }),
    historyQty: decimalToNumber(l.historyQty as { toString(): string }),
    historyPhp: decimalToNumber(l.historyPhp as { toString(): string }),
    hmix: decimalToNumber(l.hmix as { toString(): string }),
    adjMix: decimalToNumber(l.adjMix as { toString(): string }),
    milQty: l.milQty,
    milPhp: decimalToNumber(l.milPhp as { toString(): string }),
    displayUnits: l.displayUnits,
    onHand: l.onHand,
    forecastQty: l.forecastQty,
    forecastPhp: decimalToNumber(l.forecastPhp as { toString(): string }),
    allocQty: l.allocQty,
    allocPhp: decimalToNumber(l.allocPhp as { toString(): string }),
    cycleQty: l.cycleQty,
    drop1Qty: l.drop1Qty,
    drop1Php: decimalToNumber(l.drop1Php as { toString(): string }),
    onPlanogram: l.onPlanogram,
  }));
}

export function DemandPlanWizard({ branches }: { branches: BranchOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [runId, setRunId] = useState<string | null>(null);
  const [name, setName] = useState(`${defaultPeriodLabel()} replenishment`);
  const [salesPeriodLabel, setSalesPeriodLabel] = useState(defaultPeriodLabel());
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>(
    () => branches.map((b) => b.id),
  );
  const [deliveryFreq, setDeliveryFreq] = useState<string>("");
  const [deriveQuota, setDeriveQuota] = useState(true);
  const [quotaOverride, setQuotaOverride] = useState("");
  const [roundUpSlow, setRoundUpSlow] = useState(true);
  const [floorZero, setFloorZero] = useState(true);
  const [sourceSummary, setSourceSummary] = useState<string | null>(null);
  const [gridLines, setGridLines] = useState<ReplenishmentGridLine[]>([]);
  const [kpis, setKpis] = useState<{
    linesWithDemand: number;
    allocQty: number;
    allocPhp: number;
    drop1Qty: number;
    drop1Php: number;
    coverageDays: number;
    minLevelDays: number;
  } | null>(null);

  const allSelected = selectedBranchIds.length === branches.length;

  const stepLabel = STEPS[step];

  function toggleBranch(id: string, on: boolean) {
    setSelectedBranchIds((prev) =>
      on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id),
    );
  }

  async function ensureDraft(): Promise<string | null> {
    if (runId) return runId;
    const result = await createDemandPlanDraftAction({
      name,
      salesPeriodLabel,
      branchIds: selectedBranchIds,
      deliveryFrequencyPerMonth: deliveryFreq ? Number(deliveryFreq) : null,
      deriveQuotaFromForecast: deriveQuota,
      quotaOverridePhp: !deriveQuota && quotaOverride ? Number(quotaOverride) : null,
      roundUpSlowMovers: roundUpSlow,
      floorAllocationAtZero: floorZero,
      origin: "wizard",
    });
    if (!result.ok) {
      toast.error(result.error);
      return null;
    }
    setRunId(result.runId);
    toast.success(`Draft ${result.documentNumber} created`);
    return result.runId;
  }

  function goNext() {
    startTransition(async () => {
      if (step === 0) {
        if (!name.trim() || selectedBranchIds.length === 0) {
          toast.error("Name and at least one branch are required");
          return;
        }
        const id = await ensureDraft();
        if (!id) return;
        setStep(1);
        return;
      }
      if (step === 1) {
        setStep(2);
        return;
      }
      if (step === 2) {
        const id = runId ?? (await ensureDraft());
        if (!id) return;
        const stamps = await getDemandPlanDataSourcesAction(id);
        if (!stamps.ok) {
          toast.error(stamps.error);
          return;
        }
        const t = stamps.totals;
        setSourceSummary(
          `History ${t.historySkuCount} SKUs · ₱${Math.round(t.historyPhp).toLocaleString()} · Planogram ${t.planogramSkuCount} · Forecast ${t.forecastUnits} u · On hand ${t.onHandUnits} u · DU ${t.displayUnits}`,
        );
        setStep(3);
        return;
      }
    });
  }

  function runCompute() {
    startTransition(async () => {
      const id = runId ?? (await ensureDraft());
      if (!id) return;
      const result = await computeDemandPlanAction(id);
      if (!result.ok || !result.run) {
        toast.error(result.ok ? "No run returned" : result.error);
        return;
      }
      const lines = linesFromRun(result.run);
      setGridLines(lines);
      const withDemand = lines.filter((l) => l.allocQty > 0 || l.drop1Qty > 0).length;
      const allocQty = lines.reduce((s, l) => s + l.allocQty, 0);
      const allocPhp = lines.reduce((s, l) => s + l.allocPhp, 0);
      const drop1Qty = lines.reduce((s, l) => s + l.drop1Qty, 0);
      const drop1Php = lines.reduce((s, l) => s + l.drop1Php, 0);
      const quota = lines[0]?.srp
        ? lines.reduce((s, l) => s + l.forecastPhp, 0) || 1
        : 1;
      const minLevelDays = decimalToNumber(
        result.run.lines[0]?.minLevelDays as { toString(): string } | undefined,
      );
      const monthBasis = decimalToNumber(result.run.monthBasisDays);
      setKpis({
        linesWithDemand: withDemand,
        allocQty,
        allocPhp,
        drop1Qty,
        drop1Php,
        coverageDays: quota > 0 ? (allocPhp / quota) * monthBasis : 0,
        minLevelDays: minLevelDays || monthBasis / 4,
      });
      toast.success("Recommendation computed");
    });
  }

  function onChangeLine(
    modelId: string,
    patch: { displayUnits?: number; forecastQty?: number },
  ) {
    if (!runId) return;
    const line = gridLines.find((l) => l.modelId === modelId);
    if (!line?.id) return;
    startTransition(async () => {
      const result = await updateDemandPlanLineAction({
        runId,
        lineId: line.id!,
        ...patch,
      });
      if (!result.ok || !result.run) {
        toast.error(result.ok ? "Update failed" : result.error);
        return;
      }
      setGridLines(linesFromRun(result.run));
      toast.success("Line updated");
    });
  }

  function release() {
    if (!runId) return;
    startTransition(async () => {
      const result = await releaseDemandPlanAction(runId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Released ${result.orders.length} order request(s)`);
      router.push(`/orders/demand-planning/${runId}`);
      router.refresh();
    });
  }

  const header = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "rounded-full px-3 py-1",
              i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              i < step && "bg-primary/15 text-primary",
            )}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>
    ),
    [step],
  );

  return (
    <div className="space-y-6">
      {header}
      <p className="text-sm text-muted-foreground">
        Step {step + 1} of {STEPS.length} · {stepLabel}
        {runId ? " · draft saved" : null}
      </p>

      {step === 0 ? (
        <div className="grid max-w-3xl gap-4">
          <div className="space-y-2">
            <Label htmlFor="dp-name">Run name</Label>
            <Input id="dp-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dp-period">Sales period</Label>
            <Input
              id="dp-period"
              value={salesPeriodLabel}
              onChange={(e) => setSalesPeriodLabel(e.target.value)}
              placeholder="December 2025"
            />
            <p className="text-xs text-muted-foreground">
              History window is the prior three calendar months (rolling average).
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Branches in scope</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setSelectedBranchIds(allSelected ? [] : branches.map((b) => b.id))
                }
              >
                {allSelected ? "Clear all" : "Select all"}
              </Button>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
              {branches.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedBranchIds.includes(b.id)}
                    onCheckedChange={(v) => toggleBranch(b.id, Boolean(v))}
                  />
                  <span>
                    {b.dealerName ? `${b.dealerName} · ` : null}
                    {b.name}
                    <span className="text-muted-foreground"> ({b.sapCode})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid max-w-xl gap-4">
          <div className="space-y-2">
            <Label htmlFor="dp-freq">Delivery frequency / month (optional override)</Label>
            <Input
              id="dp-freq"
              type="number"
              min={1}
              step={0.1}
              placeholder="Leave blank to use each branch schedule"
              value={deliveryFreq}
              onChange={(e) => setDeliveryFreq(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Min level days = 30.5 ÷ frequency. Per-branch schedule is used when blank.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={deriveQuota} onCheckedChange={(v) => setDeriveQuota(Boolean(v))} />
            Derive quota from the SFE forecast total
          </label>
          {!deriveQuota ? (
            <div className="space-y-2">
              <Label htmlFor="dp-quota">Quota ₱ (branch target)</Label>
              <Input
                id="dp-quota"
                type="number"
                min={0}
                value={quotaOverride}
                onChange={(e) => setQuotaOverride(e.target.value)}
              />
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={roundUpSlow} onCheckedChange={(v) => setRoundUpSlow(Boolean(v))} />
            Round slow movers up to 1 facing
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={floorZero} onCheckedChange={(v) => setFloorZero(Boolean(v))} />
            Floor allocation at zero
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="max-w-2xl space-y-3 text-sm">
          <p>
            Nothing is fetched until you continue. Sources stamped on the document:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Sales history — 3-month average sold qty &amp; ₱ (ISMS)</li>
            <li>Planogram — SKUs the branch may carry (PM import)</li>
            <li>Forecast / quota — per-SKU SFE import + branch revenue target</li>
            <li>Ending inventory — live STK serial count</li>
            <li>Display units — editable register (netted off allocation)</li>
            <li>Item master &amp; SRP — product models / price lists</li>
          </ul>
          {sourceSummary ? (
            <p className="rounded-md border bg-muted/30 p-3">{sourceSummary}</p>
          ) : (
            <p className="text-muted-foreground">Continue to stamp live counts for this run.</p>
          )}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={runCompute} disabled={pending}>
              {pending ? "Computing…" : gridLines.length ? "Recalculate" : "Run computation"}
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={pending || gridLines.length === 0}
              onClick={release}
            >
              Release to Ordering
            </Button>
          </div>
          {kpis ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Lines with demand" value={String(kpis.linesWithDemand)} />
              <Kpi
                label="Month allocation"
                value={`${kpis.allocQty} · ₱${Math.round(kpis.allocPhp).toLocaleString()}`}
              />
              <Kpi
                label="Drop 1 · suggested"
                value={`${kpis.drop1Qty} · ₱${Math.round(kpis.drop1Php).toLocaleString()}`}
              />
              <Kpi
                label="Coverage after drop"
                value={`${kpis.coverageDays.toFixed(1)} d · target ${kpis.minLevelDays.toFixed(1)} d`}
              />
            </div>
          ) : null}
          {gridLines.length > 0 ? (
            <ReplenishmentGrid
              lines={gridLines}
              editable
              busy={pending}
              onChangeLine={onChangeLine}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Run the computation to review editable recommendation lines.
            </p>
          )}
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending || step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        {step < 3 ? (
          <Button type="button" disabled={pending} onClick={goNext}>
            Next
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
