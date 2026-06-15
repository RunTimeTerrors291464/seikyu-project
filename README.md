# Seikyu Project v2 — Warehouse Management Backend

> A monolithic inventory and invoice management backend built with NestJS 11.
> Manages import / selling invoices, returns, stock adjustments, products, user roles, and dashboard analytics — backed by PostgreSQL, Redis, and scheduled aggregation jobs.

![NestJS](https://img.shields.io/badge/NestJS-v11-E0234E?style=flat&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat&logo=postgresql&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-0.3-FE0803?style=flat)
![Redis](https://img.shields.io/badge/Redis-ioredis-DC382D?style=flat&logo=redis&logoColor=white)
![PM2](https://img.shields.io/badge/PM2-cluster-2B037A?style=flat&logo=pm2&logoColor=white)
![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey?style=flat)

---

## Overview

**Seikyu v2** is an **internal warehouse management system** consolidated into a single deployable NestJS service.
It streamlines the tracking and management of inventory operations, including:

- **Import Invoices** — Record goods received from vendors into the warehouse
- **Return Import Invoices** — Handle returns of defective or incorrect goods back to vendors
- **Selling Invoices** — Record goods sold to customers (cashier flow)
- **Return Selling Invoices** — Handle customer returns of sold goods
- **Stock Adjustment Invoices** — Adjust inventory levels manually for corrections or audits
- **Product & Unit Management** — Manage product catalog, SKUs, multi-language names, and inventory stock levels
- **User & Role Management** — Control access with role-based permissions (Admin, Manager, Cashier)
- **Dashboard Analytics** — Product ranking (daily / monthly / yearly) and price trend buckets for charts

> This is a private, internal project. Not intended for public use or redistribution.

### Compared to v1

The [legacy v1 backend](https://github.com/RunTimeTerrors291464/seikyu-project/tree/backend) used a **microservices monorepo** (API gateway + Platform + Invoices services) with **TCP transport** and **three separate PostgreSQL databases**.
**v2 consolidates** these into **one deployable service** with **one PostgreSQL database**, and **adds a Dashboard module** (product ranking, price trend) with scheduled rollups and Redis caching.

---

## Architecture

This repository is a **single NestJS application** (monolith). All domains share **one PostgreSQL database** and **one Redis instance** for refresh tokens, rate limiting, and dashboard caches.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client / Frontend                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (REST)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              NestJS API   (APP_HOST : APP_PORT)             │
│   Swagger /api/docs · JWT Auth · RBAC Guards · CORS         │
│   Global ValidationPipe · Custom Exception Filter           │
│                                                             │
│   Modules: Auth · Users · Products · ProductUnits           │
│            Invoices · Dashboard (+ @nestjs/schedule)        │
└──────────────┬───────────────────────────┬──────────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│      PostgreSQL          │    │           Redis          │
│  (single DB, TypeORM)    │    │  Rate limit · App cache  │
│                          │    │  Dashboard top-N cache   │
└──────────────────────────┘    └──────────────────────────┘
```

### Application Modules

| Module | Path | Description |
|--------|------|-------------|
| **Auth** | `src/auth` | JWT access / refresh tokens, guards, Redis rate-limit |
| **Users** | `src/users` | User CRUD, admin management, first-admin bootstrap |
| **Products** | `src/products` | Product catalog, history versioning, stock history, overview |
| **Product Units** | `src/productUnits` | Units of measure with versioned history |
| **Invoices** | `src/invoices` | Import, return-import, selling, return-selling, stock-adjustment |
| **Dashboard** | `src/dashboard` | Product ranking, price trend, scheduled aggregation |
| **Logging** | `src/logging` | Logging utilities |

### Shared Libraries

| Library | Path | Purpose |
|---------|------|---------|
| **common** | `libs/common` | DTOs, enums (`ErrorCode`, `Role`, `InvoiceStatus`, ...), decorators, error exceptions, mappers, validators, utils |
| **services** | `libs/services` | PostgreSQL and Redis module configurations |
| **migrations** | `libs/migrations` | TypeORM migration scripts and data source helpers |
| **scripts** | `libs/scripts` | `start:dev` preflight script (Redis/DB/migrations check) |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js (>= 18.x) |
| **Framework** | NestJS v11 |
| **Language** | TypeScript 5.7 |
| **Database** | PostgreSQL 15 (single database) |
| **ORM** | TypeORM 0.3 |
| **Caching** | Redis (via `ioredis` + `@nestjs-modules/ioredis`) |
| **Authentication** | JWT (Access + Refresh tokens) with Passport.js |
| **Authorization** | Role-Based Access Control (RBAC) with custom Guards & Decorators |
| **API Documentation** | Swagger / OpenAPI 3.0 |
| **Validation** | class-validator + class-transformer |
| **Password Hashing** | bcrypt |
| **Scheduling** | `@nestjs/schedule` (dashboard aggregation & cache warmup) |
| **Process Manager** | PM2 (cluster mode) |
| **Testing** | Jest 30 + Supertest |

---

## Features

### Authentication & Authorization
- JWT-based authentication with **access tokens** and **refresh tokens**
- Refresh token storage and revocation in PostgreSQL
- Role-Based Access Control (RBAC) with 3 roles: **Admin**, **Manager**, **Cashier**
- Custom decorators: `@Roles()`, `@Public()`, `@CurrentUser()`
- Custom guards: `JwtAuthGuard`, `RolesGuard`, `RateLimitGuard`
- **Redis-backed per-user rate limiting** on guarded routes (burst protection + temporary ban window)

### Product Management
- Full CRUD for products and product units
- SKU-based product identification
- Multi-name support for products (e.g., Vietnamese + English names)
- Inventory stock tracking with stock status (`in_stock`, `low_stock`, `out_of_stock`)
- Reorder threshold system for low-stock alerts
- Product activation/deactivation
- **History versioning** — Every product/unit edit creates a versioned history snapshot with auto-cleanup
- **Stock history** — Audit trail for every stock change with action type, user reference, and invoice reference
- **Product overview** — Aggregated counts for dashboards
- **Bulk inventory stock lookup** — Multi-product stock query

### Invoice Management

5 invoice types covering the full warehouse lifecycle:

- **Import Invoices** — Draft → Confirm workflow with auto-ID generation
  - Products linked with quantity, price, and discount
  - On confirmation: inventory stock automatically updated
  - Tracks return count and status (`draft`, `confirmed`, `partially_returned`, `returned`)
  - Bulk delete of drafts

- **Return Import Invoices** — Return goods back to vendors against an existing import invoice
  - Validates returned quantity against original import quantities
  - Updates import invoice return count and status
  - Adjusts inventory stock on confirmation

- **Selling Invoices** — Record goods sold with product-level and invoice-level discounts
  - Cashier flow (no draft state by default in v2)
  - Supports percentage / fixed-amount discounts
  - Tax focus support
  - Auto-updates inventory stock (allows negative stock per business rule)

- **Return Selling Invoices** — Handle customer returns of sold goods
  - Draft → Confirm workflow linked to original selling invoice
  - Validates returned quantity against original selling quantities
  - Updates selling invoice return count and status

- **Stock Adjustment Invoices** — Manual inventory corrections and audit adjustments
  - Draft → Confirm workflow
  - Tracks action reason for audit purposes
  - Adjusts inventory stock on confirmation

### Dashboard Analytics
- **Product Ranking** — Daily / Monthly / Yearly aggregations with custom date range
- **Price Trend** — Aggregated time-bucket data for chart-oriented responses
- **Scheduled rollups** via `@nestjs/schedule` cron jobs
- **Redis top-N caching** for hot ranking queries
- Product search by SKU with case-insensitive indexes

### User Management
- Admin-managed user accounts with role assignment
- First admin account bootstrap endpoint (only available when no admin exists)
- User activation/deactivation
- Password management (change password, admin reset)
- User search by username with filtering and pagination

### Error Handling
- **Centralized error code system** organized by domain
  - `1xxx` — User errors
  - `2xxx` — Authentication errors
  - `3xxx` — Product unit errors
  - `4xxx` — Product errors
  - `5xxx` — Invoice errors
  - `9xxx` — System errors
- **Custom exception filter** — Consistent JSON error response format across all endpoints
- **`@HandleServiceError` decorator** — Auto-wraps service methods with try/catch and contextual error codes
- **Validation error formatter** — Friendly nested-error responses from `class-validator`

### API Documentation
- Auto-generated **Swagger/OpenAPI** documentation at `/api/docs`
- Bearer token authentication support in Swagger UI
- Persistent authorization across page refreshes

---

## Project Structure

```
seikyu-project-v2/
├── src/
│   ├── main.ts                          # Bootstrap, CORS, Swagger, global pipes/filters
│   ├── app.module.ts                    # Root module wiring
│   │
│   ├── auth/                            # Authentication & authorization
│   │   ├── controllers/                 # Auth endpoints (login, logout, refresh)
│   │   ├── entities/                    # RefreshToken entity
│   │   ├── guards/                      # JwtAuthGuard, RolesGuard, RateLimitGuard
│   │   ├── decorators/                  # @Roles, @Public
│   │   ├── repositories/                # Refresh token repository
│   │   └── services/                    # Auth service, access token service
│   │
│   ├── users/                           # Users & admin management
│   │   ├── controllers/                 # Users, Admin, First-admin controllers
│   │   ├── entities/                    # UserEntity
│   │   ├── repositories/
│   │   └── services/
│   │
│   ├── products/                        # Product catalog
│   │   ├── controllers/
│   │   ├── entities/                    # Products, ProductNames, History, StockHistory, Overview
│   │   ├── repositories/
│   │   └── services/
│   │
│   ├── productUnits/                    # Units of measure
│   │   ├── controllers/
│   │   ├── entities/                    # ProductUnits, ProductUnitsHistory
│   │   ├── repositories/
│   │   └── services/
│   │
│   ├── invoices/                        # Invoice domain
│   │   ├── importInvoices/              # Import + Return-import sub-modules
│   │   ├── sellingInvoices/             # Selling + Return-selling sub-modules
│   │   └── stockAdjustmentInvoice/      # Stock adjustment sub-module
│   │
│   ├── dashboard/                       # Product ranking + Price trend
│   │   ├── controllers/
│   │   ├── entities/                    # Daily / Monthly / Yearly ranking entities
│   │   ├── repositories/
│   │   └── services/                    # Aggregation + Schedule services
│   │
│   └── logging/                         # Logging utilities
│
├── libs/
│   ├── common/                          # Shared library
│   │   ├── decorators/                  # @HandleServiceError, @CurrentUser
│   │   ├── dtos/                        # Request / Response DTOs per domain
│   │   ├── enums/                       # ErrorCode, Role, InvoiceStatus, InvoiceType, StockActionType, StockStatus, ReturnReasons
│   │   ├── error-exceptions/            # Custom exception classes & global filter
│   │   ├── mappers/                     # Entity → DTO mappers
│   │   ├── utils/
│   │   └── validators/
│   │
│   ├── services/                        # Service configurations
│   │   ├── postgres.module.ts           # TypeORM / PostgreSQL module
│   │   └── redis.module.ts              # Redis module (ioredis)
│   │
│   ├── migrations/                      # TypeORM migrations
│   │   ├── src/                         # Migration files (USERS, AUTH, PRODUCTS, INVOICES, DASHBOARD)
│   │   └── scripts/                     # dataSource, runMigrations, createMigration
│   │
│   └── scripts/
│       ├── startDev.script.ts              # Preflight (Redis + DB + pending migrations)
│       ├── importExcel.util.ts             # Shared helpers for Excel import scripts
│       ├── importProductUnitsFromExcel.script.ts
│       └── importProductsFromExcel.script.ts
│
├── import/                              # Drop Excel files here (not committed; see .gitignore)
│   └── product_import.xlsx              # Default filename for unit + product import
│
├── ecosystem.config.js                  # PM2 cluster configuration
├── nest-cli.json                        # NestJS configuration
├── package.json                         # Dependencies & scripts
├── tsconfig.json                        # TypeScript configuration
└── tsconfig.build.json
```

---

## Database Schema

v2 uses **one** PostgreSQL database managed by TypeORM migrations under `libs/migrations/src`.

### Auth tables

| Entity | Table | Description |
|--------|-------|-------------|
| `RefreshTokenEntity` | `refresh_tokens` | JWT refresh tokens for session management |

### User tables

| Entity | Table | Description |
|--------|-------|-------------|
| `UserEntity` | `users` | User accounts with credentials, roles, and active status |

### Product tables

| Entity | Table | Description |
|--------|-------|-------------|
| `ProductsEntity` | `products` | Product catalog with SKU, stock levels, pricing |
| `ProductNamesEntity` | `product_names` | Multi-language product names |
| `ProductUnitsEntity` | `product_units` | Units of measure (kg, box, piece, ...) |
| `ProductsHistoryEntity` | `products_history` | Versioned product edit history |
| `ProductUnitsHistoryEntity` | `product_units_history` | Versioned unit edit history |
| `ProductStockHistoryEntity` | `product_stock_history` | Audit trail for all stock changes |
| `ProductOverviewEntity` | `product_overview` | Aggregated counts for dashboard |

### Invoice tables

| Entity | Table | Description |
|--------|-------|-------------|
| `ImportInvoiceEntity` | `import_invoice` | Import invoices (draft → confirmed) |
| `ImportInvoiceProductsEntity` | `import_invoice_products` | Line items for import invoices |
| `ReturnImportInvoiceEntity` | `return_import_invoice` | Return invoices against imports |
| `ReturnImportInvoiceProductsEntity` | `return_import_invoice_products` | Line items for return import invoices |
| `SellingInvoiceEntity` | `selling_invoice` | Sales invoices |
| `SellingInvoiceProductsEntity` | `selling_invoice_products` | Line items for selling invoices |
| `ReturnSellingInvoiceEntity` | `return_selling_invoice` | Customer return invoices |
| `ReturnSellingInvoiceProductsEntity` | `return_selling_invoice_products` | Line items for return selling invoices |
| `StockAdjustmentInvoiceEntity` | `stock_adjustment_invoice` | Manual stock adjustments |
| `StockAdjustmentInvoiceProductsEntity` | `stock_adjustment_invoice_products` | Line items for stock adjustments |

### Dashboard tables

| Entity | Table | Description |
|--------|-------|-------------|
| `ProductRankingDailyEntity` | `product_ranking_daily` | Daily product ranking aggregates |
| `ProductRankingMonthlyEntity` | `product_ranking_monthly` | Monthly product ranking aggregates |
| `ProductRankingYearlyEntity` | `product_ranking_yearly` | Yearly product ranking aggregates |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **PostgreSQL** >= 15
- **Redis** server
- **npm** >= 9.x
- **PM2** (optional, for production deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/RunTimeTerrors291464/seikyu-project.git
cd seikyu-project-v2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example file and update values:

```bash
cp .env.example .env
```

Key variables to configure:

```env
# Application
APP_HOST=0.0.0.0
APP_PORT=3000
ACCEPTED_ORIGINS=https://app.example.com,https://admin.example.com

# PostgreSQL (single database)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=seikyu_project_v2
DB_SSL=false
DB_SSL_CERT=

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT secrets (MUST change in production)
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
```

**CORS:** `main.ts` reads `ACCEPTED_ORIGINS` as a comma-separated list. If unset or empty, it allows `*`. For production, set explicit origins.

### 4. Create the Database

```sql
CREATE DATABASE seikyu_project_v2;
```

### 5. Run Migrations

```bash
npm run migration:run
```

### 6. Start in Development

The `start:dev` script runs a preflight check (Redis, PostgreSQL, pending migrations) before starting Nest in watch mode:

```bash
npm run start:dev
```

### 7. Start in Production

#### Option A — Plain Node

```bash
npm run build
npm run start:prod
```

#### Option B — PM2 (cluster mode, recommended)

```bash
npm run start:prod-pm2
```

This builds the project and starts it under PM2 using `ecosystem.config.js` (cluster mode, instances = `max`, auto-restart at 512MB RAM).

### 8. Access the API

- **API Base**: `http://localhost:3000`
- **Swagger Docs**: `http://localhost:3000/api/docs`

### 9. First-Time Setup

Create the first admin account (this endpoint is only available when no admin exists):

```bash
curl -X POST http://localhost:3000/api/v2/admin/first-admin-account \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Admin",
    "last_name": "User",
    "username": "admin",
    "password": "your_secure_password"
  }'
```

Then call `POST /api/v2/auth/login` to obtain access + refresh tokens, and click **Authorize** in Swagger UI to authorize subsequent requests.

### 10. Import Data from Excel

Bulk import **product units** and **products** from a spreadsheet without bypassing application business logic (validation, transactions, history, stock updates). Scripts bootstrap the NestJS app and call the same services as the HTTP API.

#### Prepare the file

1. Place your workbook at **`import/product_import.xlsx`** (also supports `.xls` / `.xlsm`).
2. The workbook should contain at least these sheets:
   - **`Product Unit`** — units of measure
   - **`Product`** — product catalog + opening stock

Excel files in `import/` are **gitignored**; only `import/.gitkeep` is tracked.

#### Import order

Run **product units first**, then **products** (products reference units by name).

```bash
# 1) Product units
npm run import:product-units -- --dry-run   # validate only
npm run import:product-units                 # import

# 2) Products (after units exist)
npm run import:products -- --dry-run
npm run import:products
```

#### Commands

| Script | Description |
|--------|-------------|
| `npm run import:product-units` | Import units from `import/product_import.xlsx` |
| `npm run import:products` | Import products + set opening stock from the same file |

**Common flags** (both scripts):

| Flag | Description |
|------|-------------|
| `--dry-run` | Validate rows only; no database writes |
| `--verbose` / `-v` | Log each skipped/created row with details |
| `--file`, `-f` | Custom Excel path (default: `import/product_import.xlsx`) |
| `--sheet`, `-s` | Sheet name (default: auto-detect) |
| `--user`, `-u` | Manager/Admin username or UUID for history `createdBy` (optional; auto-picks first active Admin, else Manager) |

Optional env: `IMPORT_USER_USERNAME` (same as `--user`).

#### Sheet: Product Unit

| Excel column | Maps to |
|--------------|---------|
| `Unit Name* (Hungarian)` | `unitName` |
| `Unit Description` | `unitDescription` |

#### Sheet: Product

| Excel column | Maps to |
|--------------|---------|
| `SKU*` | `sku` (left-padded with `0` to 13 characters) |
| `Product Description` | `productDescription` (product display name) |
| `Product Name 1` | Fallback for description if `Product Description` is empty |
| `Product Unit*` | `productUnitId` (lookup by unit name from DB) |
| `Import Price*` | `importPrice` |
| `Selling Price*` | `sellingPrice` |
| `Reorder Threshold` | `reorderThreshold` (optional) |
| `Quantity` | Opening `inventoryStock` via stock adjustment after create |

`productNames` in the API is satisfied with the description text (or padded SKU if description is empty).

#### Skip rules (products)

Rows are skipped (and grouped in the summary) when:

- SKU is empty or longer than 13 characters before padding
- Duplicate SKU in the file (after padding) or SKU already in the database
- Product unit is missing, not found, or inactive
- Price / quantity / DTO validation fails
- Quantity is not an integer or is outside the 4-byte integer range (`-2147483648` … `2147483647`)

#### Example summary output (products)

```
[import:products] Summary
  Total rows checked:      13165
  Created / valid:         13074
  Skipped (total):         91
  Failed:                  0

[import:products] Skipped breakdown:
  Skipped (SKU exceeded 13 characters): 73
  Skipped (Invalid quantity): 10
  Skipped (Duplicate SKU in file): 7
  Skipped (SKU already exists in database): 1
```

Use `--verbose` to see per-row skip reasons.

---

## API Endpoints

All endpoints are prefixed with **`/api/v2`**.

### Auth (`/api/v2/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v2/auth/login` | Login with credentials | Public |
| POST | `/api/v2/auth/refresh-token` | Refresh access token | Public |
| POST | `/api/v2/auth/logout` | Logout and revoke refresh token | Required |

### Admin (`/api/v2/admin`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v2/admin/first-admin-account` | Create first admin account | Public (only when no admin exists) |
| POST | `/api/v2/admin/users` | Create a new user | Admin |
| PATCH | `/api/v2/admin/users` | Edit user information | Admin |
| GET | `/api/v2/admin/users` | List/search users | Admin |
| GET | `/api/v2/admin/users/:id` | Get user by ID | Admin |
| PATCH | `/api/v2/admin/users/activation/:id/:action` | Activate or deactivate (`activate` / `deactivate`) | Admin |
| POST | `/api/v2/admin/users/reset-password` | Admin reset user password | Admin |

### Users (`/api/v2/users`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/v2/users` | Get own user info | Authenticated |
| PATCH | `/api/v2/users/change-password` | Change own password | Authenticated |
| GET | `/api/v2/users/search` | Search users by username | Admin, Manager |

### Products (`/api/v2/products`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v2/products` | Create a product | Manager |
| PATCH | `/api/v2/products` | Edit a product | Manager |
| GET | `/api/v2/products/overview` | Product overview totals | Admin, Manager |
| GET | `/api/v2/products/inventory-stock` | Bulk inventory by product IDs (query `productIds`) | Admin, Manager |
| GET | `/api/v2/products` | List products | Manager, Admin |
| GET | `/api/v2/products/by-unit/:productUnitId` | List products by unit | Manager, Admin |
| GET | `/api/v2/products/:id` | Get product by ID | Manager, Admin |
| GET | `/api/v2/products/sku/:sku` | Get product by SKU (full / cashier view) | Manager, Cashier |
| GET | `/api/v2/products/history/:id` | Get product edit history list | Admin |
| GET | `/api/v2/products/history/:id/:version` | Get specific history version | Admin |
| GET | `/api/v2/products/stock-history/:id` | Get stock change history | Admin, Manager |
| PATCH | `/api/v2/products/activation/:id/:action` | Activate or deactivate | Manager |

### Product Units (`/api/v2/product-units`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v2/product-units` | Create a unit | Manager |
| PATCH | `/api/v2/product-units` | Edit a unit | Manager |
| PATCH | `/api/v2/product-units/activation/:id/:action` | Activate or deactivate | Manager |
| GET | `/api/v2/product-units` | List units | Manager, Admin |
| GET | `/api/v2/product-units/:id` | Get unit by ID | Manager, Admin |
| GET | `/api/v2/product-units/history/:id` | Get unit history list | Admin |
| GET | `/api/v2/product-units/history/:id/:version` | Get specific history version | Admin |

### Import Invoices (`/api/v2/invoices/import`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v2/invoices/import` | Create draft import invoice | Manager |
| PATCH | `/api/v2/invoices/import` | Edit draft import invoice | Manager |
| DELETE | `/api/v2/invoices/import` | Bulk delete draft import invoices (body with `ids`) | Manager |
| POST | `/api/v2/invoices/import/:id/confirm` | Confirm import invoice | Manager |
| GET | `/api/v2/invoices/import` | List import invoices | Manager, Admin |
| GET | `/api/v2/invoices/import/:id` | Get import invoice detail | Manager, Admin |

### Return Import Invoices (`/api/v2/invoices/return-import`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v2/invoices/return-import` | Create draft return invoice | Manager |
| PATCH | `/api/v2/invoices/return-import` | Edit draft return invoice | Manager |
| DELETE | `/api/v2/invoices/return-import` | Bulk delete drafts | Manager |
| POST | `/api/v2/invoices/return-import/:id/confirm` | Confirm return invoice | Manager |
| GET | `/api/v2/invoices/return-import` | List return invoices | Manager, Admin |
| GET | `/api/v2/invoices/return-import/:id` | Get return invoice detail | Manager, Admin |

### Selling Invoices (`/api/v2/invoices/selling`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v2/invoices/selling` | Create selling invoice | Cashier |
| GET | `/api/v2/invoices/selling` | List selling invoices | Manager, Cashier, Admin |
| GET | `/api/v2/invoices/selling/:id` | Get selling invoice detail | Manager, Cashier, Admin |

### Return Selling Invoices (`/api/v2/invoices/return-selling`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v2/invoices/return-selling` | Create draft return invoice | Manager |
| PATCH | `/api/v2/invoices/return-selling` | Edit draft return invoice | Manager |
| DELETE | `/api/v2/invoices/return-selling` | Bulk delete drafts | Manager |
| POST | `/api/v2/invoices/return-selling/:id/confirm` | Confirm return invoice | Manager |
| GET | `/api/v2/invoices/return-selling` | List return invoices | Manager, Admin |
| GET | `/api/v2/invoices/return-selling/:id` | Get return invoice detail | Manager, Admin |

### Stock Adjustment Invoices (`/api/v2/invoices/stock-adjustment`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v2/invoices/stock-adjustment` | Create draft adjustment | Manager |
| PATCH | `/api/v2/invoices/stock-adjustment` | Edit draft adjustment | Manager |
| DELETE | `/api/v2/invoices/stock-adjustment` | Bulk delete drafts | Manager |
| POST | `/api/v2/invoices/stock-adjustment/:id/confirm` | Confirm adjustment | Manager |
| GET | `/api/v2/invoices/stock-adjustment` | List adjustments | Manager, Admin |
| GET | `/api/v2/invoices/stock-adjustment/:id` | Get adjustment detail | Manager, Admin |

### Dashboard (`/api/v2/dashboard`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/v2/dashboard/product-ranking` | Paginated product ranking (daily / monthly / yearly / custom range) | Manager |
| GET | `/api/v2/dashboard/price-trend` | Aggregated price trend buckets for line chart | Manager |

---

## Available Scripts

### Development

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Preflight (Redis + DB + pending migrations) then `nest start --watch` |
| `npm run start:debug` | Start with Node debugger and watch mode |
| `npm run start` | Start Nest without watch (compiled on the fly) |

### Build & Production

| Script | Description |
|--------|-------------|
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run `node dist/main` (compiled app) |
| `npm run start:prod-pm2` | Build + start PM2 cluster (`ecosystem.config.js`) |

### Testing

| Script | Description |
|--------|-------------|
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:debug` | Run tests with Node inspector |

### Code Quality

| Script | Description |
|--------|-------------|
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Run Prettier formatter |

### Database Migrations

| Script | Description |
|--------|-------------|
| `npm run migration:run` | Run all pending TypeORM migrations |
| `npm run migration:revert` | Revert the last migration |
| `npm run migration:show` | Show migration status |
| `npm run migration:create` | Create an empty migration file |
| `npm run typeorm` | Generic TypeORM CLI passthrough |

### Excel Import

| Script | Description |
|--------|-------------|
| `npm run import:product-units` | Import product units from `import/product_import.xlsx` (see [Import Data from Excel](#10-import-data-from-excel)) |
| `npm run import:products` | Import products and opening stock from the same file |

---

## PM2 Production Deployment

The project ships with a PM2 ecosystem configuration for cluster-mode production deployment:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'seikyu-v2',
      script: 'dist/src/main.js',
      instances: 'max',             // Use all available CPU cores
      exec_mode: 'cluster',
      max_memory_restart: '512M',   // Auto-restart on memory leak
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

### Quick Start

```bash
# Build + start under PM2 (one command)
npm run start:prod-pm2
```

### Useful PM2 commands

```bash
pm2 list                     # List running processes
pm2 logs seikyu-v2           # Tail logs
pm2 restart seikyu-v2        # Restart all instances
pm2 reload seikyu-v2         # Zero-downtime reload (cluster mode)
pm2 stop seikyu-v2           # Stop the app
pm2 delete seikyu-v2         # Remove from PM2
pm2 save                     # Persist process list across reboots
pm2 startup                  # Generate boot startup script
```

### Tuning the instance count

To pin the instance count instead of using `'max'`, edit `ecosystem.config.js`:

```js
instances: 8,   // exactly 8 workers
```

### Horizontal scaling note

Because **rate limiting** and **dashboard top-N caching** use Redis, multiple PM2 instances (or multiple hosts) can share the same Redis for consistent behavior. Ensure the PostgreSQL connection pool fits the total worker count.

---

## Deployment Checklist

1. **Provision** PostgreSQL and Redis reachable from the app host.
2. **Set environment variables** on the host (secrets manager, systemd `EnvironmentFile`, Kubernetes secrets, ...). Never commit real `.env` files.
3. **TLS to PostgreSQL** when required (`DB_SSL=true` and valid `DB_SSL_CERT`).
4. **Run migrations** as a release step before traffic switch: `npm run migration:run`.
5. **Build** with `npm ci` (CI) or `npm install`, then `npm run build`.
6. **Start** with `npm run start:prod-pm2` (PM2 cluster) or `node dist/src/main` under systemd / Kubernetes.
7. **Reverse proxy** (nginx, Caddy, AWS ALB, ...) for HTTPS termination, gzip, and upstream to `APP_PORT`.
8. **CORS**: set `ACCEPTED_ORIGINS` to real frontend origins (never `*` in production).
9. **Observability**: capture stdout/stderr, configure log rotation, add health probes if needed.

---

## Error Code Reference

All errors follow a structured error code system for consistent API responses. Defined in `libs/common/enums/errorCode.enum.ts`.

| Range | Domain | Examples |
|-------|--------|----------|
| `1xxx` | Users | `1001` user already exists · `1002` user not found |
| `2xxx` | Authentication | `2001` invalid credentials · `2007` rate limit exceeded |
| `3xxx` | Product Units | `3001` unit not found · `3002` unit already exists |
| `4xxx` | Products | `4001` SKU already exists · `4002` product not found |
| `5xxx` | Invoices | `5001+` import / return / selling / adjustment invoice errors |
| `9xxx` | System | `9999` unknown error |

Refer to Swagger responses and the global exception filter's JSON body for precise codes in clients.

---

## License

This project is **UNLICENSED** — private and internal use only. Not intended for public use or redistribution.
