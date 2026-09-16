"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils/cn";

export interface ReplenishmentGridLine {
  id?: string;
  modelId: string;
  skuCode: string;
  seriesCode: string;
  srp: number;
  historyQty: number;
  historyPhp: number;
  hmix: number;
  adjMix: number;
  milQty: number;
  milPhp: number;
  displayUnits: number;
  onHand: number;
  forecastQty: number;
  forecastPhp: number;
  allocQty: number;
  allocPhp: number;
  cycleQty: number;
  drop1Qty: number;
  drop1Php: number;
  onPlanogram?: boolean;
}

type Band = "history" | "mil" | "onHand" | "forecast" | "allocation" | "delivery";

const BANDS: { id: Band; label: string }[] = [
  { id: "history", label: "History" },
  { id: "mil", label: "MIL" },
  { id: "onHand", label: "On hand" },
  { id: "forecast", label: "Forecast" },
  { id: "allocation", label: "Allocation" },
  { id: "delivery", label: "Delivery" },
];

function peso(n: number) {
  return n.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

interface ReplenishmentGridProps {
  lines: ReplenishmentGridLine[];
  editable?: boolean;
  selectable?: boolean;
  showNilLines?: boolean;
  selectedModelIds?: Set<string>;
  onToggleSelect?: (modelId: string, selected: boolean) => void;
  onChangeLine?: (
    modelId: string,
    patch: { displayUnits?: number; forecastQty?: number },
  ) => void;
  busy?: boolean;
}

export function ReplenishmentGrid({
  lines,
  editable = false,
  selectable = false,
  showNilLines: showNilProp,
  selectedModelIds,
  onToggleSelect,
  onChangeLine,
  busy,
}: ReplenishmentGridProps) {
  const [bands, setBands] = useState<Record<Band, boolean>>({
    history: true,
    mil: true,
    onHand: true,
    forecast: true,
    allocation: true,
    delivery: true,
  });
  const [showNil, setShowNil] = useState(showNilProp ?? false);

  const visible = useMemo(() => {
    if (showNil) return lines;
    return lines.filter(
      (l) =>
        l.drop1Qty > 0 ||
        l.allocQty > 0 ||
        l.forecastQty > 0 ||
        l.milQty > 0 ||
        l.onHand > 0,
    );
  }, [lines, showNil]);

  const totals = useMemo(() => {
    return visible.reduce(
      (acc, l) => {
        acc.historyQty += l.historyQty;
        acc.historyPhp += l.historyPhp;
        acc.milQty += l.milQty;
        acc.milPhp += l.milPhp;
        acc.du += l.displayUnits;
        acc.onHand += l.onHand;
        acc.fcQty += l.forecastQty;
        acc.fcPhp += l.forecastPhp;
        acc.allocQty += l.allocQty;
        acc.allocPhp += l.allocPhp;
        acc.drop1Qty += l.drop1Qty;
        acc.drop1Php += l.drop1Php;
        return acc;
      },
      {
        historyQty: 0,
        historyPhp: 0,
        milQty: 0,
        milPhp: 0,
        du: 0,
        onHand: 0,
        fcQty: 0,
        fcPhp: 0,
        allocQty: 0,
        allocPhp: 0,
        drop1Qty: 0,
        drop1Php: 0,
      },
    );
  }, [visible]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">Bands</span>
        {BANDS.map((b) => (
          <label key={b.id} className="inline-flex items-center gap-1.5">
            <Checkbox
              checked={bands[b.id]}
              onCheckedChange={(v) =>
                setBands((prev) => ({ ...prev, [b.id]: Boolean(v) }))
              }
            />
            {b.label}
          </label>
        ))}
        <label className="ml-auto inline-flex items-center gap-1.5">
          <Checkbox checked={showNil} onCheckedChange={(v) => setShowNil(Boolean(v))} />
          Show nil lines
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              {selectable ? <TableHead className="w-10" /> : null}
              <TableHead>Model</TableHead>
              <TableHead>Series</TableHead>
              <TableHead className="text-right">SRP</TableHead>
              {bands.history ? (
                <>
                  <TableHead className="text-right">Hist qty</TableHead>
                  <TableHead className="text-right">Hist ₱</TableHead>
                  <TableHead className="text-right">Mix</TableHead>
                  <TableHead className="text-right">Adj mix</TableHead>
                </>
              ) : null}
              {bands.mil ? (
                <>
                  <TableHead className="text-right">MIL qty</TableHead>
                  <TableHead className="text-right">MIL ₱</TableHead>
                </>
              ) : null}
              {bands.onHand ? (
                <>
                  <TableHead className="text-right">DU{editable ? " ✎" : ""}</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                </>
              ) : null}
              {bands.forecast ? (
                <>
                  <TableHead className="text-right">FC qty{editable ? " ✎" : ""}</TableHead>
                  <TableHead className="text-right">FC ₱</TableHead>
                </>
              ) : null}
              {bands.allocation ? (
                <>
                  <TableHead className="text-right">Alloc qty</TableHead>
                  <TableHead className="text-right">Alloc ₱</TableHead>
                </>
              ) : null}
              {bands.delivery ? (
                <>
                  <TableHead className="text-right">Drop 1</TableHead>
                  <TableHead className="text-right">Cycle</TableHead>
                  <TableHead className="text-right">Drop 1 ₱</TableHead>
                </>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((l) => {
              const selected = selectedModelIds?.has(l.modelId) ?? false;
              return (
                <TableRow
                  key={l.modelId}
                  className={cn(selected && "bg-primary/5", !l.onPlanogram && "opacity-60")}
                >
                  {selectable ? (
                    <TableCell>
                      <Checkbox
                        checked={selected}
                        disabled={busy || l.drop1Qty <= 0}
                        onCheckedChange={(v) => onToggleSelect?.(l.modelId, Boolean(v))}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className="font-medium whitespace-nowrap">{l.skuCode}</TableCell>
                  <TableCell>{l.seriesCode}</TableCell>
                  <TableCell className="text-right tabular-nums">{peso(l.srp)}</TableCell>
                  {bands.history ? (
                    <>
                      <TableCell className="text-right tabular-nums">
                        {l.historyQty.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {peso(l.historyPhp)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{pct(l.hmix)}</TableCell>
                      <TableCell className="text-right tabular-nums">{pct(l.adjMix)}</TableCell>
                    </>
                  ) : null}
                  {bands.mil ? (
                    <>
                      <TableCell className="text-right tabular-nums">{l.milQty}</TableCell>
                      <TableCell className="text-right tabular-nums">{peso(l.milPhp)}</TableCell>
                    </>
                  ) : null}
                  {bands.onHand ? (
                    <>
                      <TableCell className="text-right">
                        {editable ? (
                          <Input
                            type="number"
                            min={0}
                            className="ml-auto h-8 w-20 text-right"
                            defaultValue={l.displayUnits}
                            disabled={busy}
                            onBlur={(e) => {
                              const n = Number(e.target.value);
                              if (Number.isFinite(n) && n !== l.displayUnits) {
                                onChangeLine?.(l.modelId, { displayUnits: Math.max(0, Math.trunc(n)) });
                              }
                            }}
                          />
                        ) : (
                          <span className="tabular-nums">{l.displayUnits}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{l.onHand}</TableCell>
                    </>
                  ) : null}
                  {bands.forecast ? (
                    <>
                      <TableCell className="text-right">
                        {editable ? (
                          <Input
                            type="number"
                            min={0}
                            className="ml-auto h-8 w-20 text-right"
                            defaultValue={l.forecastQty}
                            disabled={busy}
                            onBlur={(e) => {
                              const n = Number(e.target.value);
                              if (Number.isFinite(n) && n !== l.forecastQty) {
                                onChangeLine?.(l.modelId, { forecastQty: Math.max(0, Math.trunc(n)) });
                              }
                            }}
                          />
                        ) : (
                          <span className="tabular-nums">{l.forecastQty}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{peso(l.forecastPhp)}</TableCell>
                    </>
                  ) : null}
                  {bands.allocation ? (
                    <>
                      <TableCell className="text-right tabular-nums">{l.allocQty}</TableCell>
                      <TableCell className="text-right tabular-nums">{peso(l.allocPhp)}</TableCell>
                    </>
                  ) : null}
                  {bands.delivery ? (
                    <>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {l.drop1Qty}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {l.cycleQty}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{peso(l.drop1Php)}</TableCell>
                    </>
                  ) : null}
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/30 font-medium">
              {selectable ? <TableCell /> : null}
              <TableCell colSpan={3}>{visible.length} lines</TableCell>
              {bands.history ? (
                <>
                  <TableCell className="text-right tabular-nums">
                    {totals.historyQty.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {peso(totals.historyPhp)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </>
              ) : null}
              {bands.mil ? (
                <>
                  <TableCell className="text-right tabular-nums">{totals.milQty}</TableCell>
                  <TableCell className="text-right tabular-nums">{peso(totals.milPhp)}</TableCell>
                </>
              ) : null}
              {bands.onHand ? (
                <>
                  <TableCell className="text-right tabular-nums">{totals.du}</TableCell>
                  <TableCell className="text-right tabular-nums">{totals.onHand}</TableCell>
                </>
              ) : null}
              {bands.forecast ? (
                <>
                  <TableCell className="text-right tabular-nums">{totals.fcQty}</TableCell>
                  <TableCell className="text-right tabular-nums">{peso(totals.fcPhp)}</TableCell>
                </>
              ) : null}
              {bands.allocation ? (
                <>
                  <TableCell className="text-right tabular-nums">{totals.allocQty}</TableCell>
                  <TableCell className="text-right tabular-nums">{peso(totals.allocPhp)}</TableCell>
                </>
              ) : null}
              {bands.delivery ? (
                <>
                  <TableCell className="text-right tabular-nums">{totals.drop1Qty}</TableCell>
                  <TableCell />
                  <TableCell className="text-right tabular-nums">{peso(totals.drop1Php)}</TableCell>
                </>
              ) : null}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
