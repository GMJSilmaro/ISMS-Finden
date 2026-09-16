import { requireAnyPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/app/(app)/_components/page-header";
import { CoverageMonitorPanel } from "@/app/(app)/reports/demand-planning-coverage/_components/coverage-monitor-panel";

export default async function DemandPlanningCoveragePage() {
  await requireAnyPermission(["forecast.manage", "planogram.manage", "reports.view"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demand Planning coverage"
        description="Network roll-up of targets, allocation, Drop 1, and days-of-inventory by stage. Reads the latest plan — it does not create one."
      />
      <CoverageMonitorPanel />
    </div>
  );
}
