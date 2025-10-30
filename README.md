# Inventory System – Frontend (Next.js 14 + TS + Tailwind)

A scalable UI skeleton for the POS/Inventory app. It includes an app shell (Topbar + Sidebar), initial routes, domain types, and form schemas. The sidebar matches the three screenshots (Admin, Cashier, Manager) and is responsive + collapsible.

## Tech stack
- Next.js 14 (App Router) with TypeScript
- Tailwind CSS (class-based dark mode)
- Zod (schemas/validation), date-fns, lucide-react (icons)

## Features
- Responsive app shell with collapsible sidebar
	- Three role sections: Admin, Cashier, Manager; all visible for now (no auth)
	- Active item pill highlight, nested connector lines, localStorage to remember open state
- Pages scaffolded
	- Dashboard (/dashboard)
	- Invoices list (/invoices), New (/invoices/new), Detail (/invoices/[id]), Edit (/invoices/[id]/edit)
- Domain models and Zod schemas located under `lib/`

## Project structure (important paths)
```
app/
	layout.tsx                # App shell wrapper
	dashboard/page.tsx        # Dashboard placeholder
	invoices/…                # Invoices list/new/detail/edit
components/layout/
	AppShell.tsx              # Shell composition
	Sidebar.tsx               # 3-role, collapsible sidebar
	Topbar.tsx                # Title/search/actions bar
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

## License
Private/internal use for now.
