/**
 * Release history for in-app "What's New" and update logs.
 *
 * Maintenance (each release):
 * 1. Bump `version` in package.json AND README "Current version" to match the newest entry
 * 2. Prepend a new entry below (newest first) with matching version, date, title, highlights,
 *    and typed changes (feature | improvement | fix)
 * 3. Set `releasedAt` (ISO datetime, Asia/Manila +08:00) on the latest entry for ship clock time
 * 4. Deploy — login footer and What's new dialog update automatically
 *
 * Semver / when to bump (do NOT dump unrelated work into one mega note):
 * - patch (x.y.Z): fixes, polish, small UX tweaks (confirm dialogs, NEW badge placement,
 *   sticky header removal, timestamp display, copy/layout polish)
 * - minor (x.Y.0): new core modules or capabilities (e.g. Service center ops, sales status
 *   staying with the sale line, Official Sales accounting columns & bulk delete, Order Policy
 *   daily lock). Each distinct core module/capability gets its OWN version — never mash
 *   unrelated core features into one entry
 * - major (X.0.0): breaking product changes (rare)
 *
 * Same-day consolidation:
 * - ONLY consolidate when changes share the same patch theme (related polish/fixes)
 * - NEVER consolidate a new core module/capability into an existing patch or into another
 *   unrelated core feature — bump a new minor (or major) instead
 *
 * Writing style (always — end users, not developers):
 * - Describe what people can do or what feels better
 * - No file names, SQL, FK, schema fields, migration names, reseed steps, or RBAC jargon dumps
 * - Avoid technical jargon (hydration, pool timeout, GROUP BY, slugs, etc.)
 * - Keep highlights short; order changes as feature → improvement → fix
 */

export type ReleaseChangeType = "feature" | "fix" | "improvement";

export interface ReleaseChange {
  type: ReleaseChangeType;
  description: string;
}

export interface ReleaseNote {
  version: string;
  /** Calendar date (YYYY-MM-DD). Used for sorting/display when `releasedAt` is absent. */
  date: string;
  /**
   * Optional ISO datetime of the ship/push moment (e.g. 2026-08-04T18:03:00+08:00).
   * What's New shows clock time when set; older entries without it fall back to date-only.
   */
  releasedAt?: string;
  title: string;
  highlights: string[];
  changes?: ReleaseChange[];
}

export const RELEASES: ReleaseNote[] = [
  {
    version: "0.37.0",
    date: "2026-09-18",
    releasedAt: "2026-09-18T16:15:00+08:00",
    title: "Staging & production hosting ready",
    highlights: [
      "ISMS can now run as separate pre-production and production environments on the client server",
      "Updates can be tested on pre-prod first, then promoted to production without sharing the same database or uploads",
      "Deployments are automated so new builds reach the right environment more reliably",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Separate pre-production and production environments on the client server, each with its own data",
      },
      {
        type: "improvement",
        description:
          "Automated deploy path so verified builds move from staging into production more safely",
      },
      {
        type: "fix",
        description:
          "Clearer separation of environment settings so staging and live secrets are not mixed",
      },
    ],
  },
  {
    version: "0.36.0",
    date: "2026-09-16",
    releasedAt: "2026-09-16T13:30:00+08:00",
    title: "Demand Planning & replenishment",
    highlights: [
      "Orders → Demand Planning runs a monthly wizard that builds a numbered plan (DP-YYYYMM-nnn) from sales history, planogram mix, SFE forecast, and on-hand stock",
      "Review Drop 1 on an editable grid, then release one Auto replenish order request per branch — re-runs create a new version instead of overwriting",
      "Orders → Replenishment is a live per-branch workbench for mid-cycle tweaks; send selected lines straight to Ordering",
      "Reports → DP Coverage shows network targets, allocation, and days of inventory by stage",
      "Settings → Planning still holds branch revenue targets plus a new per-SKU SFE forecast import",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Demand Planning wizard with versioned documents, editable Drop 1 lines, and release into Auto replenish",
      },
      {
        type: "feature",
        description:
          "Replenishment Workbench for live branch adjustments and mid-cycle send to Ordering",
      },
      {
        type: "feature",
        description:
          "Demand Planning coverage report with branch roll-up and days-of-inventory stages",
      },
      {
        type: "feature",
        description:
          "Import per-SKU SFE forecast quantities from Settings → Planning",
      },
      {
        type: "improvement",
        description:
          "Suggested orders now opens Demand Planning; shelf-gap allocation remains available on Settings → Planning for reference",
      },
    ],
  },
  {
    version: "0.35.0",
    date: "2026-09-08",
    releasedAt: "2026-09-08T14:45:00+08:00",
    title: "Official Forecast template",
    highlights: [
      "Settings → Planning now has the same Download template flow as Models, Branches, and Planogram — one spreadsheet for the planning period, branch SAP code, and revenue target",
      "The download is filled with your current period targets so you can edit and send it back",
      "Upload shows what will be added or changed before you apply; branches you leave out stay as they are",
      "The old wide BRS file is no longer used on Planning — shelf max and MIL stay on Planogram",
      "Adding a model on a branch planogram tells you if Allowed models is empty, with a shortcut to open that list",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Download a Forecast template from Settings → Planning, fill the period, branch SAP code, and revenue target, then upload to preview and apply",
      },
      {
        type: "feature",
        description:
          "When a branch has no allowed models, Add model explains that and offers Open Allowed models instead of loading an empty list",
      },
      {
        type: "improvement",
        description:
          "The Forecast template lists your current period targets so you start from live data, and includes branch names for reading (they are ignored on upload)",
      },
      {
        type: "improvement",
        description:
          "Add model only offers active SKUs already on Allowed models — it does not add products to that list for you",
      },
      {
        type: "fix",
        description:
          "The old BRS spreadsheet is no longer accepted on Planning, so the wrong file cannot overwrite revenue targets or shelf plans",
      },
    ],
  },
  {
    version: "0.34.0",
    date: "2026-09-08",
    releasedAt: "2026-09-08T13:30:00+08:00",
    title: "Official Planogram template",
    highlights: [
      "Settings → Planogram now has the same Download template flow as Models and Branches — one spreadsheet for branch SAP code, SKU, shelf max, and MIL days",
      "The download is filled with your current planogram rows so you can edit and send it back",
      "Upload shows what will be added or changed before you apply; rows you leave out stay as they are",
      "The old wide BRS file is no longer used on Planogram — keep that file for Planning → Import forecast",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Download a Planogram template from Settings → Planogram, fill branch SAP code, SKU, shelf max, and MIL days, then upload to preview and apply",
      },
      {
        type: "improvement",
        description:
          "The template lists your current shelf plan so you start from live data, and blank MIL days default to 30",
      },
      {
        type: "fix",
        description:
          "The old BRS spreadsheet is no longer accepted on Planogram, so the wrong file cannot overwrite shelf plans",
      },
    ],
  },
  {
    version: "0.33.0",
    date: "2026-09-01",
    releasedAt: "2026-09-01T15:30:00+08:00",
    title: "SAP master data keeps itself up to date",
    highlights: [
      "Branches, warehouses, customers, product models, and serial numbers now sync from SAP on their own, all day — nobody has to remember to press the button",
      "Big syncs pick up where they left off instead of starting over, so serial numbers finish on their own over several rounds",
      "Every sync now goes back over its records regularly, so a change made in SAP is picked up even on records that came in long ago",
      "Sync messages show how far along you are, how many rows were skipped, and why",
      "Skipped rows are grouped by reason with a few examples instead of one long list",
      "Two SAP customers sharing the same name both come in now, instead of one being turned away",
      '"Sync from SAP" refreshes the page as results land, and no longer gets stuck spinning if you navigate away',
    ],
    changes: [
      {
        type: "feature",
        description:
          "SAP master data syncs automatically in the background, so branches, warehouses, customers, product models, and serial numbers stay current without anyone starting a sync",
      },
      {
        type: "feature",
        description:
          "Long syncs remember their place and continue from there on the next round, so even very large serial number lists complete without being babysat",
      },
      {
        type: "feature",
        description:
          "Sync messages now show progress through the current pass — how many rows have been read out of the total in SAP",
      },
      {
        type: "improvement",
        description:
          "Every sync repeats its pass once it reaches the end, so edits made in SAP to older records are picked up instead of being missed forever",
      },
      {
        type: "improvement",
        description:
          'Skipped rows now appear in the sync summary, not only in the report, so a run that applied nothing explains itself instead of reading as "nothing to do"',
      },
      {
        type: "improvement",
        description:
          "The sync report groups skipped rows by reason with a sample of the records affected, rather than listing thousands of rows saying the same thing",
      },
      {
        type: "improvement",
        description:
          "Customers are matched on their SAP code instead of their name, so several SAP records sharing one company name all come through",
      },
      {
        type: "improvement",
        description:
          "The page refreshes as each part of a sync lands, so new records show up without a manual reload",
      },
      {
        type: "improvement",
        description:
          "Sync prompts and warnings clear themselves after a short while instead of sitting on screen until dismissed — the scheduled sync picks the work up either way",
      },
      {
        type: "fix",
        description:
          "A sync that never gets an answer back now stops on its own instead of spinning forever and blocking every later attempt until the page is reloaded",
      },
      {
        type: "fix",
        description:
          "Sync messages no longer carry over text or buttons from the previous run",
      },
      {
        type: "fix",
        description:
          "Serial number sync stops immediately with a clear message when no product models exist yet, instead of skipping every row one by one",
      },
      {
        type: "fix",
        description:
          "Forms, dialogs, and tables no longer flash the previous values for a moment when reopened or switched — the register form, edit user dialog, table filters, and page tabs all show the right state right away",
      },
    ],
  },
  {
    version: "0.32.1",
    date: "2026-08-31",
    releasedAt: "2026-08-31T14:00:00+08:00",
    title: "Faster imports and quicker sign-in",
    highlights: [
      "Branch, model, and Official Sales imports finish much faster on big files",
      "Your file is read once — later steps reuse it instead of uploading it again for every batch",
      "Process Official Sales keeps going through the whole queue on its own and reports one final summary",
      "Signing in and moving between pages feels quicker",
      "Sync from SAP no longer hangs forever when SAP stops responding",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Branch, model, and Official Sales imports apply in batches with far fewer repeated steps, so large workbooks finish in a fraction of the time",
      },
      {
        type: "improvement",
        description:
          "Imports remember the checked file between batches instead of re-uploading it each round, and quietly re-read it if that memory is lost",
      },
      {
        type: "improvement",
        description:
          "Process Official Sales continues through every pending row automatically and shows a single combined result at the end",
      },
      {
        type: "improvement",
        description:
          "Sign-in and page loads are faster thanks to lighter permission checks and closer-to-home hosting",
      },
      {
        type: "improvement",
        description:
          "Sync from SAP pulls larger pages and updates records side by side, so syncs finish sooner",
      },
      {
        type: "fix",
        description:
          "A stalled SAP connection now stops on its own instead of blocking the next sync until the system restarts",
      },
      {
        type: "fix",
        description:
          "Branch import preview no longer counts a branch as an update when its delivery schedule is unchanged",
      },
    ],
  },
  {
    version: "0.32.0",
    date: "2026-08-28",
    releasedAt: "2026-08-28T17:45:00+08:00",
    title: "Pull customers, models, and serial numbers from SAP",
    highlights: [
      "Sync from SAP on Customers, Product Models, and Serial Numbers brings the records straight in — no more manual adding",
      "SAP is the source of truth for these, so new customers and models are created by the sync",
      "Each sync reports what was created, updated, already up to date, skipped (with the reason), and what exists here but not in SAP",
      "Records missing from SAP are only reported, never deleted or switched off for you",
      "Customers blocked or frozen in SAP come in as inactive",
      "The sync keeps running if you leave the page, and it tells you when it is done",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Sync from SAP on the Customers, Product Models, and Serial Numbers pages pulls master data in one click",
      },
      {
        type: "feature",
        description:
          "Every sync ends with a report of created, updated, unchanged, skipped, and not-in-SAP records so you can see exactly what changed",
      },
      {
        type: "improvement",
        description:
          "Manual Add for customers and product models is retired — SAP owns those records now, while imports stay available",
      },
      {
        type: "improvement",
        description:
          "Only real SAP customers are pulled in; suppliers and leads are left out, and blocked or frozen customers arrive as inactive",
      },
      {
        type: "fix",
        description:
          "A customer whose SAP name is already used by another record is skipped with a clear reason instead of failing the sync",
      },
    ],
  },
  {
    version: "0.31.3",
    date: "2026-08-11",
    releasedAt: "2026-08-11T19:35:00+08:00",
    title: "Return the right serial on a package",
    highlights: [
      "Request return from each serial line — Process Return shows that model and SN",
      "Full serial numbers stay readable in sale details",
      "Same Invoice shows the original TRN number and date to double-check",
      "Dealer Initiated returns still need Team Leader after CS; other types go Approved after CS",
      "Completing a return or replacement only changes the selected serial — other units on the package stay put",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Request return per serial line so multi-unit packages target the right SN from Process Return through complete",
      },
      {
        type: "feature",
        description:
          "Same Invoice shows the original transaction number and date as read-only checks before you pick the replacement unit",
      },
      {
        type: "improvement",
        description:
          "Dealer Initiated Return / Replacement still needs Team Leader approve after CS; other document types move straight to Approved after CS evaluate",
      },
      {
        type: "improvement",
        description:
          "Sale details show the full serial number without cutting it off in a narrow column",
      },
      {
        type: "fix",
        description:
          "Finishing a return or replacement no longer rewrites other serials on the same package",
      },
    ],
  },
  {
    version: "0.31.2",
    date: "2026-08-11",
    releasedAt: "2026-08-11T18:05:00+08:00",
    title: "Sales list stays on sold lines",
    highlights: [
      "Sales shows Sold, Official Sold, and TO FOLLOW only",
      "Pending CS/TL, Approved, Rejected, Closed, and similar return statuses stay under Returns / Replacement",
      "Sales totals match the filtered list",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Sales list and summary cards focus on Sold, Official Sold, and TO FOLLOW so the page stays a sales ledger",
      },
      {
        type: "fix",
        description:
          "Return and replacement workflow statuses no longer appear mixed into the Sales table",
      },
    ],
  },
  {
    version: "0.31.1",
    date: "2026-08-11",
    releasedAt: "2026-08-11T17:57:00+08:00",
    title: "Service Return and Replacement on Service Returns",
    highlights: [
      "Service Return and Service Replacement requests now show under the Service Returns tab",
      "Process Return asks for service details when you pick Service Replacement",
      "Branch Returns stays focused on regular branch return types",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Service Return and Service Replacement requests appear under Service Returns alongside service center sales returns",
      },
      {
        type: "improvement",
        description:
          "Process Return shows service fields when you choose Service Replacement, same as Service Return",
      },
      {
        type: "fix",
        description:
          "Branch Returns no longer lists Service Return or Service Replacement requests",
      },
    ],
  },
  {
    version: "0.31.0",
    date: "2026-08-11",
    releasedAt: "2026-08-11T17:15:00+08:00",
    title: "SAP stays connected for your company",
    highlights: [
      "After you Connect to SAP, the link stays Connected when you refresh the page — until it expires or you Logout",
      "Everyone in your company shares one live SAP connection for the active setup, so the team is not logged in separately",
      "Test connection still only checks the link and does not keep a session",
    ],
    changes: [
      {
        type: "feature",
        description:
          "SAP stays connected for your company after refresh so the whole team shares one live link",
      },
      {
        type: "improvement",
        description:
          "Session status explains the shared company connection and that Test connection does not keep a session",
      },
    ],
  },
  {
    version: "0.30.0",
    date: "2026-08-11",
    releasedAt: "2026-08-11T16:45:00+08:00",
    title: "Warehouses select all & bulk delete",
    highlights: [
      "On Warehouses setup, the header checkbox selects or clears all warehouses that match your search — not just the current page",
      "When warehouses are selected, Delete selected removes them in one step after you confirm",
      "Warehouses that still have AORs, pull-outs, or stock are left alone, with a clear message for what could not be removed",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Warehouses setup supports Select all for matching rows and Delete selected to remove several warehouses at once",
      },
      {
        type: "improvement",
        description:
          "Bulk delete asks for confirmation and skips warehouses that still have links or stock, so you can clean up safely",
      },
      {
        type: "fix",
        description:
          "Select all on Warehouses now stays in sync with the full filtered list so the header checkbox no longer stops short of every matching row",
      },
    ],
  },
  {
    version: "0.29.0",
    date: "2026-08-11",
    releasedAt: "2026-08-11T15:45:00+08:00",
    title: "Process Return & Replacement finishing",
    highlights: [
      "Request return now opens Process Return — document type, STK or DEF, problem descriptions, then Return or Replacement",
      "Service Return document types show service center and related fields when needed",
      "ATR/ODRF PDF is created when you submit and can be downloaded from Branch Returns",
      "Approved returns put units back as Stock or Defective at the selling branch; replacements update the same invoice or open a new sale",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Process Return from Sales details captures document type, stock status, problems, and Return or Replacement before CS evaluation",
      },
      {
        type: "feature",
        description:
          "Service Return extras appear when the document type is Service Return, including service center and related fields",
      },
      {
        type: "feature",
        description:
          "Submitting Process Return generates an ATR/ODRF PDF you can download from the Branch Returns list",
      },
      {
        type: "feature",
        description:
          "Approved Replacement can finish on the same invoice (swap model and serial) or create a new sale with the replacement unit, then close the original ATR",
      },
      {
        type: "improvement",
        description:
          "Branch Returns shows report-friendly columns (status, document type, type, serials, problem, and more) plus clear Return / Replacement actions",
      },
      {
        type: "improvement",
        description:
          "Restoring an approved Return puts units back as Stock or Defective at the selling branch, with serial number history recorded",
      },
      {
        type: "fix",
        description:
          "Return and replacement help text, tutorials, and module guides match the new Process Return flow",
      },
    ],
  },
  {
    version: "0.28.0",
    date: "2026-08-11",
    releasedAt: "2026-08-11T14:55:00+08:00",
    title: "Returns / Replacement module & tenant Permissions access",
    highlights: [
      "Returns / Replacement is its own menu next to Sales, with Branch Returns, Service Returns, and Approvals",
      "Roles can grant Branch Returns, Service Returns, and Approvals separately — or View all Returns tabs for full access; older Sales and Service Center return permissions still work",
      "Tenant Super Admins can open Permissions under Access & Security, browse the access catalog, and manage who can do what via Roles",
      "Super Admins can see built-in system roles on Roles and adjust what each one can access — renaming and deleting those roles stay locked",
      "Official Sales ADD fills model price from the price list for the model, package, and sale date — including when an existing sold line is marked Official Sold — and uses the latest price when no period matches that date",
      "Sales loading screen no longer shows a Returns tab — Returns is only under Returns / Replacement",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Returns / Replacement is now a separate module from Sales, with Branch Returns, Service Returns, and Approvals tabs so teams can finish ATRs in one place",
      },
      {
        type: "feature",
        description:
          "Roles can grant Branch Returns, Service Returns, and Approvals access separately (Approvals follows evaluate / approve / complete); View all Returns tabs still opens everything; existing Sales and Service Center return permissions continue to work",
      },
      {
        type: "feature",
        description:
          "Tenant Super Admins can open Permissions and manage access — browse the catalog, then assign what people can do under Roles or the Permission matrix",
      },
      {
        type: "feature",
        description:
          "Super Admins can see built-in system roles on Settings → Roles (and the Permission matrix) and adjust their access; renaming and deleting those roles stay locked",
      },
      {
        type: "fix",
        description:
          "Official Sales ADD now fills model price from the price list for the model, package, and sale date — including when an existing sold line is marked Official Sold — and uses the latest price when no period matches that date",
      },
      {
        type: "fix",
        description:
          "Sales no longer flashes a Returns tab while the page is loading — open Returns / Replacement for ATRs",
      },
    ],
  },
  {
    version: "0.27.3",
    date: "2026-08-11",
    releasedAt: "2026-08-11T14:05:00+08:00",
    title: "Clearer transfer and Official Sales guidance",
    highlights: [
      "Help shows the updated transfer path: requesting branch, Team Leader approval, releasing branch, then receive",
      "Official Sales is explained in Help alongside Sales & ATR so Accounting knows when to use each path",
      "Flow by role tabs in Help scroll sideways when they don’t all fit, so every process stays reachable",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Help & Support now walks through the finished transfer flow and how Official Sales connects to Sales & ATR for Official Sold — without mixing it up with ATR returns",
      },
      {
        type: "fix",
        description:
          "On Help & Support, Flow by role tabs scroll horizontally with a visible scrollbar when the row is too wide — so Roles and other processes stay easy to open",
      },
    ],
  },
  {
    version: "0.27.2",
    date: "2026-08-11",
    releasedAt: "2026-08-11T13:35:00+08:00",
    title: "Smoother Sales and Returns tab switching",
    highlights: [
      "Switching between Sales and Returns on Sales & ATR shows a table placeholder while the list loads",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Clicking Sales or Returns now shows a familiar table loading placeholder instead of a blank gap or the previous list flashing",
      },
    ],
  },
  {
    version: "0.27.1",
    date: "2026-08-11",
    releasedAt: "2026-08-11T13:25:00+08:00",
    title: "Search suggestions stay above table headers",
    highlights: [
      "Table search suggestions no longer hide behind column headers on Sales & Returns and Official Sales",
    ],
    changes: [
      {
        type: "fix",
        description:
          "Typing in a table search box shows matching suggestions clearly above the sticky column headers instead of slipping underneath",
      },
    ],
  },
  {
    version: "0.27.0",
    date: "2026-08-11",
    releasedAt: "2026-08-11T13:10:00+08:00",
    title: "Sale header edit for Accounting",
    highlights: [
      "Accounting can correct sale transaction headers from Sales & ATR",
      "Sale line Edit appears only while the serial is still TO-FOLLOW",
      "Edit header stays hidden once a sale is Official Sold",
      "Roles can grant Edit sales transaction headers under Sales permissions",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Accounting (and roles with the new permission) can edit sale headers — transaction number, branch, date, customer, payment, delivery, proof, reserved, and related fields",
      },
      {
        type: "feature",
        description:
          "Sales list shows Edit next to View details for TO-FOLLOW rows when you can update headers",
      },
      {
        type: "improvement",
        description:
          "In sale details, line Edit is limited to TO-FOLLOW serials so completed units stay locked",
      },
      {
        type: "improvement",
        description:
          "Edit header is hidden for Official Sold sales, and those headers cannot be changed",
      },
      {
        type: "improvement",
        description:
          "Edit transaction header dialog spacing is clearer, with a form-shaped loading placeholder while fields load",
      },
    ],
  },
  {
    version: "0.26.0",
    date: "2026-08-11",
    releasedAt: "2026-08-11T12:00:00+08:00",
    title: "Warehouse stock serial list",
    highlights: [
      "Browse warehouse serial numbers from Inventory → Warehouse stock",
      "Open the same list from Settings → Warehouses → Stock, optionally filtered to one warehouse",
      "Filter by warehouse, location, or search by serial / SKU — read-only for now",
      "Sidebar menus are grouped in a clearer day-to-day order — Orders, Sales & Returns, Logistics, then Inventory",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Inventory → Warehouse stock shows serials held in warehouses, separate from branch Stock units",
      },
      {
        type: "feature",
        description:
          "Settings → Warehouses adds a Stock tab and per-warehouse Stock links to the same list",
      },
      {
        type: "improvement",
        description:
          "Warehouse and location filters plus serial/SKU search make it easier to find units before branch delivery",
      },
      {
        type: "improvement",
        description:
          "Clear empty-state guidance when warehouse stock has not been loaded yet",
      },
      {
        type: "improvement",
        description:
          "On Settings → Warehouses → Stock, search the warehouse list by code or name to open stock faster",
      },
      {
        type: "improvement",
        description:
          "Warehouse locations are clearer when expanded — structured list, labeled add form, and a friendly empty state",
      },
      {
        type: "improvement",
        description:
          "The sidebar follows a clearer workflow order: Orders, Sales & Returns, Logistics, Inventory, Reports, and Audit Logs — with AORs first under Settings → Operations & Planning",
      },
    ],
  },
  {
    version: "0.25.3",
    date: "2026-08-11",
    releasedAt: "2026-08-11T11:30:00+08:00",
    title: "Branch transaction numbers and pull-out rules",
    highlights: [
      "The same SI or Trans No. can be used on different branches — each branch keeps its own sequence",
      "Official Sales ADD is blocked when a unit is For pull-out or already in a pull-out workflow",
      "Process owners can review which of the 45 Process Flow steps are covered, partial, or not yet in ISMS",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Sales and Official Sales allow the same transaction number on different branches within your company",
      },
      {
        type: "improvement",
        description:
          "Official Sales ADD now stops with a clear message when inventory is on pull-out hold instead of recording a sale",
      },
      {
        type: "improvement",
        description:
          "A Process Flow coverage guide lists steps 1–45 as covered, partial, or missing so teams can prioritize next work",
      },
      {
        type: "fix",
        description:
          "Transaction number checks in Sales & ATR are scoped to the selected branch so duplicates on other branches no longer block encode",
      },
    ],
  },
  {
    version: "0.25.2",
    date: "2026-08-11",
    releasedAt: "2026-08-11T09:15:00+08:00",
    title: "Returns tab access control",
    highlights: [
      "Who can open the Returns tab is now a separate setting from who can request, evaluate, approve, or complete a return",
      "People with only Returns access land on Returns; people without it stay on Sales",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Roles can grant View returns so the Returns tab is visible without giving return workflow actions",
      },
      {
        type: "improvement",
        description:
          "Sales & ATR shows only the tabs your role allows, and opens the right one by default",
      },
    ],
  },
  {
    version: "0.25.1",
    date: "2026-08-11",
    releasedAt: "2026-08-11T08:50:00+08:00",
    title: "Demo warehouse stock for Official Sales",
    highlights: [
      "Demo environments now include a few warehouse serials so you can try Official Sales WHSE_ADD without waiting on a live warehouse feed",
      "Download Template’s WHSE_ADD sample uses a real demo serial and Western Makati as Branch Sold",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Demo warehouse serials are available for Official Sales WHSE_ADD testing (after a full or warehouse seed)",
      },
      {
        type: "improvement",
        description:
          "Official Sales template WHSE_ADD sample matches the demo warehouse serial and Makati branch",
      },
      {
        type: "improvement",
        description:
          "Returns tab ACTIONS matches Sales — only View details; return steps stay in sale details",
      },
      {
        type: "improvement",
        description:
          "Returns tab adds Show all columns / Fewer columns like Sales — amount, ATR, and notes when you need them",
      },
    ],
  },
  {
    version: "0.25.0",
    date: "2026-08-11",
    releasedAt: "2026-08-11T08:45:00+08:00",
    title: "Sales Returns tab",
    highlights: [
      "Sales & ATR now has Sales and Returns tabs so return requests have their own list",
      "Returns shows status badges for each request in the ATR pipeline",
      "Start a return the same way as before — from a sale’s View details",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Sales & ATR adds a Returns tab with a full ledger of return requests and status badges",
      },
      {
        type: "improvement",
        description:
          "Return workflow steps are available from sale View details when your role allows",
      },
    ],
  },
  {
    version: "0.24.1",
    date: "2026-08-11",
    releasedAt: "2026-08-11T08:30:00+08:00",
    title: "Official Sales process reliability",
    highlights: [
      "Stock moves from Official Sales (warehouse pull-in and branch conflicts) show up in Serial Number Logs",
      "When some rows fail during Process, the summary lists the failed serials and their errors",
      "Re-processing a serial that is already Official Sold now succeeds instead of failing",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Serial Number Logs now show Official Sales stock adjustments alongside ADD, DEL, and warehouse ADD",
      },
      {
        type: "improvement",
        description:
          "Process Official Sales summarizes failed serials in the result message while keeping each row’s own status",
      },
      {
        type: "fix",
        description:
          "ADD on a serial that is already Official Sold is treated as a successful no-op instead of an error",
      },
    ],
  },
  {
    version: "0.24.0",
    date: "2026-08-07",
    releasedAt: "2026-08-07T18:20:00+08:00",
    title: "Sales overview on the Dashboard",
    highlights: [
      "People with Sales & ATR access now see a Sales overview on the Dashboard — this month’s sales and amount, open ATR, and returns in progress",
      "Charts show sale status mix and the ATR / return pipeline; rankings highlight top branches and models for the month",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Dashboard Sales overview shows this month’s sales KPIs, sale status mix, ATR and return pipeline, and top branches and models for people who can open Sales & ATR",
      },
    ],
  },
  {
    version: "0.23.5",
    date: "2026-08-07",
    releasedAt: "2026-08-07T18:00:00+08:00",
    title: "Serial Number Logs keep original registration branch",
    highlights: [
      "Registered events in Serial Number Logs keep the original branch even after stock moves or Official Sales deletes",
    ],
    changes: [
      {
        type: "fix",
        description:
          "Serial Number Logs Registered location no longer follows the live inventory branch after transfers or Official Sales moves",
      },
    ],
  },
  {
    version: "0.23.4",
    date: "2026-08-07",
    releasedAt: "2026-08-07T17:50:00+08:00",
    title: "Alternate branch filter clears on dealer change",
    highlights: [
      "Changing Filter by dealer now clears the previous alternate branch picks and selects the new dealer’s branches",
      "Clearing Filter by dealer restores the original alternate branch picks",
    ],
    changes: [
      {
        type: "fix",
        description:
          "Filter by dealer on add/edit branch replaces alternate branch selections instead of stacking dealers together",
      },
      {
        type: "improvement",
        description:
          "Clearing Filter by dealer restores the branch’s original alternate picks instead of leaving the last auto-select",
      },
    ],
  },
  {
    version: "0.23.3",
    date: "2026-08-07",
    releasedAt: "2026-08-07T17:45:00+08:00",
    title: "Official Sales delete restore and sale details",
    highlights: [
      "Deleting an Official Sales row puts the unit back in stock at the branch where it was sold",
      "Adding Official Sales now carries package, brand, sale amount, and model price into Sales & ATR",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Official Sales ADD and warehouse add now fill package, brand, sale amount, and model price on the sales line so Sales & ATR matches the upload",
      },
      {
        type: "improvement",
        description:
          "Official Sales delete restores stock at the sold branch instead of the earlier delivery branch",
      },
      {
        type: "fix",
        description:
          "Unknown package or brand names in an Official Sales upload now show a clear error instead of saving blank values",
      },
    ],
  },
  {
    version: "0.23.2",
    date: "2026-08-07",
    releasedAt: "2026-08-07T17:35:00+08:00",
    title: "Easier alternate branch picking by dealer",
    highlights: [
      "When adding or editing a branch, use Filter by dealer to find and select alternate branches",
      "The main Dealer field only sets who owns the branch — it no longer drives alternate picks",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Add or edit branch now has a Filter by dealer control for alternate branches (lists and selects that dealer’s branches)",
      },
      {
        type: "improvement",
        description:
          "Changing the main Dealer no longer changes which alternate branches are listed or selected",
      },
    ],
  },
  {
    version: "0.23.1",
    date: "2026-08-07",
    releasedAt: "2026-08-07T17:30:00+08:00",
    title: "Smoother large Branch and Models imports",
    highlights: [
      "Large Branch and Models imports show a progress bar while they run",
      "Imports show time remaining and remind you to keep the page open",
      "Finished import totals now match what the preview said would change",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Branch and Models import now show real progress while applying large files",
      },
      {
        type: "improvement",
        description:
          "While importing, you see an estimated time left and a reminder not to refresh or close the page",
      },
      {
        type: "improvement",
        description:
          "Import dialogs use shorter help text so the preview stays easier to scan",
      },
      {
        type: "fix",
        description:
          "Large Branch and Models imports no longer time out or crash the page mid-apply",
      },
      {
        type: "fix",
        description:
          "Branch import success totals now match the preview create and update counts for the whole file",
      },
    ],
  },
  {
    version: "0.23.0",
    date: "2026-08-07",
    releasedAt: "2026-08-07T16:55:00+08:00",
    title: "Bulk import for product models",
    highlights: [
      "Download a Models template and upload it to add or update many SKUs at once",
      "New codes are created; existing ones are updated when details change",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Master data Models adds Import with Download template and upload preview — new SKUs are created and existing ones are updated when values differ",
      },
    ],
  },
  {
    version: "0.22.0",
    date: "2026-08-07",
    releasedAt: "2026-08-07T16:40:00+08:00",
    title: "Series and Categories in Master data",
    highlights: [
      "Model-linked product groups now appear as Series in Master data",
      "Categories is available as its own empty list for your own product classification",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Master data Products adds Series (linked to models) and a separate Categories list you can manage on its own",
      },
      {
        type: "improvement",
        description:
          "Models, planogram, and forecast imports keep using the same series values under the Series name",
      },
    ],
  },
  {
    version: "0.21.0",
    date: "2026-08-07",
    releasedAt: "2026-08-07T16:15:00+08:00",
    title: "Ordering locks by module",
    highlights: [
      "Choose which order modules company locked days and daily hours apply to",
      "Defaults to Manual orders so Special and Auto replenish stay open unless you include them",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Ordering policy adds Applies to checkboxes (Manual, Special, Auto replenish) shared by weekday and daily time locks",
      },
      {
        type: "improvement",
        description:
          "Lock messages name the order module when company policy blocks create, submit, or approve",
      },
    ],
  },
  {
    version: "0.20.8",
    date: "2026-08-07",
    releasedAt: "2026-08-07T15:55:00+08:00",
    title: "Richer branch forms and import",
    highlights: [
      "Add and Edit branch put SAP code beside name, with Active/Inactive as an on/off switch",
      "Alternate branches follow the Dealer you pick at the top — no second dealer filter",
      "Branch import download includes dealer, warehouse, geo, alternates, and schedule columns — without an Allowed Models sheet",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Choosing a dealer lists and can select that dealer’s active branches as alternates (same idea as AOR)",
      },
      {
        type: "feature",
        description:
          "Branch import template covers the full branch form (dealer, warehouse, areas, alternates, delivery schedule) and applies those fields on upload",
      },
      {
        type: "improvement",
        description:
          "SAP code and name sit on one row; status is an Active/Inactive switch; Add and Edit dialogs stay wider for denser forms",
      },
      {
        type: "improvement",
        description:
          "Import download is a single Branches sheet; older files with Allowed Models still work if you upload them",
      },
      {
        type: "fix",
        description:
          "Removed the duplicate dealer filter under alternate branches — the main Dealer field drives the list",
      },
    ],
  },
  {
    version: "0.20.7",
    date: "2026-08-07",
    releasedAt: "2026-08-07T15:40:00+08:00",
    title: "Stock units show Stock only",
    highlights: [
      "Stock units lists Stock (STK) units only — Sold, Official Sold, and in-transit stay in Sales or Logistics",
      "The status filter is removed from Stock units so the list stays focused on on-hand stock",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Stock units shows Stock (STK) only; other statuses belong in Sales & Returns or Logistics",
      },
      {
        type: "improvement",
        description:
          "Status filter control removed from the Stock units toolbar",
      },
    ],
  },
  {
    version: "0.20.6",
    date: "2026-08-07",
    releasedAt: "2026-08-07T15:35:00+08:00",
    title: "Pickers stay inside dialogs",
    highlights: [
      "Model and other searchable lists stay within the dialog — long names wrap instead of spilling off the side",
    ],
    changes: [
      {
        type: "fix",
        description:
          "Searchable pickers no longer overflow past Add Line Items and other dialogs; full names still show by wrapping",
      },
    ],
  },
  {
    version: "0.20.4",
    date: "2026-08-07",
    releasedAt: "2026-08-07T15:25:00+08:00",
    title: "Full model names in pickers",
    highlights: [
      "Model and other searchable pickers show the full name instead of cutting it off with …",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Searchable pickers (like Model on Add Line Items) show the full name instead of truncating with …",
      },
    ],
  },
  {
    version: "0.20.3",
    date: "2026-08-07",
    releasedAt: "2026-08-07T14:45:00+08:00",
    title: "Price lists hover cue",
    highlights: [
      "Price list cards show a hand cursor on hover so it’s clearer they’re clickable",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Price list cards show a hand cursor when you hover over them",
      },
    ],
  },
  {
    version: "0.20.2",
    date: "2026-08-07",
    releasedAt: "2026-08-07T14:15:00+08:00",
    title: "Official Sales cleanup & activity trail",
    highlights: [
      "Remove TO-FOLLOW placeholder lines from Official Sales when the real serial is not needed",
      "Sales & ATR no longer shows Delete on TO-FOLLOW rows — clean those up from Official Sales instead",
      "Serial Number Logs keep every Official Sales ADD, DEL, and WHSE_ADD as its own history row — including after corrections",
      "Each Official Sales log clearly shows the Action Key (ADD, DEL, or WHSE_ADD)",
      "Rows already marked Official Sold now show as Error instead of Success when you process them again",
      "Official Sales delete confirms which branch stock returned to after removing a sold line",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Delete TO-FOLLOW placeholder lines from Official Sales without moving stock",
      },
      {
        type: "feature",
        description:
          "Serial Number Logs keep every Official Sales ADD, DEL, and WHSE_ADD so ADD→DEL→ADD cycles stay visible",
      },
      {
        type: "improvement",
        description:
          "Official Sales rows in Serial Number Logs show the Action Key (ADD, DEL, WHSE_ADD) in the event and status",
      },
      {
        type: "improvement",
        description:
          "Official Sales delete messaging shows where stock was restored after removing a sold line",
      },
      {
        type: "improvement",
        description:
          "Sales & ATR list no longer shows Delete on TO-FOLLOW rows; cleanup stays in Official Sales",
      },
      {
        type: "fix",
        description:
          "Processing an already Official Sold row marks the staging line as Error instead of Success",
      },
      {
        type: "fix",
        description:
          "Successful Official Sales ADD paths that previously skipped history now appear in Serial Number Logs",
      },
    ],
  },
  {
    version: "0.20.1",
    date: "2026-08-07",
    releasedAt: "2026-08-07T14:02:00+08:00",
    title: "Clearer Sales & ATR list",
    highlights: [
      "ID and transaction number stay visible while you scroll the Sales & ATR table sideways",
      "Transaction numbers show branch, brand, and model underneath for quicker scanning",
      "Use Show all columns for package, brand, model, and model price — or Fewer columns for a compact list",
      "Sales & Official Sales remember whether you prefer full or compact columns next time you visit",
      "Rows alternate shading so long lists are easier to scan",
      "Empty search results show a clear message instead of a blank table",
      "Save Transaction and Back sit on the right when encoding a new sale",
      "Add Line Items fields use a clear white background against the set panels",
      "Select line items (or Select all) and delete them in one step when encoding a sale",
      "Line items show a # index so each set is easy to count",
    ],
    changes: [
      {
        type: "feature",
        description:
          "New sale line items support Select all and Delete selected so you can remove several rows at once",
      },
      {
        type: "improvement",
        description:
          "New sale line items show a # column for quick row numbering",
      },
      {
        type: "improvement",
        description:
          "Sales & ATR freezes ID and TRN NO. while scrolling sideways, matching Official Sales",
      },
      {
        type: "improvement",
        description:
          "Sales & ATR transaction numbers show helpful branch, brand, and model details underneath in the compact view",
      },
      {
        type: "improvement",
        description:
          "Sales & ATR toolbar adds Show all columns / Fewer columns so package, brand, model, and model price stay optional",
      },
      {
        type: "improvement",
        description:
          "Sales & Official Sales remember your Show all columns / Fewer columns choice for the next visit",
      },
      {
        type: "improvement",
        description:
          "Sales & ATR list is easier to scan with alternating row shading, denser spacing, and a clear empty-search message",
      },
      {
        type: "improvement",
        description:
          "New sale form places Back and Save Transaction on the right, with Save as the primary action",
      },
      {
        type: "improvement",
        description:
          "Text fields and dropdowns use a white background so they stay readable on shaded form panels",
      },
    ],
  },
  {
    version: "0.20.0",
    date: "2026-08-06",
    releasedAt: "2026-08-06T17:15:00+08:00",
    title: "Official Sales by Action Key",
    highlights: [
      "Official Sales now follows the Action Key on each row — ADD, warehouse ADD, or delete — instead of guessing from stock status",
      "Processed rows mark units Official Sold; delete puts stock back so you can correct dealer files confidently",
      "Download Template includes sample rows for each Action Key, and the ? guide matches the new flow",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Official Sales process uses Action Key: ADD for branch official sales, WHSE_ADD when the serial is still in the warehouse, and DEL to reverse an official or sold line and restore stock",
      },
      {
        type: "feature",
        description:
          "Units processed as official sales show as Official Sold — separate from everyday Sold / Reserved on Sales & ATR",
      },
      {
        type: "improvement",
        description:
          "Staging results spell out the path taken (for example Official Sold or stock restored), and the template plus quick guide show ADD, DEL, and WHSE_ADD",
      },
      {
        type: "improvement",
        description:
          "Branch name on the file must match a real branch; transaction number from the file is kept when present",
      },
      {
        type: "fix",
        description:
          "UPD on the file no longer pretends to process — you get a clear message to edit that sale under Sales instead",
      },
    ],
  },
  {
    version: "0.19.7",
    date: "2026-08-06",
    releasedAt: "2026-08-06T17:05:00+08:00",
    title: "Cleaner sales encode details",
    highlights: [
      "When adding package line items, pick promo type once above the sets — it applies to every serial",
      "SI/Trans no is no longer a separate field; transaction number is enough",
      "Edit a package set to fix serials or other details; delete removes the whole package set after confirm",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Transaction details can be edited — opens Add Line Items again with the package sets filled in so you can correct serials and other fields",
      },
      {
        type: "improvement",
        description:
          "Promo type on Add Line Items sits above the sets and applies to all serials in the package instead of being chosen per set",
      },
      {
        type: "improvement",
        description:
          "New sales transaction no longer asks for SI/Trans no separately — it follows the transaction number",
      },
      {
        type: "improvement",
        description:
          "Deleting a detail asks for confirmation and removes the entire package set (all serials), not just one line",
      },
    ],
  },
  {
    version: "0.19.6",
    date: "2026-08-04",
    releasedAt: "2026-08-04T19:30:00+08:00",
    title: "Official Sales quick guide",
    highlights: [
      "Official Sales has a ? quick guide beside the page title",
      "Learn download, upload, review, process, view details, and delete in one short walkthrough",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Official Sales shows a quick guide (?) next to the title covering template download, upload, staging review, process pending, view details, delete, and show all columns",
      },
    ],
  },
  {
    version: "0.19.5",
    date: "2026-08-04",
    releasedAt: "2026-08-04T19:20:00+08:00",
    title: "Official Sales progress popup",
    highlights: [
      "Upload, Process, and Download Template open a progress window with a live step checklist",
      "You can follow each step with checkmarks; errors stay open so you can read what failed",
      "Toolbar spinners still show while work runs, and row selection stays responsive",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Official Sales Upload, Process pending, and Download Template show a progress popup with a live timeline of steps",
      },
      {
        type: "improvement",
        description:
          "Successful Official Sales actions briefly show Done then close; failures stay open with a Close button",
      },
      {
        type: "improvement",
        description:
          "Process pending shows how many rows are being worked and the ok / failed counts when finished",
      },
    ],
  },
  {
    version: "0.19.4",
    date: "2026-08-04",
    releasedAt: "2026-08-04T19:10:00+08:00",
    title: "Clearer Official Sales action feedback",
    highlights: [
      "Download, Upload, Process, and Delete show a spinner so you know work is in progress",
      "Row checkboxes stay responsive while other actions run",
      "Processing many rows starts with a clear progress toast",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Official Sales staging buttons show loading feedback for download, upload, process, and delete without freezing the whole table",
      },
      {
        type: "improvement",
        description:
          "Selecting staging rows stays snappy while template download or other actions are running",
      },
      {
        type: "improvement",
        description:
          "Process pending shows how many rows are being worked on when you start",
      },
    ],
  },
  {
    version: "0.19.3",
    date: "2026-08-04",
    releasedAt: "2026-08-04T18:58:00+08:00",
    title: "Clearer Official Sales staging details",
    highlights: [
      "Staging View shows all sale fields in one clean two-column layout",
      "Long results are easier to read, with Process, Delete, and Close in the footer",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Official Sales staging details use one consistent layout for every field, with a clearer Result area and Process, Delete, and Close in the footer",
      },
    ],
  },
  {
    version: "0.19.2",
    date: "2026-08-04",
    releasedAt: "2026-08-04T18:45:00+08:00",
    title: "Official Sales staging View and mobile polish",
    highlights: [
      "Open any staging row with View to see full details, then Process or Delete when the row allows it",
      "Download Template sits next to search so Upload and Process stay as the main actions",
      "Staging table works more comfortably on phones with sideways scroll and a cleaner toolbar",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Official Sales Actions uses View to open a details window with Process and Delete for pending or failed rows",
      },
      {
        type: "improvement",
        description:
          "Download Template moves beside the search bar; Upload sales and Process pending stay on the right",
      },
      {
        type: "improvement",
        description:
          "Official Sales staging toolbar and table are easier to use on smaller screens",
      },
    ],
  },
  {
    version: "0.19.1",
    date: "2026-08-04",
    releasedAt: "2026-08-04T18:35:00+08:00",
    title: "Clearer Official Sales staging list",
    highlights: [
      "Official Sales staging opens with a shorter column set so rows are easier to scan",
      "Dealer, brand, and model show under the serial; use Show all columns when you need the full template",
      "Long result messages stay truncated until you hover for the full text",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Official Sales staging defaults to Serial, Branch, Date, SI/Trans No., Action, Status, and Result — with dealer details tucked under Serial",
      },
      {
        type: "improvement",
        description:
          "Show all columns reveals Dealer, Brand, Item/Model, Sale Amount, and Package when you need the full dealer template",
      },
      {
        type: "improvement",
        description:
          "Long Result messages truncate with a hover tip, and Serial stays visible while you scroll sideways",
      },
    ],
  },

  {
    version: "0.19.0",
    date: "2026-08-04",
    releasedAt: "2026-08-04T18:20:00+08:00",
    title: "Official Sales dealer template",
    highlights: [
      "Download Template matches the dealer spreadsheet — Dealer through Action Key with clear column colors",
      "Upload keeps Dealer, Brand, Item/Model, Sale Amount, and Package in the staging list",
      "Date and SI/Trans No. are preferred when both dealer and DR columns are filled",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Official Sales Download Template matches the dealer layout (Dealer, Brand, Branch Name, dates, serial, sale amount, package, Action Key) with colored headers",
      },
      {
        type: "feature",
        description:
          "Official Sales staging shows the same dealer columns so uploaded rows stay easy to review before Process",
      },
      {
        type: "improvement",
        description:
          "When both Date and DR Date (or SI/Trans No. and DR No.) are present, Official Sales uses Date and SI/Trans No. for processing",
      },
    ],
  },

  {
    version: "0.18.2",
    date: "2026-08-04",
    releasedAt: "2026-08-04T18:06:00+08:00",
    title: "What’s New shows date, time, and one NEW badge",
    highlights: [
      "What’s New shows the release date and ship time (for example 04.08.26 · 6:06pm)",
      "The NEW badge appears once on the latest release title — not on every change row",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "What’s New shows the release date and ship time above the update list",
      },
      {
        type: "fix",
        description:
          "What’s New shows NEW once on the latest release title — not on every Feature, Improvement, or Fix row",
      },
    ],
  },

  {
    version: "0.18.1",
    date: "2026-08-04",
    title: "Clearer Orders, Logistics, and dashboard reliability",
    highlights: [
      "Orders and Logistics only show actions for your step; View details is always available",
      "New orders stay limited to branches in your area so they show up in your list right away",
      "Accept delivery and dashboard activity cards work reliably again",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Sales and Orders lists include View details for the full transaction or approval history",
      },
      {
        type: "improvement",
        description:
          "Orders and Logistics row actions only show when it is your step",
      },
      {
        type: "improvement",
        description:
          "New orders stay limited to branches in your area so they show up in your list right away",
      },
      {
        type: "fix",
        description:
          "Accept delivery on Logistics works again for pending order deliveries",
      },
      {
        type: "fix",
        description:
          "Dashboard activity cards and Product Specialist order approvals work reliably again",
      },
    ],
  },

  {
    version: "0.18.0",
    date: "2026-08-04",
    title: "Sort any list by column headers",
    highlights: [
      "Click a column header on most list tables to sort ascending or descending",
      "Arrows show which column is active so you can find rows faster",
    ],
    changes: [
      {
        type: "feature",
        description:
          "List tables across Inventory, Orders, Sales, Logistics, Settings, Audit, and more support ascending or descending sort from the column headers",
      },
    ],
  },

  {
    version: "0.17.0",
    date: "2026-08-04",
    title: "Order Policy daily lock and new delivery cadences",
    highlights: [
      "Set company hours when nobody can place or approve orders (daily time lock, Manila time)",
      "Ordering frequency codes now include Daily and Three times a month for branch delivery cadence",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Order Policy can lock create, submit, and approve during daily company hours you choose (Manila time)",
      },
      {
        type: "feature",
        description:
          "Order Policy frequency codes can use Daily and Three times a month cadences (alongside existing weekly options)",
      },
    ],
  },

  {
    version: "0.16.0",
    date: "2026-08-04",
    title: "Official Sales accounting columns and staging cleanup",
    highlights: [
      "Official Sales template and staging use Trans Date, Trans #, Serial Number, Branch Sold, and Action",
      "SALE keeps Sold on the sale line; RETURN puts stock back without changing sale status",
      "Delete pending or failed staging rows — with a clear confirm dialog beside Process",
      "Select several pending or failed staging rows at once and delete them together",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Delete Official Sales staging rows that are still pending or failed — successfully processed rows stay protected",
      },
      {
        type: "improvement",
        description:
          "Official Sales template and staging use Trans Date, Trans #, Serial Number, Branch Sold, and Action (older Serial / DR DATE / DR NO files still upload)",
      },
      {
        type: "improvement",
        description:
          "Official Sales SALE keeps Sold on the sale line; RETURN restores stock without flipping sale status to Stock",
      },
      {
        type: "improvement",
        description:
          "Select multiple pending or failed Official Sales staging rows and delete them in one step",
      },
      {
        type: "improvement",
        description:
          "Official Sales Delete asks for confirmation in a dialog and sits as a clear button next to Process",
      },
    ],
  },

  {
    version: "0.15.1",
    date: "2026-08-04",
    title: "Sales encode polish and reliability",
    highlights: [
      "Attach multiple proof files and review them in a preview window",
      "Type the transaction number from your invoice when encoding a sale",
      "Model price fills from the latest price list — and stays at 0 when none exists",
      "TO FOLLOW saves reliably; returns show Pending CS and ask for a reason",
      "When you sell from another branch’s stock, the unit moves to the selling branch",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Sale Proof supports multiple photos or PDFs on one transaction",
      },
      {
        type: "feature",
        description:
          "Model price falls back to the most recent master price list when today’s period is missing, and stays locked at 0 when no list exists",
      },
      {
        type: "improvement",
        description:
          "Sale details opens proofs in a preview window with file list and next/previous — no need to leave the page",
      },
      {
        type: "improvement",
        description:
          "New sales lets you type the transaction number from your invoice",
      },
      {
        type: "improvement",
        description:
          "Sale details uses a clearer layout with return actions at the bottom and proof review from attachments",
      },
      {
        type: "improvement",
        description:
          "Serial number logs show Sales transaction with Inventory: Sold (or Reserved when reserved)",
      },
      {
        type: "fix",
        description:
          "When selling from another branch’s stock, the unit’s location moves to the branch that sold it",
      },
      {
        type: "fix",
        description:
          "Edit serial and completed returns correctly return stock to the original stock source",
      },
      {
        type: "fix",
        description:
          "Edit serial on Sales & ATR only lists stock units for that product model, plus TO FOLLOW",
      },
      {
        type: "fix",
        description:
          "Serial number activity logs open again when viewing sold items",
      },
      {
        type: "fix",
        description:
          "Saving a sale with TO FOLLOW no longer fails",
      },
      {
        type: "fix",
        description:
          "Branch stock source lists area locations with sellable stock, and serials come from that stock",
      },
      {
        type: "fix",
        description:
          "Model price fills from the master price list when you pick a model (including the latest prior period when today has no list)",
      },
      {
        type: "fix",
        description:
          "After a return is requested, Sales list status shows Pending CS instead of staying on TO FOLLOW",
      },
      {
        type: "fix",
        description:
          "Request return works again and asks for a return reason",
      },
      {
        type: "fix",
        description:
          "Sales proof attachments save and open correctly",
      },
    ],
  },

  {
    version: "0.15.0",
    date: "2026-08-04",
    title: "Sales status stays with the sale",
    highlights: [
      "Sales & ATR status stays with the sale — editing inventory no longer flips Sold to Stock",
      "Sales list shows one row per serial with clear status badges (including TO FOLLOW)",
      "Customize Sales & ATR return badge names and colors in Status settings",
      "Encode with TO FOLLOW when a serial is not available yet, then edit the sale later",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Sales encode offers TO FOLLOW when a serial is not available yet; use Edit on the sale row later to set or change the serial",
      },
      {
        type: "feature",
        description:
          "Settings → Status includes a Sales & ATR group to rename and recolor return and ATR badges",
      },
      {
        type: "improvement",
        description:
          "Sale details line table shows Status again (Sold, TO FOLLOW, return steps, and more)",
      },
      {
        type: "improvement",
        description:
          "Sales & ATR lists one row per serial; multi-unit sales share the same ID and transaction number",
      },
      {
        type: "improvement",
        description:
          "Sales return and ATR badges use names and colors from Status settings",
      },
      {
        type: "fix",
        description:
          "Sales & ATR status stays with the sale line and no longer changes when inventory status is edited",
      },
    ],
  },

  {
    version: "0.14.0",
    date: "2026-08-04",
    title: "Service center operations",
    highlights: [
      "New Service menu for service center inventory, sales & returns, orders, deliveries, and pull-outs",
      "Assign service centers in Areas of responsibility so people only see their sites",
      "Stock in, sell, order, accept deliveries, and pull out units on the service center ledger",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Service menu covers service center inventory, sales with returns, orders, deliveries, and pull-outs",
      },
      {
        type: "feature",
        description:
          "Areas of responsibility can assign service centers so Service screens stay scoped to each person",
      },
      {
        type: "feature",
        description:
          "Manual stock-in, sell from stock, order to delivery accept, and pull-outs update service center stock only",
      },
    ],
  },

  {
    version: "0.13.23",
    date: "2026-08-03",
    title: "Smoother sales, clearer roles, and a cleaner dashboard screen",
    highlights: [
      "Help & Support How ISMS works Improved with Workflow Guide — solid step cards, a tidy process tab bar, numbered steps with no sideways scroll, and vertical role timelines",
      "More Dashboard summaries: Planning & alerts for extra ops signals, plus a This month snapshot (orders, sales, in transit) with icons",
      "Module guides on busy pages — short collapsible tips under the header (Inventory, Sales, Orders, Logistics, Roles, Planning, Planogram, AORs, and more)",
      "Sign-in has been optimized to load faster",
      "Browser tabs show friendly page names (for example, Stock units)",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Help & Support How ISMS works: solid step cards and process chips, numbered steps, and vertical role timelines",
      },
      {
        type: "feature",
        description:
          "Compliance home shows Policies, Reports, Announcements, and Competitors when available",
      },
      {
        type: "feature",
        description:
          "New sales shows the transaction number up front and saves it with the sale",
      },
      {
        type: "feature",
        description:
          "Sale details support packages, brand, promo, stock-source branch, and proof upload",
      },
      {
        type: "feature",
        description:
          "Click a serial cell with +N to see every serial on that sale",
      },
      {
        type: "feature",
        description:
          "Role settings can turn ATR request, evaluate, approve, and restore on or off per role",
      },
      {
        type: "feature",
        description:
          "Logistics and settings can grant view-only access separately from manage",
      },
      {
        type: "feature",
        description:
          "Status settings let you choose badge colors; each tab explains which module uses those codes",
      },
      {
        type: "feature",
        description:
          "Busy pages show a collapsible module guide under the header so you can skim how the screen works",
      },
      {
        type: "improvement",
        description:
          "Sales & Returns return actions (request, evaluate, approve, reject, restore) ask for confirmation before running",
      },
      {
        type: "improvement",
        description:
          "Dashboard screen adds Planning & alerts and a This month snapshot alongside inventory and the order pipeline",
      },
      {
        type: "improvement",
        description:
          "Inventory summary shows status counts beside the chart; This month sits beside Order pipeline",
      },
      {
        type: "improvement",
        description:
          "This month snapshot uses icons and clearer rows for orders, sales, and in transit",
      },
      {
        type: "improvement",
        description:
          "Activity cards share rows evenly so the dashboard layout stays tidy for every role",
      },
      {
        type: "improvement",
        description:
          "Removed duplicate Ops snapshot tiles so numbers appear once in the activity cards",
      },
      {
        type: "improvement",
        description:
          "Roles matrix and access drawer are searchable and easier on mobile",
      },
      {
        type: "improvement",
        description:
          "Stock units Series summary starts collapsed; click the header to expand or hide (choice remembered)",
      },
      {
        type: "improvement",
        description:
          "Inventory quick guide covers off planogram and Branch / Model / Serial / DR / Planogram / Aging / Status columns",
      },
    
      {
        type: "improvement",
        description:
          "Sales & Returns list uses clear status badges and consistent serial / amount formatting",
      },
      {
        type: "improvement",
        description:
          "Series summary includes a searchable View series dialog with sticky totals",
      },
      {
        type: "improvement",
        description:
          "Planning and Suggested orders use clearer action buttons and soft status badges on draft orders",
      },
      {
        type: "improvement",
        description:
          "Sign-in loading is quieter; report page titles match the sidebar",
      },
      {
        type: "fix",
        description:
          "Stock status donut hover shows the slice you point at, not a conflicting total tip",
      },
      {
        type: "fix",
        description:
          "Inventory and off-planogram views are more stable under heavy lists",
      },
      {
        type: "fix",
        description:
          "Restore stock on returns works for one or many serials, and shows a clear message if a sale has no serials left to restore",
      },
      {
        type: "fix",
        description:
          "Serial activity log no longer fails when an old sold serial is missing",
      },
      {
        type: "fix",
        description:
          "Transfers confirm dialog no longer flashes an error when listing serials",
      },
      {
        type: "fix",
        description:
          "Confirmation dialogs stay readable without browser accessibility console spam",
      },
    ],
  },

  {
    version: "0.13.11",
    date: "2026-07-31",
    title: "New sales encode and package details",
    highlights: [
      "Record a new sale from Sales with a clear header, details table, and Save / Back",
      "Add package details by quantity — each unit gets its own model, serial, and amount",
      "Multi-line sales update each serial’s stock status; use New transaction instead of the old inline form",
    ],
    changes: [
      {
        type: "feature",
        description:
          "New sales page with header, details table, and Save / Back",
      },
      {
        type: "feature",
        description:
          "Package detail modal expands quantity into separate model / serial / amount rows",
      },
      {
        type: "improvement",
        description:
          "Sales list keeps returns workflow; New transaction opens the full encode page",
      },
      {
        type: "fix",
        description:
          "Dialogs no longer show accessibility warnings in the browser console",
      },
    ],
  },
  {
    version: "0.13.9",
    date: "2026-07-30",
    title: "Branch schedule UX uses company ordering policy & Inventory serial details",
    highlights: [
      "Branch delivery schedule shows company locked weekdays and clearer global vs branch hierarchy",
      "Selecting a frequency code suggests delivery and ordering days (editable after)",
      "Disabling a branch schedule clears the saved BranchDeliverySchedule row",
      "BRANCH and MODEL on Inventory Stock units are plain text (no planogram links)",
      "Clicking a row, Branch, Model, or Serial opens serial details and history",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Branch create/edit schedule card surfaces company locked days, disables those weekdays on pickers, and links to Settings → Ordering policy when permitted",
      },
      {
        type: "feature",
        description:
          "Frequency code selection autofills delivery/order days from cadence + global locks (suggest-schedule-days helper)",
      },
      {
        type: "fix",
        description:
          "Updating a branch with schedule disabled deletes BranchDeliverySchedule so stale orderDays no longer gate create",
      },
      {
        type: "fix",
        description:
          "Inventory stock units BRANCH/MODEL no longer link to planogram; row click opens serial details",
      },
    ],
  },
  {
    version: "0.13.7",
    date: "2026-07-30",
    title: "PH regions/provinces seed + PSG branch",
    highlights: [
      "Seed Regions and Provinces for every tenant from the PH REGION→PROVINCE master list",
      "New db:seed:branches loads ~1k PSG ISMS branches (areas, status, Devant/Hisense quotas)",
      "Branches Import can create missing sap_codes and accepts PSG ISMS columns / sheet",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Idempotent geo seed (Region / Province) for all tenants on core, minimal, full, and branches profiles",
      },
      {
        type: "feature",
        description:
          "PSG workbook parser + upsert: BranchArea, Branch by sap_code, current-month quotas (Hisense BL+WL summed); pnpm run db:seed:branches",
      },
      {
        type: "improvement",
        description:
          "Branches Import creates unknown BRANCH CODEs, previews create vs update counts, accepts ISMS/PSG single-sheet uploads",
      },
    ],
  },
  {
    version: "0.13.6",
    date: "2026-07-30",
    title: "Orders split, Sales encode polish, Inventory Excel view",
    highlights: [
      "Orders split into Manual / Special / Auto replenish with per-type view, create, and approve permissions",
      "Sales encode: PS auto-branch, TL can create sales with branch picker, transactionNo on the table",
      "Stock units: series QTY/VALUE summary, DR# / DR date / aging, status filter, PS column scoping",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Orders nav group with /orders/manual, /orders/special, /orders/auto-replenish; permissions orders.manual|special|auto_replenish × view|create|approve (legacy orders.* still accepted)",
      }, 
      {
        type: "improvement",
        description:
          "Sales encode: PS resolves AOR branch automatically; TL seed includes sales.create and keeps multi-branch picker; table shows transactionNo",
      },
      {
        type: "feature",
        description:
          "Inventory Stock units: series peso summary (QTY/VALUE), DR#/DR date/aging from deliveries, status filter, PS hides branch column/search",
      },
    ],
  },
  {
    version: "0.13.5",
    date: "2026-07-30",
    title: "Reports export form shown immediately",
    highlights: [
      "Processed Orders and Daily Stock reports show the CSV export form on load — no Load branches step",
      "Branch dropdown still loads in the background and defaults to All branches",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Reports: auto-load branches on mount and display Processed from/to, Branch, and Download CSV without a gate button",
      },
    ],
  },
  {
    version: "0.13.4",
    date: "2026-07-30",
    title: "Competitor brand and model masters",
    highlights: [
      "Competitor observations use dedicated CompetitorBrand / CompetitorModel masters (not inventory Brand/SKU)",
      "Master data: Competitor brands page with nested models (name + active status)",
      "Existing observation brand/model links migrated into the new tables with name snapshots",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Tenant-scoped CompetitorBrand and CompetitorModel lookups under Sales master data",
      },
      {
        type: "improvement",
        description:
          "Observation form and table pick competitor brands/models only; promotion stays free text",
      },
      {
        type: "fix",
        description:
          "Detached competitor observations from inventory Brand / ProductModel foreign keys",
      },
    ],
  },
  {
    version: "0.13.3",
    date: "2026-07-28",
    title: "AOR sync, Sales nav, Competitors master",
    highlights: [
      "AOR assign form hydrates existing branch/dealer/warehouse selections and syncs add/remove on submit",
      "Sales encode (`/sales`) and Sales report (`/reports/sales`) re-enabled in the sidebar",
      "Competitors: master lookup dropdown, AOR-bound branch on write, optional promotion field",
    ],
    changes: [
      {
        type: "fix",
        description:
          "AOR assign pre-selects the user’s current AORs and syncs create/delete instead of append-only re-pick",
      },
      {
        type: "improvement",
        description:
          "Sales and Sales report nav links restored for users with sales.create / reports access",
      },
      {
        type: "feature",
        description:
          "Competitor master data lookup; observations pick competitor + promotion; branch set from exactly one AOR branch",
      },
    ],
  },
  {
    version: "0.13.2",
    date: "2026-07-28",
    title: "SAP Service Layer session status UI",
    highlights: [
      "Session status strip on Service Layer settings: Connected / Idle with masked session id and countdown",
      "Connect and Logout establish or clear the in-process B1 session (separate from Test connection)",
      "Test connection remains a probe (login → logout) and does not leave a cached session",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Service Layer settings show live session status with Connect/Logout against the enabled company DB",
      },
      {
        type: "improvement",
        description:
          "Public session status masks session id (last 4 only); never exposes cookies",
      },
    ],
  },
  {
    version: "0.13.1",
    date: "2026-07-28",
    title: "SAP Service Layer session client",
    highlights: [
      "In-process B1 session cache with TTL and automatic re-login on 401",
      "Shared Service Layer HTTP client ready for future live document transport",
      "Connection test and config updates invalidate stale sessions",
    ],
    changes: [
      {
        type: "feature",
        description:
          "SAP Service Layer client: cookie session reuse, proactive TTL refresh, single retry after Invalid session / 401",
      },
      {
        type: "improvement",
        description:
          "Service Layer connection test uses login/logout via the shared client; sessions cleared on config mutate/disable/delete",
      },
    ],
  },
  {
    version: "0.13.0",
    date: "2026-07-23",
    title: "Branch quotas, Official Sales, and order dealer cascade",
    highlights: [
      "Alternate fulfillment picks other branches; Branch Quotas enforce monthly brand limits on create",
      "Official Sales under Reports — upload Excel/CSV, stage rows, process SALE/RETURN on serials",
      "Create order: pick dealer first, then that dealer’s active branches; package type qty on price list cards",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Alternate warehouses on branches now multi-select other active branches (not warehouse records)",
      },
      {
        type: "improvement",
        description:
          "Dealer dropdowns for branches, AORs, and orders only list active dealers",
      },
      {
        type: "feature",
        description:
          "Branch Quotas settings (Sheet CRUD) with monthly quota enforcement when creating branch orders",
      },
      {
        type: "feature",
        description:
          "Official Sales report: Excel/CSV staging table, clear temp, process STK→SLD sale or SLD/RSV→STK return",
      },
      {
        type: "feature",
        description:
          "Create branch order loads dealers and branches automatically; branch list filters by selected dealer",
      },
      {
        type: "feature",
        description:
          "Package types include quantity; price list cards show name · qty on the package badge",
      },
    ],
  },
  {
    version: "0.12.1",
    date: "2026-07-12",
    title: "New Settings modules, searchable lists, and clearer access",
    highlights: [
      "Look for the green NEW labels in the sidebar on Dealers, Service centers, Departments, Warehouses, and more",
      "Dealers, Service centers, Price lists, SAP, and Audit Logs — easier to find and control who can use them",
      "Type-to-search on dropdowns; Settings stays open by default; quicker sign-in and page guides",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Green NEW badges in the menu mark Dealers, Service centers, Departments, Warehouses, SAP, Audit Logs, Roles, Branches, Planogram, Master data, AORs, Announcements, Competitors, and P-Count",
      },
      {
        type: "feature",
        description:
          "Dealers — manage dealer records from Settings; Search + Add opens a right-side form",
      },
      {
        type: "feature",
        description:
          "Service centers — manage service centers from Settings; Search + Add opens a right-side form",
      },
      {
        type: "feature",
        description:
          "Price lists — its own Master data area with add and history in side panels, plus model cards with period history",
      },
      {
        type: "feature",
        description:
          "You can grant access separately for Departments, Dealers, Service centers, Warehouses, SAP integration, and Audit Logs",
      },
      {
        type: "feature",
        description:
          "Audit Logs (system and serial number logs) in the sidebar when you have Audit Logs access",
      },
      {
        type: "feature",
        description:
          "Most dropdowns let you type to find an option (branches, warehouses, roles, filters, and more)",
      },
      {
        type: "feature",
        description:
          "When adding a permission, search modules by name and scroll the list smoothly",
      },
      {
        type: "feature",
        description:
          "Quick guides on many pages can open once on first visit; use the ? button anytime to reopen them",
      },
      {
        type: "feature",
        description:
          "Search boxes in tables suggest matching rows from what is already on the page",
      },
      {
        type: "improvement",
        description:
          "Settings in the left menu starts expanded so Dealers, Service centers, Warehouses, and the rest are easier to reach",
      },
      {
        type: "improvement",
        description:
          "On Models and Brands/Categories, Search + Add also opens a right-side form panel",
      },
      {
        type: "improvement",
        description:
          "When adding or editing a user, show or hide the password with the eye icon (same as sign-in)",
      },
      {
        type: "improvement",
        description:
          "Sign-in keep a loading screen until the dashboard opens",
      },
      {
        type: "improvement",
        description:
          "Small polish: closer page titles, clearer close and Done actions, and dropdowns that look ready to use",
      },
      {
        type: "fix",
        description:
          "Audit Logs (including serial number logs) shows correctly again when you have Audit Logs access",
      },
    ],
  },
  {
    version: "0.12.0",
    date: "2026-07-11",
    title: "Announcements, Competitors, P-Count, and Settings upgrades",
    highlights: [
      "New: Announcements (with dashboard banner) and Competitors for market price notes",
      "P-Count stock count history and Reports → P-Count; friendlier Roles and bulk AOR assign",
      "Settings polish for Branches, Planogram, Master data, and AORs; header shows version · date",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Announcements — create and manage posts, with an active banner on the dashboard",
      },
      {
        type: "feature",
        description:
          "Competitors — record and review market price observations",
      },
      {
        type: "feature",
        description:
          "P-Count — keep stock-count history when you close a count; open Reports → P-Count for a summary",
      },
      {
        type: "feature",
        description:
          "Roles — easier setup with cards and grouped permissions; advanced matrix still available if you need it",
      },
      {
        type: "feature",
        description:
          "AORs — assign many branches or dealers at once; table grouped by user; searchable pickers",
      },
      {
        type: "feature",
        description:
          "Settings areas for Branches, Planogram, and Master data are easier to work with day to day",
      },
      {
        type: "improvement",
        description:
          "Header shows the current version and date next to What’s new; New badges and sidebar polish",
      },
      {
        type: "fix",
        description:
          "Removed a duplicate P-Count link under Inventory",
      },
    ],
  },
  {
    version: "0.11.40",
    date: "2026-06-02",
    title: "Faster updates on more Settings tables",
    highlights: [
      "Warehouses, status settings, and master data update in the table as soon as you save",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Create and edit on warehouses, status codes, and master data now show in the table right away",
      },
    ],
  },
  {
    version: "0.11.39",
    date: "2026-06-02",
    title: "Page quick guides",
    highlights: [
      "Page titles can show a ? button that opens a short guided walkthrough",
      "Branch orders includes guidance on order types and review steps",
    ],
    changes: [
      {
        type: "feature",
        description:
          "You can open a short tutorial from the page header ? button",
      },
      {
        type: "improvement",
        description:
          "Branch orders guide covers order types, review steps, and a link to Help",
      },
    ],
  },
  {
    version: "0.11.38",
    date: "2026-06-02",
    title: "Clearer order review actions",
    highlights: [
      "A loading screen appears while approve or reject is saving",
      "Review stays disabled with a short tip when it is not your turn to approve",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Approving or rejecting an order shows a loading screen until it finishes",
      },
      {
        type: "improvement",
        description:
          "Review is disabled with a tip when you are not the designated approver",
      },
      {
        type: "fix",
        description:
          "The “not your turn” tip no longer leaves a wide empty gap",
      },
    ],
  },
  {
    version: "0.11.37",
    date: "2026-06-02",
    title: "Help portal and loading bar polish",
    highlights: [
      "Top loading bar spans the full width without a dark shadow under the header",
      "Help page: sticky quick actions, essential links, and a larger FAQ",
    ],
    changes: [
      {
        type: "fix",
        description:
          "Top loading bar no longer shows a dark glow under the header",
      },
      {
        type: "improvement",
        description:
          "Help & Support focuses on quick actions, clearer headers, and more FAQ topics",
      },
    ],
  },
  {
    version: "0.11.36",
    date: "2026-06-02",
    title: "Richer Help & Support content",
    highlights: [
      "Help & Support uses a two-column layout with quick actions on the right",
      "Added a system overview and more workflow guides across major modules",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Help portal adds module navigation tips, more workflow guides, and grouped quick-action links",
      },
    ],
  },
  {
    version: "0.11.35",
    date: "2026-06-02",
    title: "Cleaner top loading bar",
    highlights: [
      "Removed the dark strip that appeared under the header while pages loaded",
    ],
    changes: [
      {
        type: "fix",
        description:
          "Top loading indicator no longer casts a dark shadow under the navigation",
      },
    ],
  },
  {
    version: "0.11.34",
    date: "2026-06-02",
    title: "Simpler Help & Support layout",
    highlights: [
      "Help portal is a single scrolling page instead of tabs",
      "Jump links and clearer sections make answers easier to find",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Help & Support uses anchored sections for quick actions, guides, FAQ, and contact",
      },
    ],
  },
  {
    version: "0.11.33",
    date: "2026-06-02",
    title: "Help & Support portal",
    highlights: [
      "User menu includes Help & Support for an in-app support page",
      "FAQ, workflow guides, quick links, and contact options in one place",
    ],
    changes: [
      {
        type: "feature",
        description:
          "New Help & Support page with overview, workflows, FAQ, and contact",
      },
      {
        type: "improvement",
        description:
          "Help & Support is available from the header and sidebar user menus",
      },
    ],
  },
  {
    version: "0.11.32",
    date: "2026-06-02",
    title: "Row selection on remaining tables",
    highlights: [
      "Permissions, roles matrix, planning gaps, planogram, and stock-count detail tables support row checkboxes",
      "Major tables now share the same index and select-all behavior",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Finished rolling out consistent row selection across remaining feature and detail tables",
      },
    ],
  },
  {
    version: "0.11.31",
    date: "2026-06-02",
    title: "Selection on ops and policy tables",
    highlights: [
      "Deliveries, transfers, and pull-outs tables include index and checkboxes",
      "Policy version history supports select-all",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Row selection extended to operations tables and policy version history",
      },
    ],
  },
  {
    version: "0.11.30",
    date: "2026-06-02",
    title: "Selection on more app tables",
    highlights: [
      "Policies, dashboard users, stock-count sessions, and SAP config tables support checkboxes",
      "Select-all works the same way across these lists",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Shared row selection pattern expanded to more modules for bulk actions later",
      },
    ],
  },
  {
    version: "0.11.29",
    date: "2026-06-02",
    title: "Selection on Settings and admin tables",
    highlights: [
      "Settings tables include index and checkbox columns with select-all",
      "Toolbars show how many rows are selected and let you clear the selection",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Branches, departments, warehouses, users, planning, and other admin tables support row selection",
      },
    ],
  },
  {
    version: "0.11.28",
    date: "2026-06-02",
    title: "Selection on operational tables",
    highlights: [
      "Orders, sales, logistics, and inventory tables include an index and checkboxes",
      "You can see how many rows are selected and clear the selection",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Operational tables use a consistent index-plus-checkbox selection pattern",
      },
    ],
  },
  {
    version: "0.11.27",
    date: "2026-06-02",
    title: "In-app confirms for order actions",
    highlights: [
      "Approve and Reject use an in-app confirmation instead of the browser’s built-in prompt",
      "Reject still requires a comment; buttons stay locked while saving",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Order approve and reject use a styled confirmation dialog inside the app",
      },
    ],
  },
  {
    version: "0.11.26",
    date: "2026-06-02",
    title: "Safer order approve and reject",
    highlights: [
      "Approve and Reject ask you to confirm before submitting",
      "Reject requires a comment; comment field has more room so it is not clipped",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Order review asks for confirmation, requires a reject comment, and gives the comment field more space",
      },
    ],
  },
  {
    version: "0.11.25",
    date: "2026-06-02",
    title: "Roomier order review layout",
    highlights: [
      "Order lines get more width for easier scanning",
      "Details and comments scroll on their own so the comment field is not cut off",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Order review gives lines more space and scrolls the details pane separately",
      },
    ],
  },
  {
    version: "0.11.24",
    date: "2026-06-02",
    title: "Scrollable order lines table",
    highlights: [
      "Order lines show as a table with index, SKU, and quantity",
      "Lines scroll inside the panel while the rest of the review stays fixed",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Order review shows lines in a scrollable table for large orders",
      },
    ],
  },
  {
    version: "0.11.23",
    date: "2026-06-02",
    title: "Order status badges and line summary",
    highlights: [
      "Order review shows status as a color-coded badge",
      "Lines preview lists the top entries with totals for lines and quantity",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Order review adds a status badge, indexed line preview, and totals summary",
      },
    ],
  },
  {
    version: "0.11.22",
    date: "2026-06-02",
    title: "Two-column order review",
    highlights: [
      "Order lines sit in a right-side panel while details stay on the left",
      "Only the lines panel scrolls; Approve and Reject stay at the bottom",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Order review uses a two-column layout with fixed actions at the footer",
      },
    ],
  },
  {
    version: "0.11.21",
    date: "2026-06-02",
    title: "Live SAP connection test feedback",
    highlights: [
      "SAP Test connection shows a live progress feed with elapsed time and current step",
      "You get context when a test may take longer (network, security handshake, or SAP sign-in)",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "SAP connection test shows step-by-step status and how long it has been running",
      },
    ],
  },
  {
    version: "0.11.20",
    date: "2026-06-02",
    title: "Loading screen for SAP testing",
    highlights: [
      "A shared loading screen covers in-progress actions",
      "SAP Test connection shows that screen while credentials are checked",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "SAP Test connection uses a full loading screen instead of only a button spinner",
      },
    ],
  },
  {
    version: "0.11.19",
    date: "2026-06-02",
    title: "Consistent page header divider",
    highlights: [
      "Pages share the same divider line under the title area",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Page headers use a consistent bottom divider across the app",
      },
    ],
  },
  {
    version: "0.11.18",
    date: "2026-06-02",
    title: "More side breathing room",
    highlights: [
      "Slightly wider left and right padding so full-width pages feel less cramped",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "App pages gain a bit more horizontal padding on all screen sizes",
      },
    ],
  },
  {
    version: "0.11.17",
    date: "2026-06-02",
    title: "Full-width app layout",
    highlights: [
      "Pages can use the full screen width on wide monitors",
      "SAP integration and the dashboard expand across large screens",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "App content is no longer capped at a narrow max width",
      },
    ],
  },
  {
    version: "0.11.16",
    date: "2026-06-02",
    title: "Edit and delete SAP DB configs",
    highlights: [
      "Each SAP company database row supports Edit and Delete",
      "The form switches between Add and Update with a clear cancel path",
    ],
    changes: [
      {
        type: "feature",
        description:
          "SAP Service Layer settings let you update or delete saved company database configs",
      },
    ],
  },
  {
    version: "0.11.15",
    date: "2026-06-02",
    title: "Instant SAP DB table updates",
    highlights: [
      "The SAP DB table updates as soon as you add a config or toggle active/inactive",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "SAP Service Layer form shows table changes right away after save or status toggle",
      },
    ],
  },
  {
    version: "0.11.14",
    date: "2026-06-02",
    title: "Clearer loading spinners",
    highlights: [
      "Shared spinner-and-label loading states across the app",
      "SAP Service Layer shows separate loading for test, save, and status update",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Consistent loading indicator used on SAP Service Layer actions",
      },
    ],
  },
  {
    version: "0.11.13",
    date: "2026-06-02",
    title: "SAP self-signed certificate fallback",
    highlights: [
      "Test connection can retry when an on-prem SAP server uses a self-signed certificate",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "SAP connection test automatically retries for common on-prem certificate setups",
      },
    ],
  },
  {
    version: "0.11.12",
    date: "2026-06-02",
    title: "Unified SAP setup and connection test",
    highlights: [
      "Service Layer form and SAP DB table sit in one section",
      "Test connection checks login against SAP; inactive configs show in red",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "SAP integration shows config and database list together with clearer inactive status",
      },
      {
        type: "feature",
        description:
          "SAP Service Layer Test connection verifies credentials against SAP",
      },
    ],
  },
  {
    version: "0.11.11",
    date: "2026-06-02",
    title: "Multiple SAP company databases",
    highlights: [
      "Service Layer settings support more than one SAP company database per organization",
      "A table lists saved entries with Active / Inactive actions",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Manage multiple SAP Service Layer company databases and turn them on or off",
      },
    ],
  },
  {
    version: "0.11.10",
    date: "2026-06-02",
    title: "Faster updates on more Settings pages",
    highlights: [
      "Departments, branches, and AORs update in the table as soon as you save",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Create, edit, and delete on departments, branches, and AORs show in the table right away",
      },
    ],
  },
  {
    version: "0.11.9",
    date: "2026-06-02",
    title: "Faster user table updates",
    highlights: [
      "Users table updates as soon as you create, edit, or delete someone",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Users Settings shows row changes immediately after save",
      },
    ],
  },
  {
    version: "0.11.8",
    date: "2026-06-02",
    title: "Fewer duplicate section tabs",
    highlights: [
      "Inventory, Logistics, and Reports no longer show extra pill tabs when the same links are already in the top nav",
      "Master data and SAP integration keep in-page tabs where they are still useful",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Section pages skip redundant tabs when navigation already covers those destinations",
      },
    ],
  },
  {
    version: "0.11.7",
    date: "2026-06-02",
    title: "Shared data tables and clearer menus",
    highlights: [
      "Tables across the app share a consistent card-style layout",
      "Top navigation links show a hand cursor on hover",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Shared table layout used on planning and other list pages",
      },
      {
        type: "improvement",
        description:
          "Header menus and links feel clickable with a pointer cursor",
      },
    ],
  },
  {
    version: "0.11.6",
    date: "2026-06-02",
    title: "Master data tables and clickable buttons",
    highlights: [
      "Brands and models tables use the same card-style layout, including SRP on models",
      "Buttons show a hand cursor on hover across the app",
      "Models list no longer breaks when price amounts are shown",
    ],
    changes: [
      {
        type: "fix",
        description:
          "Models list displays prices correctly without a display error",
      },
      {
        type: "improvement",
        description:
          "Master data brands and models tables use a clearer card layout",
      },
      {
        type: "improvement",
        description:
          "Buttons look and feel clickable with a pointer cursor",
      },
    ],
  },
  {
    version: "0.11.5",
    date: "2026-06-02",
    title: "Clearer tabs and secondary buttons",
    highlights: [
      "Active section tabs use a solid teal fill so the selection is obvious",
      "Outline and secondary buttons have clearer borders so they read as clickable",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Active tabs stand out; inactive tabs show a hover state",
      },
      {
        type: "improvement",
        description:
          "Secondary and outline buttons have stronger borders and hover states",
      },
    ],
  },
  {
    version: "0.11.4",
    date: "2026-06-02",
    title: "Section tabs across major areas",
    highlights: [
      "Pill-style tabs for SAP integration, Logistics, Reports, Master data, and Inventory",
      "Each tab can show a short intro for that section",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Shared section tabs and intro copy for major module areas",
      },
      {
        type: "improvement",
        description:
          "Logistics, reports, master data, and inventory use the same tab chrome",
      },
    ],
  },
  {
    version: "0.11.3",
    date: "2026-06-02",
    title: "Encrypted SAP credentials",
    highlights: [
      "Service Layer URL, company database, username, and password are stored encrypted",
      "Audit logs keep fingerprints only — credentials stay out of log details",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "All SAP Service Layer credential fields are encrypted at rest; older plain values re-encrypt when you save",
      },
    ],
  },
  {
    version: "0.11.2",
    date: "2026-06-02",
    title: "SAP Service Layer settings",
    highlights: [
      "Settings → SAP integration → Service Layer to configure URL, company database, and credentials",
      "Credentials are stored encrypted per organization",
    ],
    changes: [
      {
        type: "feature",
        description:
          "SAP Service Layer setup form with encrypted password storage",
      },
      {
        type: "improvement",
        description:
          "SAP integration splits into Integration queue and Service Layer tabs",
      },
    ],
  },
  {
    version: "0.11.1",
    date: "2026-06-02",
    title: "Smarter delivery due dates on approval",
    highlights: [
      "At final approve, delivery due dates that fall outside the branch schedule move to the next scheduled day",
      "Review warns before approve; the audit trail keeps requested vs final due date",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Final order approval can auto-reschedule delivery due dates to the branch’s next delivery day",
      },
      {
        type: "improvement",
        description:
          "Documentation updated for shipped Phase 2–3 items",
      },
    ],
  },
  {
    version: "0.11.0",
    date: "2026-06-02",
    title: "Physical stock count and SAP foundation",
    highlights: [
      "Physical inventory counts: sessions from branch stock, scan, variance review, and SAP adjustment handoff",
      "SAP outbound queue foundation with references on orders, deliveries, and pull-outs",
      "Stock count and SAP integration screens with a full audit trail",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Stock count sessions, lines, and variance workflow for physical inventory audits",
      },
      {
        type: "feature",
        description:
          "SAP integration queue and first outbound job hooks for approved orders and related docs",
      },
      {
        type: "feature",
        description:
          "Approving an order can queue a SAP job; a mock path can set document refs and create deliveries",
      },
      {
        type: "improvement",
        description:
          "SAP integration docs list what is live versus still planned",
      },
    ],
  },
  {
    version: "0.10.0",
    date: "2026-06-02",
    title: "Sales, logistics movement, returns, and warehouses",
    highlights: [
      "Sales serial picker (your branches), reserved sales, and sales CSV export",
      "Transfers and pull-outs move inventory through their lifecycle",
      "Branch return workflow with evaluate and approve steps",
      "Settings → Warehouses for warehouse and location setup",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Sales serial picker, reserved sale, and branch return (ATR) workflow",
      },
      {
        type: "feature",
        description:
          "Sales report CSV with transaction, serial, and return status",
      },
      {
        type: "feature",
        description:
          "Logistics transfer and pull-out serial movement, with optional per-serial delivery accept",
      },
      {
        type: "feature",
        description:
          "Warehouses Settings for creating and managing warehouses and locations",
      },
    ],
  },
  {
    version: "0.9.8",
    date: "2026-06-02",
    title: "Planning upload, reject delivery, and process-flow polish",
    highlights: [
      "Planning: Upload forecast CSV is visible on the planning panel",
      "Logistics: reject pending deliveries from deliveries and operations",
      "Orders: due-date warning at approve; auto-replenish links to suggested orders",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Upload forecast CSV button on Settings → Planning",
      },
      {
        type: "feature",
        description:
          "Reject delivery action on Logistics deliveries and Operations",
      },
      {
        type: "improvement",
        description:
          "SP approve warns when the delivery due date is outside the branch window; create order links to suggested orders",
      },
      {
        type: "improvement",
        description:
          "Process-flow and SAP scope documentation updated",
      },
    ],
  },
  {
    version: "0.9.7",
    date: "2026-06-01",
    title: "Processed orders report and sales order numbers",
    highlights: [
      "Processed Order Summary CSV with approved qty, remarks, CBM, and geography",
      "Sales order numbers use SO# yearly-month sequence; approval records processed time and approved qty",
      "Daily stock and transfer CSV reports; supply planning roles added",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Reports for processed orders, daily stock, and transfers as CSV downloads",
      },
      {
        type: "feature",
        description:
          "Orders get SO# numbers, approved quantities per line, SPA remarks, and delivery due date",
      },
      {
        type: "improvement",
        description:
          "New supply planning and SPA roles aligned with the order workflow",
      },
      {
        type: "improvement",
        description:
          "Docs updated for workflow traceability and SAP MVP scope",
      },
    ],
  },
  {
    version: "0.9.6",
    date: "2026-06-01",
    title: "Planning tables with filters and pages",
    highlights: [
      "Allocation gaps paginate and can filter by branch or search by name / SKU",
      "Draft suggested orders support branch filter, search, and pagination",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Planning allocation gaps support paging and branch/SKU filters",
      },
      {
        type: "improvement",
        description:
          "Suggested orders drafts and open gaps each have their own filters and pages",
      },
    ],
  },
  {
    version: "0.9.5",
    date: "2026-06-01",
    title: "Full planning pipeline",
    highlights: [
      "Settings → Planning: branch revenue targets, run allocation, and generate auto-replenish drafts",
      "Planogram import with Series/SRP columns and stock breakdown links",
      "Inventory planogram badges and off-planogram filter",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Forecast targets and allocation gaps based on planogram max versus on-hand stock",
      },
      {
        type: "feature",
        description:
          "Suggested orders can create auto-replenish drafts ready for TL → SP approval",
      },
      {
        type: "fix",
        description:
          "Planning page displays amounts and dates without a display error",
      },
    ],
  },
  {
    version: "0.9.4",
    date: "2026-06-01",
    title: "Planogram demo data and clearer order dialogs",
    highlights: [
      "Demo seed aligns brands, SKUs, and shelf targets with the BRS planogram sample",
      "Order review and create dialogs show workflow hints and remaining shelf capacity",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Demo data includes planogram targets, more SKUs, and an extra sample branch",
      },
      {
        type: "improvement",
        description:
          "Order review shows type, branch, lines, status, and next approver",
      },
      {
        type: "improvement",
        description:
          "Create order shows remaining shelf capacity; auto-replenish marked coming soon",
      },
    ],
  },
  {
    version: "0.9.3",
    date: "2026-06-01",
    title: "Clearer audit log and list badges",
    highlights: [
      "Audit entries show branch names, document numbers, and line summaries",
      "Colored badges for orders, deliveries, transfers, pull-outs, and sales",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Audit log formats order, logistics, and sales events in plain language",
      },
      {
        type: "improvement",
        description:
          "Audit details include branch names and document numbers when available",
      },
      {
        type: "fix",
        description:
          "Inventory status update label displays correctly in the audit log",
      },
      {
        type: "improvement",
        description:
          "Orders and logistics lists share search toolbars and colored status badges",
      },
      {
        type: "fix",
        description:
          "Navigation loading bar no longer covers header dropdown menus",
      },
    ],
  },
  {
    version: "0.9.2",
    date: "2026-06-01",
    title: "Faster navigation between pages",
    highlights: [
      "Quicker switching between Dashboard, Policies, Audit logs, and Settings",
      "A loading skeleton appears while pages fetch data",
      "Fewer repeated sign-in checks on every navigation",
    ],
    changes: [
      {
        type: "fix",
        description:
          "Permissions are not reloaded from the database on every page change",
      },
      {
        type: "improvement",
        description:
          "Session checks are shared within a request so navigation feels snappier",
      },
      {
        type: "improvement",
        description:
          "Header branding and profile data are reused across page loads",
      },
      {
        type: "improvement",
        description:
          "App-wide loading skeleton for smoother tab transitions",
      },
      {
        type: "improvement",
        description:
          "Orders and logistics lists use a unified search toolbar with colored badges",
      },
    ],
  },
  {
    version: "0.9.1",
    date: "2026-06-01",
    title: "Logistics UX polish",
    highlights: [
      "Status badges use plain labels instead of redundant technical codes",
      "Color-coded Accept vs approve buttons; confirm before key logistics actions",
    ],
    changes: [
      {
        type: "improvement",
        description:
          "Logistics and ops status badges show human-readable labels",
      },
      {
        type: "improvement",
        description:
          "Accept and approve actions use distinct colors so intent is clearer",
      },
      {
        type: "improvement",
        description:
          "Confirm before accepting a delivery or approving a transfer",
      },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-06-01",
    title: "Planogram, MIL, and SKU status",
    highlights: [
      "Branch planogram with shelf capacity and MIL day thresholds",
      "SKU status (active / hold / retired) with audit trail",
      "Orders limited to planogram SKUs, with special-order exception",
      "Dashboard alerts for below-capacity and MIL aging",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Settings → Planogram for authorized SKUs, max qty, and MIL days per branch",
      },
      {
        type: "feature",
        description:
          "Master data models let you set SKU status with audit logging",
      },
      {
        type: "feature",
        description:
          "Orders filter models by branch planogram and validate max qty; special orders allow off-planogram SKUs",
      },
      {
        type: "feature",
        description:
          "Dashboard shows below-capacity and MIL threshold counts for your branches",
      },
      {
        type: "improvement",
        description:
          "Demo seed expanded with multi-model planogram and MIL scenarios",
      },
    ],
  },
  {
    version: "0.8.0",
    date: "2026-06-01",
    title: "Inventory ops MVP",
    highlights: [
      "Branches, warehouses, master data, and users scoped to their areas of responsibility",
      "Serialized inventory and branch orders with multi-step approval",
      "Logistics MVP: delivery acceptance, transfers, and pull-outs",
      "Sales stub and dashboard KPIs for pending work",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Settings for Branches, Master data, and AORs with starter roles",
      },
      {
        type: "feature",
        description:
          "Inventory list filtered to your branches with audited status changes",
      },
      {
        type: "feature",
        description:
          "Orders create and approval workflow with optional email notifications",
      },
      {
        type: "feature",
        description:
          "Logistics and sales transaction screens for day-to-day ops",
      },
      {
        type: "feature",
        description:
          "Dashboard KPIs for pending approvals, in-transit, stock, and open returns",
      },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-06-01",
    title: "Full policy document control",
    highlights: [
      "Read-only policy access for employees and auditors",
      "Version history and new revisions on approved policies",
      "Reviewer workflow with comments, email notifications, attachments, and PDF export",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Browse approved policies without edit rights when you have view access",
      },
      {
        type: "feature",
        description:
          "Approved policies get a new draft revision instead of editing in place",
      },
      {
        type: "feature",
        description:
          "Review timeline with optional comments on submit, approve, and revert",
      },
      {
        type: "feature",
        description:
          "Email notifications to reviewers and authors when configured",
      },
      {
        type: "feature",
        description:
          "Attachments (PDF, Word, images) per policy version",
      },
      {
        type: "feature",
        description:
          "Export PDF for policies that are in review or approved",
      },
    ],
  },
  {
    version: "0.1.4",
    date: "2026-06-01",
    title: "Departments, audit log, and policies",
    highlights: [
      "Departments under Settings with defaults on registration",
      "Paginated audit log for compliance review",
      "Policy drafts with submit-for-review and approve",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Settings → Departments — create, edit, and delete with a guard when users are assigned",
      },
      {
        type: "feature",
        description:
          "Settings → Audit log — filter by action and type with pagination",
      },
      {
        type: "feature",
        description:
          "Company branding changes (name, tagline, logo) write audit events",
      },
      {
        type: "feature",
        description:
          "Policies — list, create, edit drafts, submit for review, and approve",
      },
    ],
  },
  {
    version: "0.1.3",
    date: "2026-06-01",
    title: "Branding and What’s new polish",
    highlights: [
      "Upload a company logo in Company Settings (shown in your sidebar)",
      "What’s new in the page header with clearer release notes",
      "Add actions sit beside table search on Users, Roles, and Permissions",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Company logo upload (JPEG, PNG, or WebP) for your organization only",
      },
      {
        type: "feature",
        description:
          "Company branding managed by Tenant Admin; Super Admin can always edit",
      },
      {
        type: "improvement",
        description:
          "What’s new button on every app page header",
      },
      {
        type: "improvement",
        description:
          "Release notes with sticky pagination and color-coded Feature / Improvement / Fix badges",
      },
      {
        type: "improvement",
        description:
          "Add user, role, and permission actions aligned with table search",
      },
    ],
  },
  {
    version: "0.1.2",
    date: "2026-06-01",
    title: "Settings and permissions",
    highlights: [
      "Edit and delete users and roles with search on settings tables",
      "Global permissions catalog for platform operators",
      "Sidebar shows only modules you are allowed to open",
    ],
    changes: [
      {
        type: "feature",
        description:
          "Edit user — name, email, role, and department",
      },
      {
        type: "feature",
        description:
          "Edit and delete roles with user counts; system roles stay protected",
      },
      {
        type: "feature",
        description:
          "Permissions catalog for Super Admin to create and manage permission names",
      },
      {
        type: "feature",
        description:
          "App modules linked to permissions so the sidebar respects access",
      },
      {
        type: "improvement",
        description: "Search on Users and Roles tables",
      },
      {
        type: "improvement",
        description:
          "Sticky roles and permissions matrix with row actions",
      },
      {
        type: "improvement",
        description:
          "Shared delete confirmation for settings tables",
      },
      {
        type: "improvement",
        description:
          "User menu with profile settings and sign out",
      },
      {
        type: "improvement",
        description: "Profile photo upload and removal",
      },
      {
        type: "improvement",
        description: "What’s new link on the login screen",
      },
      {
        type: "fix",
        description:
          "Platform-operator roles hidden from tenant role pickers and protected from deletion",
      },
    ],
  },
  {
    version: "0.1.1",
    date: "2026-06-01",
    title: "What’s new dialog",
    highlights: ["What’s new shows paginated release notes"],
    changes: [
      {
        type: "feature",
        description: "What’s new dialog on login and the auth sidebar",
      },
      {
        type: "improvement",
        description: "Release notes paginate one version at a time",
      },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-06-01",
    title: "Initial release",
    highlights: [
      "Sign-in with roles scoped to each organization",
      "User and role management for dealer organizations",
      "Dashboard shell and Settings foundation",
    ],
    changes: [
      {
        type: "feature",
        description: "Email and password sign-in",
      },
      {
        type: "feature",
        description: "Organization-scoped roles and permissions",
      },
      {
        type: "feature",
        description: "Settings for users, roles, and profile",
      },
    ],
  },
];
