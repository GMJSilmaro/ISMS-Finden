import Link from "next/link";

import { listBranchesForWorkbenchAction } from "@/features/demand-planning/actions/demand-planning.actions";
import { requireAnyPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/app/(app)/_components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ReplenishmentWorkbenchIndexPage() {
  await requireAnyPermission(["forecast.manage", "planogram.manage"]);
  const branches = await listBranchesForWorkbenchAction();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Replenishment Workbench"
        description="Live per-branch worksheet — adjust display units and forecast, then send selected Drop 1 lines to Ordering."
        actions={
          <Button asChild variant="outline">
            <Link href="/orders/demand-planning">Demand Planning runs</Link>
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dealer</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>SAP</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.dealerName ?? "—"}</TableCell>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>{b.sapCode}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/orders/replenishment/${b.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
