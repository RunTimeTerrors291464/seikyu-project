# Seikyu Project v2

> A NestJS backend for **warehouse-style operations**: inventory, invoices (import, returns, selling, stock adjustments), user and role management, and a **dashboard** with product ranking and price trends backed by PostgreSQL, Redis, and scheduled aggregation jobs.

NestJS · TypeScript · PostgreSQL · TypeORM · Redis · JWT · Swagger

---

## Overview

**Seikyu Project v2** is an API-first application for teams that need to record stock movements and sales in one place, with traceability and reporting suitable for managers and cashiers.

Core capabilities:

- **Import invoices** — Draft, edit, delete, confirm; stock updates on confirm.
- **Return import invoices** — Return goods to vendors against import flows.
- **Selling invoices** — Create sales (cashier flow); list and view details.
- **Return selling invoices** — Customer returns linked to selling invoices.
- **Stock adjustment invoices** — Manual corrections with draft/confirm workflow.
- **Products & product units** — Catalog, SKU lookup, activation, versioned history (admin), stock history.
- **Users & roles** — **Admin**, **Manager**, **Cashier** with JWT access/refresh tokens and Redis-backed rate limiting on authenticated routes.
- **Dashboard** — Product ranking (daily / monthly / yearly and custom ranges) and **price trend** data for charts, with scheduled rollups and Redis caching.

Interactive API documentation is served at **`/api/docs`** (OpenAPI / Swagger).

---

## Architecture

This repository is a **single NestJS application** (monolith). All domains share **one PostgreSQL database** and optional **Redis** for sessions/rate limits, refresh-token related usage, and dashboard caches.

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP clients / frontend                  │
└────────────────────────────┬────────────────────────────────┘
                             │ REST (JSON)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              NestJS API (APP_HOST : APP_PORT)                 │
│   Swagger /api/docs · JWT · RBAC · ValidationPipe · CORS    │
│   Modules: Auth, Users, Products, ProductUnits, Invoices,     │
│            Dashboard (+ @nestjs/schedule cron jobs)           │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐    ┌─────────────────────────────┐
│      PostgreSQL          │    │           Redis             │
│  (single DB, TypeORM)      │    │  rate limit, app prefix     │
└──────────────────────────┘    │  dashboard caches, etc.     │
                                └─────────────────────────────┘
```

### Compared to the older microservices layout

The [legacy backend branch](https://github.com/RunTimeTerrors291464/seikyu-project/tree/backend) used an API gateway plus **TCP microservices** and **three PostgreSQL databases**. **v2 consolidates** those concerns into **one deployable service** and **one database**, and adds the **dashboard** ranking/trend stack.

---

## Tech stack

| Category | Technology |
| -------- | ---------- |
| Runtime | Node.js |
| Framework | NestJS 11 |
| Language | TypeScript 5.7 |
| Database | PostgreSQL (single database) |
| ORM | TypeORM 0.3 |
| Cache / limits | Redis (`ioredis`, `@nestjs-modules/ioredis`) |
| Auth | JWT + Passport; refresh tokens (PostgreSQL) |
| Authorization | RBAC (roles + guards) |
| API docs | Swagger / OpenAPI |
| Validation | `class-validator`, `class-transformer` |
| Scheduling | `@nestjs/schedule` (dashboard aggregation & cache warmup) |
| Testing | Jest |

---

## Features (summary)

### Authentication and authorization

- Access and refresh tokens; logout revokes refresh token usage as implemented in auth services.
- Roles: **Admin**, **Manager**, **Cashier** — combined with `JwtAuthGuard`, `RolesGuard`, and `@Roles()`.
- Per-user **rate limiting** on guarded routes via Redis (burst protection and temporary ban window when exceeded).

### Products and units

- CRUD-style flows for products and units, activation toggles, list/filter patterns.
- **Admin**: product and product-unit **version history**.
- **Admin / Manager**: stock history and product overview helpers as exposed in the products API.

### Invoices

- Import and return-import: **draft** lifecycle, **confirm** posts stock effects, bulk **delete** of drafts where implemented.
- Selling: **create** (role-gated), list, get by id.
- Return selling and stock adjustment: same draft / confirm patterns as other invoice families.

### Dashboard

- **Product ranking** across invoice types, with daily/monthly/yearly storage and Redis top-N caching (see `ScheduleProductRankingService`).
- **Price trend** endpoint for aggregated time buckets (chart-oriented responses).
- Cron jobs maintain aggregates and caches (e.g. periodic refresh and midnight rollups).

### Errors

- Structured **`ErrorCode`** enum and a global exception filter for consistent JSON error shapes.

---

## Project structure (high level)

```
seikyu-project-v2/
├── src/
│   ├── main.ts                 # Bootstrap, CORS, Swagger, global pipes/filters
│   ├── app.module.ts           # Root module wiring
│   ├── auth/                   # JWT, refresh tokens, guards, rate limit
│   ├── users/                  # Users, admin, first-admin bootstrap
│   ├── products/               # Products, history, stock history, overview
│   ├── productUnits/           # Units and history
│   ├── invoices/               # Import, return import, selling, return selling, stock adjustment
│   └── dashboard/              # Product ranking, price trend, schedules, repositories
├── libs/
│   ├── common/                 # DTOs, enums (incl. ErrorCode), mappers, exceptions
│   ├── services/               # PostgresModule, RedisModule
│   ├── migrations/             # TypeORM migrations + data source helpers
│   └── scripts/                # start:dev preflight (Redis/DB/migrations)
├── .env.example
├── package.json
└── nest-cli.json
```

---

## Getting started

### Prerequisites

- **Node.js** ≥ 18 (align with your team standard; lockfile targets current Nest 11 stack)
- **PostgreSQL** (project tested around 15+; use a version your ORM/drivers support)
- **Redis**
- **npm**

### 1. Clone and install

```bash
git clone <your-fork-or-origin-url>
cd seikyu-project-v2
npm install
```

### 2. Environment variables

Copy the example file:

```bash
cp .env.example .env
```

Important keys (see `.env.example` for the full template):

| Variable | Purpose |
| -------- | ------- |
| `DB_*` | PostgreSQL host, port, user, password, database name, pool options |
| `DB_SSL`, `DB_SSL_CERT` | Set `DB_SSL=true` for TLS (e.g. RDS); provide CA bundle path |
| `REDIS_*` | Redis connection |
| `APP_HOST`, `APP_PORT` | Bind address and port (**default port in example: 3000**) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | **Change in production** |

**CORS:** `main.ts` reads `ACCEPTED_ORIGINS` as a comma-separated list. If unset or empty, it allows `*`. For production, set explicit origins in `.env`, for example:

```env
ACCEPTED_ORIGINS=https://app.example.com,https://admin.example.com
```

### 3. Create the database

Create a single database (name must match `DB_DATABASE`), e.g.:

```sql
CREATE DATABASE seikyu_project_v2;
```

### 4. Run migrations

```bash
npm run migration:run
```

### 5. Run in development

`start:dev` checks **Redis**, **PostgreSQL**, and that **no pending migrations** exist, then starts Nest in watch mode:

```bash
npm run start:dev
```

### 6. Run in production

Build and start the compiled app:

```bash
npm run build
npm run start:prod
```

The process listens on `APP_HOST`:`APP_PORT` (defaults from env example: `localhost:3000`).

### 7. Open Swagger

- Base URL: `http://<APP_HOST>:<APP_PORT>`
- Swagger UI: `http://<APP_HOST>:<APP_PORT>/api/docs`

### 8. First admin account

When no admin exists yet, create the first admin (see Swagger for the exact body schema):

```bash
curl -X POST "http://localhost:3000/api/v1/admin/first-admin-account" \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Admin\",\"username\":\"admin\",\"password\":\"your_secure_password\"}"
```

On Windows **cmd**, replace line-ending `\` with `^`. In **PowerShell**, prefer `Invoke-RestMethod` or pass the JSON as a single line.

Then use **`POST /api/v1/auth/login`** to obtain tokens and authorize requests in Swagger (**Authorize** button).

---

## Deployment

There is **no checked-in PM2 or Docker file** in this repo; deploy the built Node app like any Nest service.

### Recommended checklist

1. **Provision** PostgreSQL and Redis reachable from the app host.
2. **Set environment variables** on the host (secrets manager, systemd `EnvironmentFile`, Kubernetes secrets, etc.). Never commit real `.env` files.
3. **TLS to PostgreSQL** when required (`DB_SSL=true` and valid `DB_SSL_CERT`).
4. **Run migrations** as a release step before or on startup (same `npm run migration:run` against production env).
5. **Build** with `npm ci` (in CI) or `npm install`, then `npm run build`.
6. **Start** with `node dist/main` or `npm run start:prod` under a supervisor:
   - **systemd**, **PM2**, **Kubernetes Deployment**, or a PaaS process type.
7. **Reverse proxy** (nginx, Caddy, AWS ALB, etc.) for HTTPS termination, gzip, and upstream to `APP_PORT`.
8. **CORS**: set `ACCEPTED_ORIGINS` to real front-end origins.
9. **Observability**: capture stdout/stderr, add health checks (you can extend Nest with a health module if needed).

### Horizontal scaling note

Because **rate limiting** and some **dashboard caching** use Redis, multiple instances can share the same Redis for consistent behavior. Ensure **database connection pool** settings (`DB_POOL_*`) suit your total instance count.

---

## API endpoints

All routes below are prefixed by **`/api/v1`** as implemented in controllers. **Auth** column: **Public** = no bearer token; **Bearer** = JWT required; roles are enforced where noted.

### Auth — `/api/v1/auth`

| Method | Path | Description | Auth |
| ------ | ---- | ----------- | ---- |
| POST | `/api/v1/auth/login` | Login | Public |
| POST | `/api/v1/auth/refresh-token` | New access token from refresh token | Public |
| POST | `/api/v1/auth/logout` | Logout | Bearer |

### Admin — `/api/v1/admin`

| Method | Path | Description | Roles |
| ------ | ---- | ----------- | ----- |
| POST | `/api/v1/admin/first-admin-account` | Bootstrap first admin | Public (only when no admin exists) |
| POST | `/api/v1/admin/users` | Create user | Admin |
| PATCH | `/api/v1/admin/users` | Edit user | Admin |
| GET | `/api/v1/admin/users` | List users (query filters) | Admin |
| GET | `/api/v1/admin/users/:id` | Get user by id | Admin |
| PATCH | `/api/v1/admin/users/activation/:id/:action` | `activate` or `deactivate` | Admin |
| POST | `/api/v1/admin/users/reset-password` | Admin password reset | Admin |

### Users — `/api/v1/users`

| Method | Path | Description | Roles |
| ------ | ---- | ----------- | ----- |
| GET | `/api/v1/users` | Current user profile | Authenticated |
| PATCH | `/api/v1/users/change-password` | Change own password | Authenticated |
| GET | `/api/v1/users/search` | Search users by username | Admin, Manager |

### Products — `/api/v1/products`

| Method | Path | Description | Roles |
| ------ | ---- | ----------- | ----- |
| POST | `/api/v1/products` | Create product | Manager |
| PATCH | `/api/v1/products` | Edit product | Manager |
| GET | `/api/v1/products/overview` | Product overview | Admin, Manager |
| GET | `/api/v1/products/inventory-stock` | Bulk inventory by product ids (query) | Admin, Manager |
| GET | `/api/v1/products` | List products | Manager, Admin |
| GET | `/api/v1/products/by-unit/:productUnitId` | Products by unit | Manager, Admin |
| GET | `/api/v1/products/:id` | Product by id | Manager, Admin |
| GET | `/api/v1/products/sku/:sku` | Product by SKU | Manager (full) / Cashier (cashier view) |
| GET | `/api/v1/products/history/:id` | Product history list | Admin |
| GET | `/api/v1/products/history/:id/:version` | Product history version | Admin |
| GET | `/api/v1/products/stock-history/:id` | Stock history | Admin, Manager |
| PATCH | `/api/v1/products/activation/:id/:action` | `activate` / `deactivate` | Manager |

### Product units — `/api/v1/product-units`

| Method | Path | Description | Roles |
| ------ | ---- | ----------- | ----- |
| POST | `/api/v1/product-units` | Create unit | Manager |
| PATCH | `/api/v1/product-units` | Edit unit | Manager |
| PATCH | `/api/v1/product-units/activation/:id/:action` | `activate` / `deactivate` | Manager |
| GET | `/api/v1/product-units` | List units | Manager |
| GET | `/api/v1/product-units/:id` | Unit by id | Manager, Admin |
| GET | `/api/v1/product-units/history/:id` | Unit history list | Admin |
| GET | `/api/v1/product-units/history/:id/:version` | Unit history version | Admin |

### Import invoices — `/api/v1/import-invoices`

| Method | Path | Description | Roles |
| ------ | ---- | ----------- | ----- |
| POST | `/api/v1/import-invoices` | Create draft | Manager |
| PATCH | `/api/v1/import-invoices` | Edit draft | Manager |
| DELETE | `/api/v1/import-invoices` | Delete drafts (body with ids) | Manager |
| POST | `/api/v1/import-invoices/:id/confirm` | Confirm | Manager |
| GET | `/api/v1/import-invoices` | List | Manager, Admin |
| GET | `/api/v1/import-invoices/:id` | Detail | Manager, Admin |

### Return import invoices — `/api/v1/return-import-invoices`

| Method | Path | Description | Roles |
| ------ | ---- | ----------- | ----- |
| POST | `/api/v1/return-import-invoices` | Create draft | Manager |
| PATCH | `/api/v1/return-import-invoices` | Edit draft | Manager |
| DELETE | `/api/v1/return-import-invoices` | Delete drafts | Manager |
| POST | `/api/v1/return-import-invoices/:id/confirm` | Confirm | Manager |
| GET | `/api/v1/return-import-invoices` | List | Manager, Admin |
| GET | `/api/v1/return-import-invoices/:id` | Detail | Manager, Admin |

### Selling invoices — `/api/v1/invoices/selling`

| Method | Path | Description | Roles |
| ------ | ---- | ----------- | ----- |
| POST | `/api/v1/invoices/selling` | Create selling invoice | Cashier |
| GET | `/api/v1/invoices/selling` | List | Manager, Cashier, Admin |
| GET | `/api/v1/invoices/selling/:id` | Detail | Manager, Cashier, Admin |

### Return selling invoices — `/api/v1/return-selling-invoices`

| Method | Path | Description | Roles |
| ------ | ---- | ----------- | ----- |
| POST | `/api/v1/return-selling-invoices` | Create draft | Manager |
| PATCH | `/api/v1/return-selling-invoices` | Edit draft | Manager |
| DELETE | `/api/v1/return-selling-invoices` | Delete drafts | Manager |
| POST | `/api/v1/return-selling-invoices/:id/confirm` | Confirm | Manager |
| GET | `/api/v1/return-selling-invoices` | List | Manager, Admin |
| GET | `/api/v1/return-selling-invoices/:id` | Detail | Manager, Admin |

### Stock adjustment invoices — `/api/v1/stock-adjustment-invoices`

| Method | Path | Description | Roles |
| ------ | ---- | ----------- | ----- |
| POST | `/api/v1/stock-adjustment-invoices` | Create draft | Manager |
| PATCH | `/api/v1/stock-adjustment-invoices` | Edit draft | Manager |
| DELETE | `/api/v1/stock-adjustment-invoices` | Delete drafts | Manager |
| POST | `/api/v1/stock-adjustment-invoices/:id/confirm` | Confirm | Manager |
| GET | `/api/v1/stock-adjustment-invoices` | List | Manager, Admin |
| GET | `/api/v1/stock-adjustment-invoices/:id` | Detail | Manager, Admin |

### Dashboard — `/api/v1/dashboard`

| Method | Path | Description | Roles |
| ------ | ---- | ----------- | ----- |
| GET | `/api/v1/dashboard/product-ranking` | Product ranking (query params for period / type) | Manager |
| GET | `/api/v1/dashboard/price-trend` | Price trend buckets for charts | Manager |

---

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm run start:dev` | Preflight Redis + DB + migrations, then `nest start --watch` |
| `npm run start:prod` | Run `node dist/main` |
| `npm run build` | Compile Nest project |
| `npm run migration:run` | Apply pending TypeORM migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:show` | Show migration status |
| `npm run migration:create` | Create empty migration (see script in `libs/migrations`) |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run test` | Unit tests |

---

## Database notes

v2 uses **one** PostgreSQL schema set managed by TypeORM migrations under `libs/migrations`. Entities live under `src/**/entities` (users, refresh tokens, products, units, invoice tables, product ranking tables, etc.).

---

## Error codes (high level)

`ErrorCode` in `libs/common/enums/errorCode.enum.ts` groups problems by domain, for example:

| Range / area | Examples |
| ------------ | -------- |
| Users | `1001` user already exists, `1002` not found, … |
| Auth | `2001` bad credentials, `2007` rate limit exceeded, … |
| Product units | `3001` not found, … |
| Products | `4001` SKU exists, `4002` not found, … |
| Invoices | `5001+` import and related invoice errors, … |

Use Swagger responses and the filter’s JSON body for precise codes in clients.

---

## License

**UNLICENSED** — private project; see `package.json`.
