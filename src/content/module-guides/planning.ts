import type { ModuleGuideContent } from "@/content/module-guides/types";

export const PLANNING_MODULE_GUIDE: ModuleGuideContent = {
  title: "Planning & Forecast",
  description:
    "Import branch revenue targets and per-SKU SFE forecasts. Demand Planning under Orders turns those inputs into a versioned Drop 1 plan and releases Auto replenish orders.",
  tips: [
    { label: "Download the Forecast template for branch revenue targets, and the SKU forecast template for per-model SFE qty" },
    { label: "Open Orders → Demand Planning to run the wizard across branches" },
    { label: "Use Replenishment Workbench for live mid-cycle adjustments on one branch" },
    { label: "Coverage under Reports shows days of inventory versus the cycle target" },
  ],
  storageKey: "module-guide.planning",
};

/** Own short strip for Suggested orders — related to planning, not identical. */
export const SUGGESTED_ORDERS_MODULE_GUIDE: ModuleGuideContent = {
  title: "Suggested orders",
  description:
    "Legacy shelf-gap drafts. Prefer Demand Planning for Drop 1 recommendations that release into Auto replenish.",
  tips: [
    { label: "New replenishment work starts under Orders → Demand Planning" },
    { label: "This page redirects to Demand Planning" },
  ],
  storageKey: "module-guide.suggested-orders",
};
