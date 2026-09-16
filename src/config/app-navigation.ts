import {
  ArrowLeftRight,
  ArrowUpToLine,
  Barcode,
  Building2,
  CalendarClock,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  Clock,
  History,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Megaphone,
  Network,
  Package,
  Plug,
  ScrollText,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  Tags,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { getModuleNavPermission } from "@/config/app-modules";

export interface NavLinkItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only `pathname === href` is active (use for section index routes). */
  exact?: boolean;
  permission?: string;
  /** Show link when user has any of these permissions */
  anyPermissions?: string[];
  platformOperatorOnly?: boolean;
  /** Compact sidebar badge (e.g. recently added menus) */
  badge?: "new";
}

export interface NavLinkEntry extends NavLinkItem {
  type: "link";
}

/** Nested group inside a sidebar group (e.g. Settings submodules) */
export interface NavSubGroupItem {
  label: string;
  icon: LucideIcon;
  items: NavLinkItem[];
}

export type NavGroupChild = NavLinkItem | NavSubGroupItem;

export interface NavGroupEntry {
  type: "group";
  label: string;
  icon: LucideIcon;
  items: NavGroupChild[];
  /** Open on first load when no child route is active (in-session toggle still works) */
  defaultOpen?: boolean;
}

export type NavEntry = NavLinkEntry | NavGroupEntry;

export function isNavSubGroup(child: NavGroupChild): child is NavSubGroupItem {
  return "items" in child;
}

export const appNavigation: NavEntry[] = [
  {
    type: "link",
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: getModuleNavPermission("dashboard"),
    badge: "new",
  },
  {
    type: "link",
    href: "/announcements",
    label: "Announcements",
    icon: Megaphone,
    permission: "announcements.view",
  },
  {
    type: "group",
    label: "Orders",
    icon: ShoppingCart,
    items: [
      {
        href: "/orders/manual",
        label: "Manual Order",
        icon: ShoppingCart,
        anyPermissions: [
          "orders.manual.view",
          "orders.manual.create",
          "orders.manual.approve",
          "orders.view",
          "orders.create",
          "orders.approve",
        ],
        badge: "new",
      },
      {
        href: "/orders/special",
        label: "Special Order",
        icon: ClipboardList,
        anyPermissions: [
          "orders.special.view",
          "orders.special.create",
          "orders.special.approve",
          "orders.view",
          "orders.create",
          "orders.approve",
        ],
        badge: "new",
      },
      {
        href: "/orders/auto-replenish",
        label: "Auto replenish",
        icon: Package,
        anyPermissions: [
          "orders.auto_replenish.view",
          "orders.auto_replenish.create",
          "orders.auto_replenish.approve",
          "orders.view",
          "orders.create",
          "orders.approve",
        ],
        badge: "new",
      },
      {
        href: "/orders/demand-planning",
        label: "Demand Planning",
        icon: LayoutGrid,
        anyPermissions: ["forecast.manage", "planogram.manage", "forecast.view"],
        badge: "new",
      },
      {
        href: "/orders/replenishment",
        label: "Replenishment",
        icon: CalendarDays,
        anyPermissions: ["forecast.manage", "planogram.manage", "forecast.view"],
        badge: "new",
      },
    ],
  },
  {
    type: "group",
    label: "Sales & Returns",
    icon: History,
    items: [
      {
        href: "/sales",
        label: "Sales Transactions",
        icon: Store,
        anyPermissions: ["sales.view", "sales.create", "sales.update"],
        badge: "new",
      },
      {
        href: "/returns",
        label: "Returns / Replacement",
        icon: ArrowLeftRight,
        anyPermissions: [
          "returns.view",
          "returns.branch.view",
          "returns.service.view",
          "returns.request",
          "returns.evaluate",
          "returns.approve",
          "returns.complete",
        ],
        badge: "new",
      },
    ],
  },
  {
    type: "group",
    label: "Logistics",
    icon: Package,
    items: [
      {
        href: "/logistics/deliveries",
        label: "Deliveries",
        icon: Truck,
        anyPermissions: ["logistics.view", "logistics.create", "logistics.manage"],
      },
      {
        href: "/logistics/transfers",
        label: "Transfers",
        icon: ArrowLeftRight,
        anyPermissions: ["logistics.view", "logistics.create", "logistics.manage"],
      },
      {
        href: "/logistics/pickups",
        label: "Pull-outs",
        icon: ArrowUpToLine,
        anyPermissions: ["logistics.view", "logistics.create", "logistics.manage"],
      },
    ],
  },
  {
    type: "group",
    label: "Inventory",
    icon: Package,
    items: [
      {
        href: "/inventory",
        label: "Stock units",
        icon: Package,
        exact: true,
        permission: "inventory.view",
        badge: "new",
      },
      {
        href: "/inventory/warehouse-stock",
        label: "Warehouse stock",
        icon: Warehouse,
        anyPermissions: ["inventory.view", "warehouses.manage"],
        badge: "new",
      },
      {
        href: "/inventory/stock-count",
        label: "P-Count",
        icon: ClipboardList,
        permission: "inventory.view",
      },
      {
        href: "/inventory/serial-numbers",
        label: "Serial numbers",
        icon: Barcode,
        permission: "inventory.view",
      },
    ],
  },
  {
    type: "group",
    label: "Reports",
    icon: ClipboardList,
    items: [
      {
        href: "/reports/processed-orders",
        label: "Processed orders",
        icon: ClipboardList,
        anyPermissions: [
          "reports.view",
          "orders.view",
          "orders.manual.view",
          "orders.special.view",
          "orders.auto_replenish.view",
        ],
      },
      {
        href: "/reports/daily-stock",
        label: "Daily stock",
        icon: Package,
        anyPermissions: [
          "reports.view",
          "orders.view",
          "orders.manual.view",
          "orders.special.view",
          "orders.auto_replenish.view",
        ],
      },
      {
        href: "/reports/transfers",
        label: "Transfers",
        icon: ArrowLeftRight,
        anyPermissions: [
          "reports.view",
          "logistics.view",
          "logistics.create",
          "logistics.manage",
        ],
      },
      {
        href: "/reports/sales",
        label: "Sales & Returns",
        icon: Store,
        anyPermissions: ["reports.view", "sales.create"],
        badge: "new",
      },
      {
        href: "/reports/official-sales",
        label: "Official Sales",
        icon: ScrollText,
        anyPermissions: ["official_sales.view", "official_sales.manage"],
        badge: "new",
      },
      {
        href: "/reports/pcount",
        label: "P-Count",
        icon: ClipboardList,
        anyPermissions: ["reports.view", "inventory.view"],
       
      },
      {
        href: "/reports/branch-returns",
        label: "Branch returns",
        icon: ArrowLeftRight,
        anyPermissions: ["reports.view", "sales.create"],
      
      },
      {
        href: "/reports/pull-outs",
        label: "Pull-outs",
        icon: ArrowUpToLine,
        anyPermissions: [
          "reports.view",
          "logistics.view",
          "logistics.create",
          "logistics.manage",
        ],
     
      },
      {
        href: "/reports/variance-discrepancy",
        label: "Variance & discrepancy",
        icon: ChartColumn,
        anyPermissions: ["reports.view", "inventory.view"],
      
      },
      {
        href: "/reports/service-returns",
        label: "Service returns",
        icon: ScrollText,
        anyPermissions: ["reports.view", "sales.create"],
      
      },
      {
        href: "/reports/inventory",
        label: "Inventory",
        icon: Package,
        anyPermissions: ["reports.view", "inventory.view"],
     
      },
      {
        href: "/reports/dii",
        label: "DII",
        icon: CalendarDays,
        anyPermissions: ["reports.view", "inventory.view"],
     
      },
      {
        href: "/reports/demand-planning-coverage",
        label: "DP Coverage",
        icon: ChartColumn,
        anyPermissions: ["reports.view", "forecast.manage", "forecast.view", "planogram.manage"],
        badge: "new",
      },
      {
        href: "/reports/aging",
        label: "Aging",
        icon: Clock,
        anyPermissions: ["reports.view", "inventory.view"],
     
      },
      {
        href: "/reports/consolidated-discrepancy",
        label: "Consolidated discrepancy",
        icon: LayoutGrid,
        anyPermissions: ["reports.view", "inventory.view"],
        
      },
    ],
  },
  {
    type: "group",
    label: "Audit Logs",
    icon: History,
    items: [
      {
        href: "/audit-logs/system",
        label: "System logs",
        icon: ClipboardList,
        permission: "audit_logs.view",
      },
      {
        href: "/audit-logs/serial-numbers",
        label: "Serial number logs",
        icon: Barcode,
        permission: "serial_logs.view",
        badge: "new",
      },
    ],
  },
  {
    type: "link",
    href: "/competitors",
    label: "Competitors",
    icon: ChartColumn,
    permission: "competitors.view",
  },
  {
    type: "link",
    href: "/policies",
    label: "Policies",
    icon: ScrollText,
    anyPermissions: ["policies.view", "policies.create", "policies.approve"],
  },
  {
    type: "group",
    label: "Service",
    icon: Building2,
    items: [
      {
        href: "/service-centers/inventory",
        label: "SC Inventory",
        icon: Package,
        permission: "service_centers.inventory.view",
        badge: "new",
      },
      {
        href: "/service-centers/sales",
        label: "SC Sales",
        icon: Store,
        anyPermissions: [
          "service_centers.sales.view",
          "service_centers.sales.create",
        ],
        badge: "new",
      },
      {
        href: "/service-centers/orders",
        label: "SC Orders",
        icon: ShoppingCart,
        anyPermissions: [
          "service_centers.orders.view",
          "service_centers.orders.create",
          "service_centers.orders.approve",
        ],
        badge: "new",
      },
      {
        href: "/service-centers/deliveries",
        label: "SC Deliveries",
        icon: Truck,
        anyPermissions: [
          "service_centers.logistics.view",
          "service_centers.logistics.create",
          "service_centers.logistics.manage",
        ],
        badge: "new",
      },
      {
        href: "/service-centers/pullouts",
        label: "SC Pull-outs",
        icon: ArrowUpToLine,
        anyPermissions: [
          "service_centers.logistics.view",
          "service_centers.logistics.create",
          "service_centers.logistics.manage",
        ],
        badge: "new",
      },
    ],
  },
  {
    type: "group",
    label: "Settings",
    icon: Settings,
    defaultOpen: true,
    items: [
      {
        label: "Organization",
        icon: Building2,
        items: [
          {
            href: "/settings/company",
            label: "Company Settings",
            icon: Building2,
            permission: "company.view",
          },
          {
            href: "/settings/departments",
            label: "Departments",
            icon: Network,
            permission: "departments.manage",
          },
          {
            href: "/settings/status",
            label: "Status",
            icon: Clock,
            permission: "status_settings.manage",
            badge: "new",
          },
        ],
      },
      {
        label: "Operations & Planning",
        icon: LayoutGrid,
        items: [
          {
            href: "/settings/aors",
            label: "AORs",
            icon: Network,
            anyPermissions: ["aors.view", "aors.manage"],
          },
          {
            href: "/settings/branch-quotas",
            label: "Branch quotas",
            icon: ChartColumn,
            anyPermissions: ["branches.view", "branches.manage"],
          },
          {
            href: "/settings/planning",
            label: "Planning & Forecast",
            icon: LayoutGrid,
            anyPermissions: ["forecast.manage", "planogram.manage"],
          },
          {
            href: "/settings/planogram",
            label: "Planogram",
            icon: LayoutGrid,
            anyPermissions: ["planogram.view", "planogram.manage"],
          },
          {
            href: "/settings/ordering",
            label: "Ordering policy",
            icon: CalendarClock,
            anyPermissions: ["ordering_settings.view", "ordering_settings.manage"],
            badge: "new",
          },
        ],
      },
      {
        label: "Access & Security",
        icon: Shield,
        items: [
          {
            href: "/settings/users",
            label: "Users",
            icon: Users,
            permission: "users.manage",
          },
          {
            href: "/settings/roles",
            label: "Roles",
            icon: Shield,
            permission: "roles.manage",
          },
          {
            href: "/settings/permissions",
            label: "Permissions",
            icon: KeyRound,
            permission: "roles.manage",
          },
        ],
      },
      {
        label: "Locations & Facilities",
        icon: MapPin,
        items: [
          {
            href: "/settings/branches",
            label: "Branches",
            icon: MapPin,
            permission: "branches.manage",
          },
          {
            href: "/settings/warehouses",
            label: "Warehouses",
            icon: Building2,
            permission: "warehouses.manage",
            badge: "new",
          },
          {
            href: "/settings/service-centers",
            label: "Service centers",
            icon: Building2,
            permission: "service_centers.manage",
          },
          {
            href: "/settings/dealers",
            label: "Dealers",
            icon: Store,
            permission: "dealers.manage",
          },
        ],
      },
      {
        label: "Integrations",
        icon: Plug,
        items: [
          {
            href: "/settings/sap-integration",
            label: "SAP integration",
            icon: Truck,
            permission: "sap.manage",
          },
        ],
      },
      {
        href: "/settings/master-data",
        label: "Master data",
        icon: Tags,
        permission: "master_data.manage",
      },
    ],
  },
];

function hasNavPermission(
  permissions: string[],
  item: NavLinkItem,
): boolean {
  if (item.anyPermissions?.length) {
    return item.anyPermissions.some((p) => permissions.includes(p));
  }
  return !item.permission || permissions.includes(item.permission);
}

export function filterNavByPermissions(
  entries: NavEntry[],
  permissions: string[],
  isPlatformOperator = false,
): NavEntry[] {
  return entries
    .map((entry) => {
      if (entry.type === "link") {
        if (entry.platformOperatorOnly && !isPlatformOperator) {
          return null;
        }
        if (!hasNavPermission(permissions, entry)) {
          return null;
        }
        return entry;
      }

      const isVisible = (item: NavLinkItem) => {
        if (item.platformOperatorOnly && !isPlatformOperator) {
          return false;
        }
        return hasNavPermission(permissions, item);
      };

      const visibleItems = entry.items
        .map((child) => {
          if (!isNavSubGroup(child)) {
            return isVisible(child) ? child : null;
          }
          const items = child.items.filter(isVisible);
          return items.length > 0 ? { ...child, items } : null;
        })
        .filter((child): child is NavGroupChild => child !== null);

      if (visibleItems.length === 0) {
        return null;
      }

      return { ...entry, items: visibleItems };
    })
    .filter((entry): entry is NavEntry => entry !== null);
}

/** Whether a nav href should show as active for the current pathname. */
export function isNavItemActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavGroupActive(
  pathname: string,
  items: NavGroupChild[],
): boolean {
  return items.some((child) =>
    isNavSubGroup(child)
      ? isNavGroupActive(pathname, child.items)
      : isNavItemActive(pathname, child.href, child.exact),
  );
}
