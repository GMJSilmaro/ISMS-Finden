import Link from "next/link";

import { listDemandPlansAction } from "@/features/demand-planning/actions/demand-planning.actions";
import { requireAnyPermission } from "@/lib/auth/permissions";
import { parseTablePageSize } from "@/components/data-table/table-page-size";
import { PageHeader } from "@/app/(app)/_components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; q?: string; status?: string }>;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  generated: "secondary",
  released: "default",
  superseded: "destructive",
};

export default async function DemandPlanningListPage({ searchParams }: PageProps) {
  await requireAnyPermission(["forecast.manage", "planogram.manage"]);
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = parseTablePageSize(params.limit);

  const result = await listDemandPlansAction({
    page,
    limit,
    q: params.q,
    status: params.status as "draft" | "generated" | "released" | "superseded" | undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demand Planning"
        description="Monthly branch replenishment runs — versioned documents that release into Auto replenish orders."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/orders/replenishment">Workbench</Link>
            </Button>
            <Button asChild>
              <Link href="/orders/demand-planning/new">New run</Link>
            </Button>
          </div>
        }
      />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Lines</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No demand plans yet. Start a new run to generate Drop 1 suggestions.
                </TableCell>
              </TableRow>
            ) : (
              result.items.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">
                    {run.documentNumber}
                    <span className="text-muted-foreground"> · v{run.version}</span>
                  </TableCell>
                  <TableCell>{run.name}</TableCell>
                  <TableCell>{run.salesPeriodLabel}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[run.status] ?? "outline"}>
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{run._count.lines}</TableCell>
                  <TableCell>{run.createdBy.name ?? run.createdBy.email}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/orders/demand-planning/${run.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
