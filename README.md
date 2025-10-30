# Inventory System – Frontend (Next.js 14 + TS + Tailwind)

A scalable UI skeleton for the POS/Inventory app. It includes an app shell (Sidebar), initial routes, domain types, form schemas, KPI cards, and an interactive charts module. The sidebar matches the three screenshots (Admin, Cashier, Manager) and is responsive + collapsible.

## Tech stack
- Next.js 14 (App Router) with TypeScript
- Tailwind CSS (class-based dark mode)
- Zod (schemas/validation), date-fns, lucide-react (icons)

## Features
- App shell with collapsible sidebar
	- Three role sections: Admin, Cashier, Manager; all visible for now (no auth)
	- Active item pill highlight, nested connector lines, localStorage to remember open state
- Pages scaffolded
	- Dashboard (/dashboard)
	- Invoices list (/invoices), New (/invoices/new), Detail (/invoices/[id]), Edit (/invoices/[id]/edit)
- Dashboard UI
	- KPI Cards: icon + title, big value, tiny colored delta pill; info tooltip on hover
	- Date + Period controls (segmented, “dính nhau”)
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
- Domain models and Zod schemas located under `lib/`

## Project structure (important paths)
```
app/
	layout.tsx                # App shell wrapper
	dashboard/page.tsx        # Dashboard placeholder
	invoices/…                # Invoices list/new/detail/edit
components/layout/
	AppShell.tsx              # Shell composition
	PageHeader.tsx            # Reusable page-level title + actions
	Sidebar.tsx               # 3-role, collapsible sidebar
	Topbar.tsx                # Title/search/actions bar
components/ui/
	DateRangeButton.tsx       # Button for date range (Calendar + label)
	PeriodSelect.tsx          # Button for period selection (value + chevron)
	Tooltip.tsx               # Portal-based tooltip (no clipping)
components/charts/
	AreaLineChart.tsx         # Interactive responsive chart (hover guideline, dot, value bubble)
components/dashboard/
	DatePeriodControls.tsx    # Segmented controls; supports value/onChange
app/dashboard/components/
	ChartCard.tsx             # Header + metric dropdown + DatePeriodControls + AreaLineChart
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
- Width: `clamp(240px, 16vw, 320px)`; collapses to 72px (icons only)
- Collapsed mode hides all submenu items and labels; no horizontal scrollbars
- Expanded mode shows labels and nested connector lines
- Admin expanded by default; other sections remember their last state

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
- Added interactive Date/Period controls with controlled API and no overflow
- KPI Cards redesigned with icon, info tooltip, and colored delta badges
- Implemented interactive AreaLineChart and ChartCard with metric dropdown
- Period-aware labels including Weekly week-range formatting and edge-safe anchoring

### Notes
- Page headers should use `components/layout/PageHeader` with right-side `actions` for consistency across screens.

## License
Private/internal use for now.
