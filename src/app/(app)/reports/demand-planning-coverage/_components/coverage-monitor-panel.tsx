"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { getCoverageMonitorAction } from "@/features/demand-planning/actions/demand-planning.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CoverageData = Extract<
  Awaited<ReturnType<typeof getCoverageMonitorAction>>,
  { ok: true }
>["data"];

function defaultPeriod() {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function CoverageMonitorPanel() {
  const [pending, startTransition] = useTransition();
  const [period, setPeriod] = useState(defaultPeriod());
  const [data, setData] = useState<CoverageData | null>(null);

  function load() {
    startTransition(async () => {
      const result = await getCoverageMonitorAction(period);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setData(result.data);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="cov-period">Sales period</Label>
          <Input
            id="cov-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-56"
          />
        </div>
        <Button disabled={pending} onClick={load}>
          {pending ? "Loading…" : "Load coverage"}
        </Button>
      </div>

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              label="Branches planned"
              value={`${data.kpis.branchesPlanned} / ${data.kpis.branchesTotal}`}
            />
            <Kpi
              label="Network target"
              value={`₱${Math.round(data.kpis.networkTargetPhp).toLocaleString()} · ${data.kpis.networkTargetUnits} u`}
            />
            <Kpi
              label="Planned allocation"
              value={`₱${Math.round(data.kpis.plannedAllocPhp).toLocaleString()} · ${data.kpis.plannedAllocUnits} u`}
            />
            <Kpi
              label="Coverage at allocation"
              value={`${data.kpis.coverageDaysAtAllocation.toFixed(1)} d`}
            />
          </div>

          {data.run ? (
            <p className="text-sm text-muted-foreground">
              Reading {data.run.documentNumber} v{data.run.version} ({data.run.status})
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No generated/released plan for this period yet — targets still show below.
            </p>
          )}

          {data.coverageStages ? (
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-medium">
                Days of inventory — {data.coverageStages.branchName}
              </h3>
              <div className="space-y-2">
                {data.coverageStages.stages.map((s) => (
                  <div key={s.label} className="grid grid-cols-[1fr_80px_1fr] items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="text-right tabular-nums">{s.days.toFixed(1)} d</span>
                    <div className="h-2 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary/70"
                        style={{
                          width: `${Math.min(100, (s.days / Math.max(data.coverageStages!.minLevelDays * 6, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  Red line target ≈ {data.coverageStages.minLevelDays.toFixed(1)} d / cycle
                </p>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Target ₱</TableHead>
                  <TableHead className="text-right">Target u</TableHead>
                  <TableHead className="text-right">MIL</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Alloc</TableHead>
                  <TableHead className="text-right">Drop 1</TableHead>
                  <TableHead className="text-right">Coverage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.branchRollup.map((b) => (
                  <TableRow key={b.branchId}>
                    <TableCell>
                      {b.dealerName ? `${b.dealerName} · ` : null}
                      {b.branchName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Math.round(b.targetPhp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{b.targetUnits}</TableCell>
                    <TableCell className="text-right tabular-nums">{b.milQty ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{b.onHand ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{b.allocQty ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{b.drop1Qty ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {b.coverageDays != null ? `${b.coverageDays.toFixed(1)} d` : "—"}
                    </TableCell>
                    <TableCell>{b.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Load a period to see network coverage versus the min-level cycle target.
        </p>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold tabular-nums">{value}</div>
    </div>
  );
}
