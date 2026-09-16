-- CreateEnum
CREATE TYPE "DemandPlanStatus" AS ENUM ('draft', 'generated', 'released', 'superseded');

-- CreateEnum
CREATE TYPE "DemandPlanOrigin" AS ENUM ('wizard', 'workbench', 'mid_cycle');

-- CreateTable
CREATE TABLE "branch_sku_forecasts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "forecast_qty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_sku_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_display_units" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_display_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_planning_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_id" TEXT,
    "document_number" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "status" "DemandPlanStatus" NOT NULL DEFAULT 'draft',
    "origin" "DemandPlanOrigin" NOT NULL DEFAULT 'wizard',
    "sales_period_label" TEXT NOT NULL,
    "sales_period_start" TIMESTAMP(3) NOT NULL,
    "sales_period_end" TIMESTAMP(3) NOT NULL,
    "history_start" TIMESTAMP(3) NOT NULL,
    "history_end" TIMESTAMP(3) NOT NULL,
    "delivery_frequency_per_month" DECIMAL(8,4),
    "month_basis_days" DECIMAL(6,2) NOT NULL DEFAULT 30.5,
    "derive_quota_from_forecast" BOOLEAN NOT NULL DEFAULT true,
    "quota_override_php" DECIMAL(14,2),
    "floor_allocation_at_zero" BOOLEAN NOT NULL DEFAULT true,
    "round_up_slow_movers" BOOLEAN NOT NULL DEFAULT true,
    "source_snapshot" JSONB,
    "computed_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "released_by_id" TEXT,
    "superseded_by_id" TEXT,
    "parent_run_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_planning_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_planning_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "series_code" TEXT,
    "on_planogram" BOOLEAN NOT NULL DEFAULT true,
    "srp" DECIMAL(12,2) NOT NULL,
    "history_qty" DECIMAL(12,4) NOT NULL,
    "history_php" DECIMAL(14,2) NOT NULL,
    "hmix" DECIMAL(12,8) NOT NULL,
    "adj_mix" DECIMAL(12,8) NOT NULL,
    "mil_qty" INTEGER NOT NULL,
    "mil_php" DECIMAL(14,2) NOT NULL,
    "display_units" INTEGER NOT NULL DEFAULT 0,
    "on_hand" INTEGER NOT NULL,
    "forecast_qty" INTEGER NOT NULL,
    "forecast_php" DECIMAL(14,2) NOT NULL,
    "alloc_qty" INTEGER NOT NULL,
    "alloc_php" DECIMAL(14,2) NOT NULL,
    "cycle_qty" INTEGER NOT NULL,
    "drop1_qty" INTEGER NOT NULL,
    "drop1_php" DECIMAL(14,2) NOT NULL,
    "released_drop1_qty" INTEGER,
    "min_level_days" DECIMAL(8,4) NOT NULL,
    "quota_php" DECIMAL(14,2) NOT NULL,
    "delivery_freq_month" DECIMAL(8,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_planning_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_planning_override_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "line_id" TEXT,
    "field" TEXT NOT NULL,
    "previous_value" TEXT NOT NULL,
    "new_value" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_planning_override_logs_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "branch_orders" ADD COLUMN "demand_planning_run_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "branch_sku_forecasts_period_id_branch_id_model_id_key" ON "branch_sku_forecasts"("period_id", "branch_id", "model_id");
CREATE INDEX "branch_sku_forecasts_tenant_id_period_id_idx" ON "branch_sku_forecasts"("tenant_id", "period_id");
CREATE INDEX "branch_sku_forecasts_tenant_id_branch_id_idx" ON "branch_sku_forecasts"("tenant_id", "branch_id");

CREATE UNIQUE INDEX "branch_display_units_branch_id_model_id_key" ON "branch_display_units"("branch_id", "model_id");
CREATE INDEX "branch_display_units_tenant_id_idx" ON "branch_display_units"("tenant_id");

CREATE UNIQUE INDEX "demand_planning_runs_tenant_id_document_number_version_key" ON "demand_planning_runs"("tenant_id", "document_number", "version");
CREATE INDEX "demand_planning_runs_tenant_id_status_idx" ON "demand_planning_runs"("tenant_id", "status");
CREATE INDEX "demand_planning_runs_tenant_id_sales_period_label_idx" ON "demand_planning_runs"("tenant_id", "sales_period_label");

CREATE UNIQUE INDEX "demand_planning_lines_run_id_branch_id_model_id_key" ON "demand_planning_lines"("run_id", "branch_id", "model_id");
CREATE INDEX "demand_planning_lines_tenant_id_run_id_idx" ON "demand_planning_lines"("tenant_id", "run_id");
CREATE INDEX "demand_planning_lines_tenant_id_branch_id_idx" ON "demand_planning_lines"("tenant_id", "branch_id");

CREATE INDEX "demand_planning_override_logs_tenant_id_run_id_idx" ON "demand_planning_override_logs"("tenant_id", "run_id");
CREATE INDEX "branch_orders_demand_planning_run_id_idx" ON "branch_orders"("demand_planning_run_id");

-- AddForeignKey
ALTER TABLE "branch_sku_forecasts" ADD CONSTRAINT "branch_sku_forecasts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "branch_sku_forecasts" ADD CONSTRAINT "branch_sku_forecasts_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "planning_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "branch_sku_forecasts" ADD CONSTRAINT "branch_sku_forecasts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "branch_sku_forecasts" ADD CONSTRAINT "branch_sku_forecasts_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "branch_display_units" ADD CONSTRAINT "branch_display_units_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "branch_display_units" ADD CONSTRAINT "branch_display_units_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "branch_display_units" ADD CONSTRAINT "branch_display_units_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "demand_planning_runs" ADD CONSTRAINT "demand_planning_runs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "demand_planning_runs" ADD CONSTRAINT "demand_planning_runs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "planning_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "demand_planning_runs" ADD CONSTRAINT "demand_planning_runs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "demand_planning_runs" ADD CONSTRAINT "demand_planning_runs_released_by_id_fkey" FOREIGN KEY ("released_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "demand_planning_runs" ADD CONSTRAINT "demand_planning_runs_parent_run_id_fkey" FOREIGN KEY ("parent_run_id") REFERENCES "demand_planning_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "demand_planning_runs" ADD CONSTRAINT "demand_planning_runs_superseded_by_id_fkey" FOREIGN KEY ("superseded_by_id") REFERENCES "demand_planning_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "demand_planning_lines" ADD CONSTRAINT "demand_planning_lines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "demand_planning_lines" ADD CONSTRAINT "demand_planning_lines_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "demand_planning_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "demand_planning_lines" ADD CONSTRAINT "demand_planning_lines_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "demand_planning_lines" ADD CONSTRAINT "demand_planning_lines_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "demand_planning_override_logs" ADD CONSTRAINT "demand_planning_override_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "demand_planning_override_logs" ADD CONSTRAINT "demand_planning_override_logs_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "demand_planning_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "demand_planning_override_logs" ADD CONSTRAINT "demand_planning_override_logs_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "demand_planning_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "demand_planning_override_logs" ADD CONSTRAINT "demand_planning_override_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "branch_orders" ADD CONSTRAINT "branch_orders_demand_planning_run_id_fkey" FOREIGN KEY ("demand_planning_run_id") REFERENCES "demand_planning_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
