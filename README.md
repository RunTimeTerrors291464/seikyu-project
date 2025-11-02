# Inventory System – Frontend (Next.js 14 + TS + Tailwind)

A scalable UI skeleton for the POS/Inventory app. It includes an app shell (Sidebar), initial routes, domain types, form schemas, KPI cards, interactive charts, and reusable data tables. The Sidebar groups (Admin/Cashier/Manager) match the provided designs.

## Tech stack
- Next.js 14 (App Router) with TypeScript
- Tailwind CSS (class-based dark mode)
- Zod (schemas/validation), date-fns, lucide-react (icons)

## Features
- App shell with fixed-height Sidebar
	- Three role sections: Admin, Cashier, Manager; all visible for now (no auth)
	- Fixed sidebar height (sticky, h-screen). Only the middle nav scrolls; the user card is pinned at the bottom.
	- Active item highlight and nested connector lines
- Pages scaffolded
	- Dashboard (/dashboard) with KPI cards, Charts, Best Selling Items, and System Event Log cards
	- Invoices list (/invoices), New (/invoices/new), Detail (/invoices/[id]), Edit (/invoices/[id]/edit)
- Dashboard UI
	- KPI Cards: icon + title, big value, tiny colored delta pill; info tooltip on hover
	- Date + Period controls (segmented, “dính nhau”), with adjacent icon buttons (open detail, info)
		- Date popover (From/To) + Period dropdown (Daily/Weekly/Monthly/Quarterly/Yearly)
		- No horizontal scroll; right-aligned popover; click-outside to close
		- Controlled or uncontrolled usage (value + onChange supported)
	- Charts
		- ChartCard with metric dropdown (Revenue, Product Imported, Product Sold, Invoice), info tooltip next to the controls
		- Interactive AreaLineChart: responsive SVG, gradient area, hover guideline + dot, floating value bubble, dashed continuation
		- Period-aware x-axis labels: 
			- Daily: EEE + day
			- Weekly: week day range (e.g., “Sep 29 - Oct 5”) + year at change; edge labels anchored to avoid clipping
			- Monthly: MMM + year at change
			- Quarterly: Qn + year at change
			- Yearly: yyyy
- Reusable DataTable
	- Left-aligned column headers with optional header icons
	- Rounded outer border; row hover state; optional index column
	- Used by Best Selling Items and System Event Log
- Best Selling Items card
	- Filter button + Date/Period controls + two compact icon buttons (open detail, info)
	- Header icons are bold; Unit sold column shows a right-aligned delta pill within the cell while the number aligns to the left label
- System Event Log card
	- Columns: UUID, Time Stamp, Source, Level, Message
	- Severity badge (INFO/WARNING/ERROR/DEBUG)
	- Header icons are bold; Source column uses a distinct icon from the tooltip
- Domain models and Zod schemas located under `lib/`

## Project structure (important paths)
```
app/
	layout.tsx                # App shell wrapper
	dashboard/page.tsx        # Dashboard page with cards (KPI, Chart, Best Selling, System Log)
	invoices/…                # Invoices list/new/detail/edit
components/layout/
	AppShell.tsx              # Shell composition
	PageHeader.tsx            # Reusable page-level title + actions
	Sidebar.tsx               # 3-role sidebar (fixed height, scrollable nav, pinned user)
components/ui/
	Tooltip.tsx               # Portal-based tooltip (no clipping)
	IconCircleButton.tsx      # Small circular icon-only button
	DataTable.tsx             # Reusable table with header icons + border
	SeverityBadge.tsx         # Level/status pill (INFO/WARNING/ERROR/DEBUG)
components/charts/
	AreaLineChart.tsx         # Interactive responsive chart (hover guideline, dot, value bubble)
components/dashboard/
	DatePeriodControls.tsx    # Segmented controls; supports value/onChange
app/dashboard/components/
	ChartCard.tsx             # Header + metric dropdown + DatePeriodControls + AreaLineChart + header icon buttons
	BestSellingItemsCard.tsx  # Table showing best-selling items
	SystemEventLogCard.tsx    # Table listing system events
lib/hooks/useMeasure.ts     # ResizeObserver-based hook for responsive SVG
lib/hooks/useOnClickOutside.ts # Click-outside utility used by menus/popovers
lib/types/domain.ts         # Product/Invoice/etc. types
lib/schemas/invoice.ts      # Zod schemas for Invoice/LineItem
styles/globals.css          # Tailwind + base CSS
tailwind.config.ts          # Tailwind config (class dark mode)
```

## Development
1) Install
```bash
npm install
```
2) Dev server
```bash
npm run dev
```
Open http://localhost:3000

3) Production build
```bash
npm run build
npm run start
```

## Usage notes
- DatePeriodControls
	- Uncontrolled: render without props; internal state manages date/period.
	- Controlled: pass `value={{ startDate, endDate, period }}` and `onChange` to reflect external state.
- AreaLineChart
	- Accepts `period` to format x-axis labels appropriately.
- ChartCard
	- Metric dropdown is interactive and closes on outside click. Tie it to data by swapping series generation.

## Sidebar behavior
- Width: `clamp(240px, 16vw, 320px)`; always expanded (no collapse toggle)
- Fixed height (sticky). Only the nav area scrolls; user card is pinned at the bottom.
- Admin group opens by default; groups auto-open when a child route is active and persist per group.

## Styling
- Main content background (light): `#f4f5fc`; dark mode uses a neutral-950 fallback.

## Conventions
- Server Components for layout/page; Client Components for interactive elements
- Tailwind classes for spacing/typography; keep components small and typed
- Prefer utility helpers in `lib/utils/*` (to be added as the app grows)

## Roadmap
- Replace placeholders with real tables/forms/charts
- Hook API services + React Query
- Add shadcn/ui primitives (Dialog, Dropdown, Tooltip, etc.)
- Implement auth + role-based sidebar visibility

### Recent highlights
- Fixed sidebar per spec (fixed height, scrollable nav, pinned user, no toggle)
- Added interactive Date/Period controls with controlled API and no overflow; added adjacent icon buttons
- KPI Cards redesigned with icon, info tooltip, and colored delta badges
- Implemented interactive AreaLineChart and ChartCard with metric dropdown
- Period-aware labels including Weekly week-range formatting and edge-safe anchoring
- New reusable DataTable + BestSellingItemsCard + SystemEventLogCard with bold header icons and severity badges
- Dashboard layout: Charts and Best Selling Items have equal widths

### Notes
- Page headers should use `components/layout/PageHeader` with right-side `actions` for consistency across screens.

## License
Private/internal use for now.
