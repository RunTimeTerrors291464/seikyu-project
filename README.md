# Inventory System — Frontend

Next.js application for an inventory and invoicing dashboard. It talks to a REST API (Axios), keeps auth in Zustand with cookie-backed route protection, and organizes domain code under `src/features` (products, invoices, admin).

## Tech stack

| Area              | Libraries                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| Framework         | [Next.js](https://nextjs.org/) 16 (App Router), React 19                                          |
| Styling           | [Tailwind CSS](https://tailwindcss.com/) 4                                                        |
| HTTP              | [Axios](https://axios-http.com/) with interceptors (auth header, token refresh)                   |
| State             | [Zustand](https://zustand-demo.pmnd.rs/) (auth)                                                   |
| Server/async data | [TanStack Query](https://tanstack.com/query)                                                      |
| Tables            | [TanStack Table](https://tanstack.com/table)                                                      |
| Forms             | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) (`@hookform/resolvers`) |
| Theming           | [next-themes](https://github.com/pacocoursey/next-themes)                                         |
| Toasts            | [Sonner](https://sonner.emilkowal.ski/)                                                           |
| PDF               | [@react-pdf/renderer](https://react-pdf.org/)                                                     |
| Icons             | [Lucide React](https://lucide.dev/)                                                               |

## Prerequisites

- **Node.js** — use an LTS version compatible with Next.js 16 (see Next.js docs for the exact range).
- **Backend API** — the app expects a v2 REST API. By default the client targets `http://localhost:4000/api/v2` (see [Environment variables](#environment-variables)).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server uses Next’s hot reload.

### Scripts

| Command         | Purpose                               |
| --------------- | ------------------------------------- |
| `npm run dev`   | Development server                    |
| `npm run build` | Production build                      |
| `npm run start` | Run production server (after `build`) |
| `npm run lint`  | ESLint (Next.js config)               |

## Environment variables

Create a `.env.local` in the project root (Next.js loads it automatically). At minimum you will usually set:

| Variable                  | Description                                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`     | Base URL of the API **without** the `/api/v2` suffix. Example: `http://localhost:4000`. If unset, the client falls back to `http://localhost:4000`. |
| `NEXT_PUBLIC_API_VERSION` | Optional API version segment (e.g. `2` or `v2`). Defaults to `v2`.                                                                                  |

The Axios instance in `src/services/api-client.ts` appends `/api/v2` to this base URL by default.

> Do not commit secrets or production URLs in tracked env files; keep `.env.local` out of version control.

## Application routes and roles

Users receive numeric role codes from the API: **1 = Admin**, **2 = Manager**, **3 = Cashier** (`src/features/admin/services/adminUsers.service.ts`). After login, `defaultHomePathForRoles` in `src/lib/auth/authUser.ts` sends users to:

- Admin → `/admin/dashboard`
- Manager → `/manager/product-inventory`
- Cashier → `/cashier/selling`

**Admins** effectively see all sidebar sections (`effectiveRolesForSidebarNav` expands admin to manager + cashier nav).

### Main areas

- **Admin** — `/admin/dashboard`, `/admin/users` (user management).
- **Cashier** — `/cashier/selling` (selling invoices; detail routes under `/cashier/selling/[id]`).
- **Manager** — product inventory (`/manager/product-inventory`, detail `[id]`), import invoices, stock adjustment invoices, selling invoices (list + detail), return flows (`return-invoice`, `return-selling`, etc.).

The root page (`src/app/page.tsx`) redirects: authenticated users → `/admin/dashboard`, otherwise → `/login`.

### URL redirects

`next.config.ts` redirects legacy paths:

- `/invoices` → `/cashier/selling`
- `/invoices/:id` → `/cashier/selling/:id`

## Authentication and session

1. **Login** — `src/components/forms/login-form.tsx` calls `src/services/auth.service.ts`, which uses the shared Axios client.
2. **Storage** — On success, `src/stores/auth.store.ts` saves:
   - `access_token` (and related data) in **localStorage** for API calls.
   - `access_token` in an **HTTP cookie** (`path=/`, `SameSite=Lax`, `Secure` when on HTTPS) so **Next.js middleware** can gate routes.
3. **Hydration** — `AuthProvider` runs `loadUserFromStorage` on mount so a full page refresh does not drop client auth state when the cookie still exists.
4. **Middleware** — `src/middleware.ts` redirects unauthenticated users to `/login` (matcher skips `_next`, `api`, `favicon.ico`). Auth pages `/login` and `/register` stay reachable without a token.
5. **Client guard** — `useAuthWatcher` syncs token absence with `/login` and bounces logged-in users off auth pages to the role-appropriate home.
6. **Refresh** — `api-client.ts` implements a refresh-token queue on 401 responses (see that file for the full flow and dev-only logging).

Logout clears localStorage, expires the cookie, and navigates to `/login`.

## Internationalization (i18n)

- Dictionaries: `src/dictionaries/en.json`, `src/dictionaries/vi.json`, `src/dictionaries/hu.json`.
- Language is resolved from the `lang` cookie (default `en`) in the root layout; `DictProvider` supplies strings to client components via `useDict()`.
- Login exposes `LanguageToggle`; app settings may also control preferences (see `src/lib/preferences/`).

Supported languages: **en**, **vi**, **hu** (`src/lib/lang/i18n.ts`).

## UI shell and theming

- **App shell** — `LayoutWrapper` skips the shell on `/login`, `/register`, and `/forgot-password`. Other routes render inside `AppShell` (sidebar + main content). Sidebar open state can persist under `app-shell:sidebar-open` in localStorage.
- **Theme** — `ThemeProvider` (next-themes) wraps the app; `ThemeToggle` is available on the login page and in settings.

## Project structure

High-level layout (not every file):

```text
src/
├── app/                      # App Router: pages and route segments only
│   ├── layout.tsx            # Theme, i18n, AuthProvider, LayoutWrapper
│   ├── page.tsx              # Root redirect
│   ├── login/
│   ├── admin/
│   ├── cashier/
│   ├── manager/
│   └── user/
├── components/               # Shared UI and layout
│   ├── forms/
│   ├── layout/               # AppShell, Sidebar, popups, etc.
│   └── ui/                   # Buttons, fields, KPI tiles, etc.
├── features/                 # Domain modules (preferred place for new work)
│   ├── admin/                # Users, roles, admin hooks and tables
│   ├── invoices/             # Import / selling / stock adjustment / returns, PDF, hooks, services
│   └── products/             # Catalog, units, history, product services
├── lib/                      # Cross-cutting utilities
│   ├── auth/                 # normalizeAuthUser, role helpers, default home path
│   ├── hooks/                # useAuthWatcher, draft guards, etc.
│   ├── lang/                 # getDictionary, DictProvider
│   ├── preferences/
│   └── table/                # Shared table helpers
├── services/                 # api-client.ts, auth.service.ts (HTTP entry points)
├── stores/                   # Zustand (auth.store.ts)
├── dictionaries/             # en.json, vi.json
├── types/                    # Shared TS types where not colocated in features
└── middleware.ts             # Edge middleware (cookie check)
```

**Conventions**

- Prefer adding **feature-scoped** code under `src/features/<feature>/` (`components`, `hooks`, `services`, `types`, `table`, etc.).
- Shared primitives stay in `src/components` and `src/lib`.
- Path aliases are defined in `tsconfig.json` (`@/*`, `@features/*`, `@lib/*`, etc.).

## Data fetching and forms

- Feature hooks often wrap **TanStack Query** for caching and loading states.
- Tables use **TanStack Table** with column definitions colocated under each feature’s `table/` folder.
- Forms combine **React Hook Form** with **Zod** schemas where validation is centralized.

## Printing and PDF

Invoice flows include print-oriented UI (e.g. `InvoicePrintPreviewPopup`) and PDF generation via `@react-pdf/renderer`. The app shell uses print-friendly classes where relevant (`AppShell`).

## Quality and tooling

- **TypeScript** — `strict` mode (`tsconfig.json`).
- **ESLint** — `eslint-config-next` via `npm run lint`.
- **Spell check** — `cspell.json` is present for typo checking in editors/CI if configured.

## Troubleshooting

| Symptom                          | Things to check                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| API calls fail or hit wrong host | `NEXT_PUBLIC_API_URL`, CORS on the backend, network tab                                       |
| Redirect loop or stuck on login  | Cookie `access_token` present and not expired; middleware vs client both need a valid session |
| 401 after idle                   | Refresh-token endpoint and cookie/localStorage alignment in `api-client.ts`                   |
| Blank translations               | `lang` cookie and matching keys in `en.json` / `vi.json`                                      |

## License

Private project (`"private": true` in `package.json`). Add a license file if you intend to open-source the repository.
