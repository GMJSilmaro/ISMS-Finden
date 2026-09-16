import { appNavigation, isNavSubGroup, type NavLinkItem } from "@/config/app-navigation";

/**
 * Extra page titles not represented as sidebar leaf links (create flows, nested detail, etc.).
 * Longer paths win over shorter prefixes when resolving.
 */
const EXTRA_ROUTE_TITLES: Record<string, string> = {
  "/sales": "Sales",
  "/sales/new": "New sales transaction",
  "/returns": "Returns / Replacement",
  "/policies/new": "New policy",
  "/operations": "Operations",
  "/planning/suggested-orders": "Suggested orders",
  "/orders/demand-planning": "Demand Planning",
  "/orders/demand-planning/new": "New Demand Planning run",
  "/orders/replenishment": "Replenishment Workbench",
  "/reports/demand-planning-coverage": "Demand Planning coverage",
  "/help": "Help",
  "/settings/profile": "Profile",
  "/settings/roles/matrix": "Role matrix",
  "/settings/permissions": "Permissions",
  "/logistics": "Logistics",
  "/orders": "Orders",
  "/reports": "Reports",
  "/login": "Sign in",
  "/register": "Register",
  "/provider": "Provider overview",
  "/provider/tenants": "Provider tenants",
  "/provider/permissions": "Provider permissions",
};

function collectNavLinks(items: NavLinkItem[]): NavLinkItem[] {
  return items;
}

function navHrefTitles(): Record<string, string> {
  const map: Record<string, string> = {};

  for (const entry of appNavigation) {
    if (entry.type === "link") {
      map[entry.href] = entry.label;
      continue;
    }
    for (const child of entry.items) {
      if (isNavSubGroup(child)) {
        for (const link of collectNavLinks(child.items)) {
          map[link.href] = link.label;
        }
      } else {
        map[child.href] = child.label;
      }
    }
  }

  return map;
}

const ROUTE_TITLES: Record<string, string> = {
  ...navHrefTitles(),
  ...EXTRA_ROUTE_TITLES,
};

/** Master-data slug → display title when no exact map entry exists. */
const MASTER_DATA_TITLES: Record<string, string> = {
  areas: "Areas",
  brands: "Brands",
  "branch-areas": "Branch areas",
  "branch-statuses": "Branch statuses",
  categories: "Categories",
  series: "Series",
  "competitor-brands": "Competitor brands",
  competitors: "Competitors",
  "customer-delivery-methods": "Customer delivery methods",
  "dealer-areas": "Dealer areas",
  "dealer-types": "Dealer types",
  "document-types": "Document types",
  features: "Features",
  models: "Models",
  "mode-of-payments": "Mode of payments",
  "package-types": "Package types",
  "payment-types": "Payment types",
  "price-lists": "Price lists",
  "problem-descriptions": "Problem descriptions",
  "promo-types": "Promo types",
  provinces: "Provinces",
  regions: "Regions",
  resolutions: "Resolutions",
  "sale-types": "Sale types",
  sizes: "Sizes",
};

/**
 * Resolve a human page title for the current pathname (longest exact / prefix match).
 * Dynamic segments (e.g. `/policies/[id]`) fall back to the nearest parent title.
 */
export function resolveRouteTitle(pathname: string): string | null {
  const path = pathname.split("?")[0]?.replace(/\/$/, "") || "/";
  if (path === "/" || path === "") return null;

  if (ROUTE_TITLES[path]) return ROUTE_TITLES[path];

  const masterDataMatch = path.match(/^\/settings\/master-data\/([^/]+)/);
  if (masterDataMatch) {
    const slug = masterDataMatch[1]!;
    if (MASTER_DATA_TITLES[slug]) return MASTER_DATA_TITLES[slug];
    return slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  if (path.startsWith("/policies/") && path !== "/policies/new") {
    return "Policy";
  }
  if (path.startsWith("/inventory/serial-numbers/")) {
    return "Serial number";
  }
  if (path.startsWith("/inventory/stock-count/")) {
    return "P-Count session";
  }
  if (path.startsWith("/settings/branches/") && path.includes("/planogram")) {
    return "Branch planogram";
  }

  const candidates = Object.keys(ROUTE_TITLES)
    .filter((href) => href !== "/" && (path === href || path.startsWith(`${href}/`)))
    .sort((a, b) => b.length - a.length);

  return candidates[0] ? ROUTE_TITLES[candidates[0]!]! : null;
}
