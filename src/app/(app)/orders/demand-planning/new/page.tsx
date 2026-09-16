import { listBranchesForDemandPlanAction } from "@/features/demand-planning/actions/demand-planning.actions";
import { requireAnyPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/app/(app)/_components/page-header";
import { DemandPlanWizard } from "@/app/(app)/orders/demand-planning/new/_components/demand-plan-wizard";

export default async function NewDemandPlanPage() {
  await requireAnyPermission(["forecast.manage", "planogram.manage"]);
  const branches = await listBranchesForDemandPlanAction();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Demand Planning run"
        description="Scope the period and branches, confirm sources, then review Drop 1 before releasing to Ordering."
      />
      <DemandPlanWizard branches={branches} />
    </div>
  );
}
