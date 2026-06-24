# AGENTS.md — AI Agent Guide for Frontend Inventory System

## Project Overview

A **role-based inventory management system** built with Next.js 16 App Router and React 19. Users manage products, create invoices (import, selling, stock adjustment, returns), view admin analytics, and handle cashier workflows.

**User roles:**
- `1` = Admin → dashboard, user management
- `2` = Manager → product inventory, all invoice types
- `3` = Cashier → selling invoices only

**API:** REST backend at `NEXT_PUBLIC_API_URL/api/v2` (default `http://localhost:4000/api/v2`)

---

## Tech Stack

| Concern | Tool |
|---------|------|
| Framework | Next.js 16, React 19, TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (CSS `@import "tailwindcss"` in `globals.css`) |
| State | Zustand (`auth.store.ts` only) + `useState` for local UI |
| HTTP | Axios singleton (`src/services/api-client.ts`) |
| Forms | React Hook Form + Zod |
| Theming | `next-themes` + CSS custom properties |
| Toasts | Sonner |
| Icons | `lucide-react` |
| Charts | Recharts |
| PDF | `@react-pdf/renderer` |
| i18n | JSON dictionaries (`en.json`, `vi.json`, `hu.json`) + `DictProvider` |
| Testing | Vitest (unit tests only, no component tests) |

---

## Directory Structure

```
src/
├── app/                  # Next.js App Router — thin page shells only
│   ├── layout.tsx        # Root layout: ThemeProvider → DictProvider → AuthProvider → AppShell
│   ├── page.tsx          # Root redirect by role (Server Component)
│   ├── globals.css       # Tailwind v4 tokens and CSS variables
│   ├── login/
│   ├── admin/            # dashboard, users
│   ├── cashier/          # selling invoices
│   └── manager/          # product inventory + invoice workflows
├── components/           # Shared domain-agnostic UI
│   ├── forms/            # login-form.tsx
│   ├── layout/           # AppShell, Sidebar, AuthProvider, popups
│   ├── types/            # Shared UI types (Accent, filters, modal stack)
│   └── ui/               # DataTable, Fields, Buttons, KpiTile, ToolTips
├── features/             # Domain modules — PRIMARY location for new work
│   ├── admin/            # Dashboard analytics, user management
│   ├── invoices/         # Import, selling, stock adjustment, return invoices
│   └── products/         # Product catalog, units, history
├── lib/                  # Cross-cutting, domain-free utilities
│   ├── api/errors/       # API error parsing + i18n messages
│   ├── auth/             # Role helpers, cookie utils, route access
│   ├── datetime/         # Date range helpers
│   ├── hooks/            # usePaginatedListQuery, useAuthWatcher
│   ├── lang/             # i18n, DictProvider, useDict
│   ├── numeric/          # Money/integer input normalization
│   ├── preferences/      # App settings UI
│   ├── shortcuts/        # Keyboard shortcut registry
│   ├── sku/              # SKU validation helpers
│   └── table/            # Shared table filter/pagination helpers
├── services/             # Global HTTP entry points
│   ├── api-client.ts     # Axios instance + JWT interceptors + token refresh
│   └── auth.service.ts   # login/logout
├── stores/
│   └── auth.store.ts     # Zustand auth store
├── dictionaries/         # en.json, vi.json, hu.json
└── middleware.ts         # Edge auth + role-based route gating
```

---

## Architecture Patterns

### Feature-sliced layout

All new domain work belongs in `src/features/<domain>/`. Each feature typically contains:

```
features/<domain>/
├── components/   # Small reusable feature UI (pills, shells)
├── layout/       # Larger composite panels, popups
├── hooks/        # Data fetching and editor state
├── services/     # Async API call functions
├── types/        # DTOs, editable types, mappers
├── table/        # DataTable column definitions
├── filters/      # Filter option constants
├── form/         # RHF form components (products)
└── lib/          # Pure helpers with unit tests
```

### Data flow

```
Page → feature hook → feature service → apiClient (Axios) → REST API
```

Pages are thin shells that compose hooks and components. No business logic in pages.

### State management

- **Zustand**: `useAuthStore` only — user object, token, login/logout, hydration
- **React state**: page-local UI state (open/close, selected IDs, form fields)
- **Custom hooks**: all data fetching via `useEffect` + manual `refetch` via refresh keys
- No React Query / SWR / Redux

---

## Naming Conventions

| Artifact | Convention | Example |
|----------|------------|---------|
| Components | PascalCase | `ProductDetailsCard`, `AddUnitPopup` |
| Hooks | `use` prefix | `useSellingInvoices`, `useProductTable` |
| Services | `*.service.ts`, named functions | `getProductById` |
| Column builders | `*Columns` | `productColumns(...)` |
| Popups | `*Popup` suffix | `CreateUserPopup` |
| Status pills | `*StatusPill` | `SellingInvoiceStatusPill` |
| Types/DTOs | PascalCase | `Product`, `EditableImportInvoiceProduct` |

---

## TypeScript Conventions

- Types are **colocated** with their domain — no global `types/` folder
- Use `interface` for entity shapes, `type` for unions and mapped types
- DTOs and query param types live **in the service file** that uses them
- Mapper functions (DTO → UI type) live **alongside types**
- Dictionary typing: `Dictionary = typeof en` ensures i18n key safety

### Path aliases (`@/` maps to `src/`)

```typescript
import { useDict } from "@lib/lang/i18n";
import { ProductDetailsCard } from "@features/products/layout/ProductDetailsCard";
import { apiClient } from "@services/api-client";
```

---

## Component Patterns

- Nearly all interactive components use `"use client"` at the top
- Root `layout.tsx` and root `page.tsx` are Server Components (read cookies)
- Use `clsx` for conditional class names
- Use `useDict()` for all user-facing strings (never hardcode English)
- Use `useMemo` for column definitions that depend on `dict` or pagination
- Use `sonner` (`toast.success`, `toast.error`) for user feedback

### Inline prop types

```typescript
// Preferred for simple components
export default function MyPopup({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) { ... }
```

---

## API & Services

### Axios client

`src/services/api-client.ts`:
- Attaches `Authorization: Bearer <token>` from `localStorage`
- On 401: queues requests, refreshes via `POST /auth/refresh-token`, retries
- 15-second timeout

### Service functions

Plain async functions — **not classes**:

```typescript
export async function getProductById(id: number): Promise<Product> {
  const res = await apiClient.get<Product>(`/products/${id}`);
  return res.data;
}
```

### Error handling

```typescript
import { resolveApiErrorMessage } from "@lib/api/errors/resolveApiError";

try {
  await someService();
} catch (err) {
  const message = resolveApiErrorMessage(err, dict);
  toast.error(message);
}
```

---

## i18n

All user-facing strings must use `useDict()`:

```typescript
const dict = useDict();
// dict.product.name, dict.common.save, dict.apiErrors.notFound
```

Add new strings to all three dictionaries: `en.json`, `vi.json`, `hu.json`.

---

## Route Protection

- **`middleware.ts`** — Edge middleware checks `access_token` + `user_roles` cookies; redirects unauthenticated → `/login`; blocks wrong-role routes
- **`useAuthWatcher`** — client-side watcher for token expiry
- **`defaultHomePathForRoles`** — maps role → home path

---

## Route Map

| Route | Role |
|-------|------|
| `/admin/dashboard` | Admin |
| `/admin/users` | Admin |
| `/cashier/selling` | Cashier |
| `/cashier/selling/[id]` | Cashier |
| `/manager/product-inventory` | Manager |
| `/manager/product-inventory/[id]` | Manager |
| `/manager/invoices/import` | Manager |
| `/manager/invoices/import/[id]` | Manager |
| `/manager/invoices/stock-adjustment` | Manager |
| `/manager/invoices/stock-adjustment/[id]` | Manager |
| `/manager/invoices/selling` | Manager |
| `/manager/invoices/selling/[id]` | Manager |
| `/manager/invoices/return-invoice/[id]` | Manager |
| `/manager/invoices/return-selling/[id]` | Manager |

---

## Testing

Tests use **Vitest** with a Node environment. Only pure utility functions are tested:

```
src/lib/**/*.test.ts
src/features/**/lib/**/*.test.ts
```

Run tests with:
```bash
npx vitest
```

No component or integration tests currently exist.

---

## Key Rules for Agents

1. **All new domain work goes in `src/features/<domain>/`** — follow the existing subfolder structure.
2. **Pages are thin shells** — no business logic, only composition of hooks and components.
3. **Never hardcode UI strings** — always use `useDict()` and add keys to all three JSON dictionaries.
4. **Services are plain async functions** — not classes, return `res.data` directly.
5. **Use `clsx`** for conditional class merging, not string concatenation.
6. **Use `sonner` toasts** for all success/error feedback.
7. **Colocate types** with their domain service or feature — no global types barrel.
8. **All interactive components need `"use client"`** — only root layout/page are Server Components.
9. **Use existing `DataTable`** from `src/components/ui/` for all tabular data.
10. **Keyboard shortcuts** belong in `src/lib/shortcuts/` — do not add raw `keydown` listeners.
