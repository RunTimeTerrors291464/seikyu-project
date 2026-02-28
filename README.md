# Seikyu Warehouse Management Project

> A microservices-based inventory and invoice management system built with NestJS.
> Designed for businesses to manage import/selling invoices, returns, stock adjustments, products, and user roles with a clean, scalable architecture.

![NestJS](https://img.shields.io/badge/NestJS-v11-E0234E?style=flat&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat&logo=postgresql&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-0.3-FE0803?style=flat)
![Redis](https://img.shields.io/badge/Redis-ioredis-DC382D?style=flat&logo=redis&logoColor=white)
![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey?style=flat)

---

## Overview

Seikyu is an **internal warehouse management system** developed for internal company use.
It is designed to streamline the tracking and management of inventory operations, including:

- **Import Invoices** — Record goods received from vendors into the warehouse
- **Return Import Invoices** — Handle returns of defective or incorrect goods back to vendors
- **Selling Invoices** — Record goods sold to customers
- **Return Selling Invoices** — Handle customer returns of sold goods
- **Stock Adjustments** — Adjust inventory levels manually for corrections or audits
- **Product & Unit Management** — Manage product catalog, SKUs, and inventory stock levels
- **User & Role Management** — Control access with role-based permissions (Admin, Manager, Cashier)

This system is intended for **warehouse managers and administrators** to maintain accurate stock records, traceability, and audit trails for all inventory movements.

> This is a private, internal project. Not intended for public use or redistribution.

---

## Architecture

The system follows a **microservices architecture** using the **NestJS Monorepo** structure. Services communicate via **NestJS TCP transport** using the `@MessagePattern()` decorator.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client / Frontend                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP (REST)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (:4000)                           │
│         Swagger Docs · JWT Auth · RBAC Guards · CORS            │
│         Global ValidationPipe · Custom Exception Filter         │
└──────────┬──────────────────────────────────────┬───────────────┘
           │ TCP (:4001)                          │ TCP (:4002)
           ▼                                      ▼
┌─────────────────────────┐        ┌──────────────────────────────┐
│   Platform Service      │        │      Invoices Service        │
│   (:4001)               │        │      (:4002)                 │
│                         │        │                              │
│  • Products CRUD        │        │  • Import Invoices           │
│  • Product Units        │        │  • Return Import Invoices    │
│  • Stock Management     │        │  • Selling Invoices          │
│  • Product History      │        │  • Return Selling Invoices   │
│  • User Management      │        │  • Stock Adjustment Invoices │
│  • Admin Operations     │        │  • Invoice Helper            │
└──────────┬──────────────┘        └──────────────┬───────────────┘
           │                                      │
           ▼                                      ▼
┌─────────────────────────┐        ┌──────────────────────────────┐
│   PostgreSQL (platform) │        │   PostgreSQL (invoices)      │
└─────────────────────────┘        └──────────────────────────────┘

                    ┌───────────────────────┐
                    │   PostgreSQL           │
                    │   (api_gateway)        │
                    └───────────────────────┘

                    ┌───────────────────────┐
                    │        Redis          │
                    │       (:6379)         │
                    └───────────────────────┘
```

### Microservices

| Service | Port | Transport | Database | Description |
|---------|------|-----------|----------|-------------|
| **API Gateway** | `4000` | HTTP | `api_gateway` | REST API entry point, JWT auth, Swagger docs, request validation |
| **Platform** | `4001` | TCP | `platform` | Products, product units, users, stock management, history tracking |
| **Invoices** | `4002` | TCP | `invoices` | Import, return, selling, stock adjustment invoice lifecycle management |

### Shared Libraries

| Library | Path | Purpose |
|---------|------|---------|
| **common** | `libs/common` | DTOs, enums, decorators, error exceptions, mappers |
| **services** | `libs/services` | PostgreSQL and Redis module configurations |
| **migrations** | `libs/migrations` | TypeORM migration scripts for all 3 databases |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js |
| **Framework** | NestJS v11 (Monorepo) |
| **Language** | TypeScript 5.7 |
| **Database** | PostgreSQL 15 |
| **ORM** | TypeORM 0.3 |
| **Caching** | Redis (via ioredis) |
| **Authentication** | JWT (Access + Refresh tokens) with Passport.js |
| **Authorization** | Role-Based Access Control (RBAC) with custom Guards & Decorators |
| **API Documentation** | Swagger / OpenAPI 3.0 |
| **Validation** | class-validator + class-transformer |
| **Password Hashing** | bcrypt |
| **Process Manager** | PM2 (cluster mode) |
| **Testing** | Jest 30 + Supertest |

---

## Features

### Authentication & Authorization
- JWT-based authentication with **access tokens** and **refresh tokens**
- Refresh token rotation and revocation stored in PostgreSQL
- Role-Based Access Control (RBAC) with 3 roles: **Admin**, **Manager**, **Cashier**
- Custom decorators: `@Roles()`, `@Public()`, `@CurrentUser()`
- Custom guards: `JwtGuard`, `RolesGuard`

### Product Management
- Full CRUD for products and product units
- SKU-based product identification
- Multi-name support for products (e.g., Vietnamese + English names)
- Inventory stock tracking with stock status (`in_stock`, `low_stock`, `out_of_stock`)
- Reorder threshold system for low-stock alerts
- Product activation/deactivation
- **History versioning** — Every product/unit edit creates a versioned history snapshot (max 10 versions with auto-cleanup)
- **Stock history** — Audit trail for every stock change with action type, user reference, and invoice reference

### Invoice Management

5 invoice types covering the full warehouse lifecycle:

- **Import Invoices** — Draft → Confirm workflow with auto-ID generation (format: `IYY-XXXXXXX`)
  - Products linked with quantity, price, and discount
  - On confirmation: inventory stock automatically updated
  - Tracks return count and status (`draft`, `confirmed`, `partially_returned`, `returned`)

- **Return Import Invoices** — Return goods back to vendors against an existing import invoice
  - Validates returned quantity against original import quantities
  - Updates import invoice return count and status
  - Adjusts inventory stock on confirmation

- **Selling Invoices** — Record goods sold with product-level and invoice-level discounts
  - Auto-confirmed on creation (no draft state)
  - Supports percentage-based discounts
  - Auto-updates inventory stock

- **Return Selling Invoices** — Handle customer returns of sold goods
  - Draft → Confirm workflow linked to original selling invoice
  - Validates returned quantity against original selling quantities
  - Updates selling invoice return count and status

- **Stock Adjustment Invoices** — Manual inventory corrections and audit adjustments
  - Draft → Confirm workflow
  - Tracks action reason for audit purposes
  - Adjusts inventory stock on confirmation

### User Management
- Admin-managed user accounts with role assignment
- First admin account creation endpoint (for initial setup)
- User activation/deactivation
- Password management (change password, admin reset)
- User search with filtering and pagination

### Error Handling
- **Centralized error code system** — 90+ unique error codes organized by domain
  - `1xxx` — User errors
  - `2xxx` — Authentication errors
  - `3xxx` — Product & unit errors
  - `4xxx` — Invoice errors
  - `9xxx` — System errors
- **Custom exception filter** — Consistent error response format across all endpoints
- **RPC exception filter** — Handles errors in TCP microservice communication
- **`@HandleServiceError` decorator** — Auto-wraps service methods with try/catch and contextual error codes

### API Documentation
- Auto-generated **Swagger/OpenAPI** documentation at `/api/docs`
- Bearer token authentication support in Swagger UI
- Persistent authorization across page refreshes

---

## Project Structure

```
seikyu-project-refactor/
├── apps/
│   ├── api-gateway/                    # REST API Gateway (HTTP entry point)
│   │   └── src/
│   │       ├── auth/                   # Authentication & authorization
│   │       │   ├── controllers/        # Auth endpoints (login, logout, refresh)
│   │       │   ├── entities/           # RefreshToken entity
│   │       │   ├── guards/             # JwtGuard, RolesGuard, decorators
│   │       │   ├── repositories/       # Refresh token repository
│   │       │   └── services/           # Auth service, JWT strategy
│   │       ├── invoices/               # Invoice proxy controllers
│   │       │   ├── importInvoices/
│   │       │   ├── returnImportInvoices/
│   │       │   ├── sellingInvoices/
│   │       │   ├── returnSellingInvoices/
│   │       │   └── stockAdjustmentInvoices/
│   │       └── platform/              # Platform proxy controllers
│   │           ├── products/           # Products & units controllers
│   │           └── users/              # Users & admin controllers
│   │
│   ├── platform/                       # Platform Microservice (TCP :4001)
│   │   └── src/
│   │       ├── products/               # Product & product unit management
│   │       │   ├── controllers/        # MessagePattern handlers
│   │       │   ├── entities/           # Product, ProductUnit, History entities
│   │       │   ├── repositories/       # Database operations
│   │       │   └── services/           # Business logic
│   │       └── users/                  # User & admin management
│   │           ├── controllers/
│   │           ├── entities/
│   │           ├── repositories/
│   │           └── services/
│   │
│   └── invoices/                       # Invoices Microservice (TCP :4002)
│       └── src/
│           ├── importInvoices/         # Import invoice module
│           ├── returnImportInvoices/   # Return import invoice module
│           ├── sellingInvoices/        # Selling invoice module
│           ├── returnSellingInvoices/  # Return selling invoice module
│           ├── stockAdjustmentInvoices/ # Stock adjustment module
│           └── invoiceHelper/         # Shared invoice helper service
│
├── libs/
│   ├── common/                         # Shared library
│   │   └── src/
│   │       ├── decorators/             # @HandleServiceError
│   │       ├── dtos/                   # Data Transfer Objects
│   │       │   ├── api-gateway/        # Auth DTOs
│   │       │   ├── invoices/           # Invoice DTOs
│   │       │   └── platform/          # Product & user DTOs
│   │       ├── enums/                  # ErrorCode, Role, InvoiceStatus, etc.
│   │       ├── error-exceptions/       # Custom exception classes & filters
│   │       └── mappers/               # Entity → DTO mappers
│   │
│   ├── services/                       # Service configurations
│   │   └── src/
│   │       ├── postgres/               # PostgreSQL module (TypeORM)
│   │       └── redis/                  # Redis module (ioredis)
│   │
│   └── migrations/                     # Database migrations
│       └── src/
│           ├── api-gateway/            # Auth DB migrations
│           ├── platform/              # Platform DB migrations
│           ├── invoices/              # Invoices DB migrations
│           └── scripts/               # DataSource configs & DB check utility
│
├── .env.example                        # Environment variable template
├── ecosystem.config.js                 # PM2 cluster configuration
├── nest-cli.json                       # NestJS monorepo configuration
├── package.json                        # Dependencies & scripts
└── tsconfig.json                      # TypeScript configuration
```

---

## Database Schema

### API Gateway Database (`api_gateway`)

| Entity | Table | Description |
|--------|-------|-------------|
| `RefreshTokenEntity` | `refresh_tokens` | JWT refresh tokens for session management |

### Platform Database (`platform`)

| Entity | Table | Description |
|--------|-------|-------------|
| `UserEntity` | `users` | User accounts with credentials and status |
| `UserRoleEntity` | `user_roles` | User-role mapping (many-to-many) |
| `ProductsEntity` | `products` | Product catalog with SKU, stock levels, pricing |
| `ProductNamesEntity` | `product_names` | Multi-language product names |
| `ProductUnitsEntity` | `product_units` | Units of measure (kg, box, piece, etc.) |
| `ProductsHistoryEntity` | `products_history` | Versioned product edit history (max 10) |
| `ProductUnitsHistoryEntity` | `product_units_history` | Versioned unit edit history |
| `ProductStockHistoryEntity` | `product_stock_history` | Audit trail for all stock changes |

### Invoices Database (`invoices`)

| Entity | Table | Description |
|--------|-------|-------------|
| `ImportInvoiceEntity` | `import_invoice` | Import invoices (draft → confirmed) |
| `ImportInvoiceProductsEntity` | `import_invoice_products` | Line items for import invoices |
| `ReturnImportInvoiceEntity` | `return_import_invoice` | Return invoices against imports |
| `ReturnImportInvoiceProductsEntity` | `return_import_invoice_products` | Line items for return import invoices |
| `SellingInvoiceEntity` | `selling_invoice` | Sales invoices (auto-confirmed) |
| `SellingInvoiceProductsEntity` | `selling_invoice_products` | Line items for selling invoices |
| `ReturnSellingInvoiceEntity` | `return_selling_invoice` | Customer return invoices |
| `ReturnSellingInvoiceProductsEntity` | `return_selling_invoice_products` | Line items for return selling invoices |
| `StockAdjustmentInvoiceEntity` | `stock_adjustment_invoice` | Manual stock adjustments |
| `StockAdjustmentInvoiceProductsEntity` | `stock_adjustment_invoice_products` | Line items for stock adjustments |

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
git clone https://github.com/your-username/seikyu-project-refactor.git
cd seikyu-project-refactor
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
# PostgreSQL — 3 separate databases
DB_HOST_API_GATEWAY=localhost
DB_PORT_API_GATEWAY=5432
DB_USERNAME_API_GATEWAY=postgres
DB_PASSWORD_API_GATEWAY=your_password
DB_DATABASE_API_GATEWAY=api_gateway

DB_HOST_PLATFORM=localhost
DB_PORT_PLATFORM=5432
DB_USERNAME_PLATFORM=postgres
DB_PASSWORD_PLATFORM=your_password
DB_DATABASE_PLATFORM=platform

DB_HOST_INVOICES=localhost
DB_PORT_INVOICES=5432
DB_USERNAME_INVOICES=postgres
DB_PASSWORD_INVOICES=your_password
DB_DATABASE_INVOICES=invoices

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Microservices ports
API_GATEWAY_HOST=localhost
API_GATEWAY_PORT=4000
PLATFORM_SERVICE_HOST=localhost
PLATFORM_SERVICE_PORT=4001
INVOICES_SERVICE_HOST=localhost
INVOICES_SERVICE_PORT=4002

# JWT secrets (MUST change in production)
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret

# PM2 thread configuration
API_GATEWAY_MAX_THREADS=4
PLATFORM_MAX_THREADS=2
INVOICES_MAX_THREADS=4
```

### 4. Create Databases

Create 3 PostgreSQL databases:

```sql
CREATE DATABASE api_gateway;
CREATE DATABASE platform;
CREATE DATABASE invoices;
```

### 5. Run Migrations

```bash
# Run all migrations at once
npm run migration:run:all

# Or run individually
npm run migration:run:gateway
npm run migration:run:platform
npm run migration:run:invoices
```

### 6. Start All Services (Development)

```bash
# Start all 3 services concurrently in watch mode
npm run start:dev:all
```

Or start each service individually:

```bash
npm run start:dev:gateway    # API Gateway on :4000
npm run start:dev:platform   # Platform Service on :4001
npm run start:dev:invoices   # Invoices Service on :4002
```

### 7. Start with PM2 (Production)

```bash
npm run start:prod:pm2
```

This builds all services and starts them with PM2 in cluster mode. Each service's thread count is configurable via `.env`.

### 8. Access the API

- **API Gateway**: `http://localhost:4000`
- **Swagger Docs**: `http://localhost:4000/api/docs`

### 9. First-Time Setup

Create the first admin account (this endpoint is only available when no admin exists):

```bash
curl -X POST http://localhost:4000/api/v1/admin/first-admin-account \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Admin",
    "last_name": "User",
    "username": "admin",
    "password": "your_secure_password"
  }'
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Auth (`/api/v1/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/login` | Login with credentials | Public |
| POST | `/api/v1/auth/refresh-token` | Refresh access token | Public |
| POST | `/api/v1/auth/logout` | Logout and revoke refresh token | Required |

### Admin (`/api/v1/admin`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/admin/first-admin-account` | Create first admin account | Public |
| POST | `/api/v1/admin/users` | Create a new user | Admin |
| PATCH | `/api/v1/admin/users` | Edit user | Admin |
| GET | `/api/v1/admin/users` | List/search users | Admin |
| GET | `/api/v1/admin/users/:id` | Get user by ID | Admin |
| PATCH | `/api/v1/admin/users/activate/:id` | Activate user | Admin |
| PATCH | `/api/v1/admin/users/deactivate/:id` | Deactivate user | Admin |
| POST | `/api/v1/admin/users/reset-password` | Reset user password | Admin |

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/v1/users` | Get own user info | Authenticated |
| PATCH | `/api/v1/users/change-password` | Change own password | Authenticated |
| GET | `/api/v1/users/search` | Search users | Admin, Manager |

### Products (`/api/v1/products`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/products` | Create a product | Manager |
| PATCH | `/api/v1/products` | Edit a product | Manager |
| GET | `/api/v1/products` | List products | Manager, Admin |
| GET | `/api/v1/products/:id` | Get product by ID | Manager, Admin |
| GET | `/api/v1/products/sku/:sku` | Get product by SKU | Manager, Cashier |
| PATCH | `/api/v1/products/:id/activate` | Activate product | Manager |
| PATCH | `/api/v1/products/:id/deactivate` | Deactivate product | Manager |
| GET | `/api/v1/products/history/:id` | Get product edit history | Admin |
| GET | `/api/v1/products/history/:id/:version` | Get specific version | Admin |
| GET | `/api/v1/products/stock-history/:id` | Get stock change history | Admin, Manager |

### Product Units (`/api/v1/product-units`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/product-units` | Create a unit | Manager |
| PATCH | `/api/v1/product-units` | Edit a unit | Manager |
| GET | `/api/v1/product-units` | List units | Manager, Admin |
| GET | `/api/v1/product-units/:id` | Get unit by ID | Manager, Admin |
| PATCH | `/api/v1/product-units/:id/activate` | Activate unit | Manager |
| PATCH | `/api/v1/product-units/:id/deactivate` | Deactivate unit | Manager |

### Import Invoices (`/api/v1/invoices/import`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/invoices/import/draft` | Create draft import invoice | Manager |
| PATCH | `/api/v1/invoices/import/draft/:id` | Edit draft import invoice | Manager |
| DELETE | `/api/v1/invoices/import/draft/:id` | Delete draft import invoice | Manager |
| PATCH | `/api/v1/invoices/import/:id/confirm` | Confirm import invoice | Manager |
| GET | `/api/v1/invoices/import/:id` | Get import invoice detail | Authenticated |
| GET | `/api/v1/invoices/import` | List import invoices | Authenticated |

### Return Import Invoices (`/api/v1/invoices/return-import`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/invoices/return-import/draft` | Create draft return invoice | Manager |
| PATCH | `/api/v1/invoices/return-import/draft/:id` | Edit draft return invoice | Manager |
| PATCH | `/api/v1/invoices/return-import/:id/confirm` | Confirm return invoice | Manager |
| GET | `/api/v1/invoices/return-import/:id` | Get return invoice detail | Authenticated |
| GET | `/api/v1/invoices/return-import` | List return invoices | Authenticated |

### Selling Invoices (`/api/v1/invoices/selling`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/invoices/selling` | Create selling invoice (auto-confirmed) | Cashier, Manager |
| GET | `/api/v1/invoices/selling/:id` | Get selling invoice detail | Authenticated |
| GET | `/api/v1/invoices/selling` | List selling invoices | Authenticated |

### Return Selling Invoices (`/api/v1/invoices/return-selling`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/invoices/return-selling/draft` | Create draft return invoice | Manager |
| PATCH | `/api/v1/invoices/return-selling/draft/:id` | Edit draft return invoice | Manager |
| PATCH | `/api/v1/invoices/return-selling/:id/confirm` | Confirm return invoice | Manager |
| GET | `/api/v1/invoices/return-selling/:id` | Get return invoice detail | Authenticated |
| GET | `/api/v1/invoices/return-selling` | List return invoices | Authenticated |

### Stock Adjustment Invoices (`/api/v1/invoices/stock-adjustment`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/invoices/stock-adjustment/draft` | Create draft adjustment | Manager |
| PATCH | `/api/v1/invoices/stock-adjustment/draft/:id` | Edit draft adjustment | Manager |
| PATCH | `/api/v1/invoices/stock-adjustment/:id/confirm` | Confirm adjustment | Manager |
| GET | `/api/v1/invoices/stock-adjustment/:id` | Get adjustment detail | Authenticated |
| GET | `/api/v1/invoices/stock-adjustment` | List adjustments | Authenticated |

---

## Available Scripts

### Development

| Script | Description |
|--------|-------------|
| `npm run start:dev:all` | Start all 3 services concurrently in watch mode |
| `npm run start:dev:gateway` | Start API Gateway in watch mode |
| `npm run start:dev:platform` | Start Platform service in watch mode |
| `npm run start:dev:invoices` | Start Invoices service in watch mode |
| `npm run start:debug` | Start API Gateway with Node debugger |
| `npm run start:debug:platform` | Start Platform with Node debugger |
| `npm run start:debug:invoices` | Start Invoices with Node debugger |

### Build & Production

| Script | Description |
|--------|-------------|
| `npm run build` | Build the default project |
| `npm run build:all` | Build all 3 services |
| `npm run start:prod:pm2` | Build all and start with PM2 in cluster mode |

### Testing

| Script | Description |
|--------|-------------|
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage report |
| `npm run test:e2e:platform` | Run Platform e2e tests |
| `npm run test:e2e:gateway` | Run API Gateway e2e tests |
| `npm run test:integration:platform` | Run Platform integration tests |

### Code Quality

| Script | Description |
|--------|-------------|
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Run Prettier formatter |

### Database Migrations

> Migration `create` and `generate` commands require the `MIGRATION_NAME` environment variable.

**Windows CMD:**
```bash
set MIGRATION_NAME=AddNewTable && npm run migration:create:platform
set MIGRATION_NAME=AddNewTable && npm run migration:generate:platform
```

**PowerShell:**
```powershell
$env:MIGRATION_NAME="AddNewTable"; npm run migration:create:platform
$env:MIGRATION_NAME="AddNewTable"; npm run migration:generate:platform
```

**Linux / macOS:**
```bash
MIGRATION_NAME=AddNewTable npm run migration:create:platform
MIGRATION_NAME=AddNewTable npm run migration:generate:platform
```

| Script | Description |
|--------|-------------|
| `npm run migration:run:all` | Run all pending migrations for all 3 databases |
| **API Gateway** | |
| `npm run migration:create:gateway` | Create empty migration file |
| `npm run migration:generate:gateway` | Auto-generate migration from entity changes |
| `npm run migration:run:gateway` | Run pending migrations |
| `npm run migration:revert:gateway` | Revert the last migration |
| `npm run migration:show:gateway` | Show migration status |
| **Platform** | |
| `npm run migration:create:platform` | Create empty migration file |
| `npm run migration:generate:platform` | Auto-generate migration from entity changes |
| `npm run migration:run:platform` | Run pending migrations |
| `npm run migration:revert:platform` | Revert the last migration |
| `npm run migration:show:platform` | Show migration status |
| **Invoices** | |
| `npm run migration:create:invoices` | Create empty migration file |
| `npm run migration:generate:invoices` | Auto-generate migration from entity changes |
| `npm run migration:run:invoices` | Run pending migrations |
| `npm run migration:revert:invoices` | Revert the last migration |
| `npm run migration:show:invoices` | Show migration status |

### Utility

| Script | Description |
|--------|-------------|
| `npm run db:check` | Check database connection status |

---

## PM2 Production Deployment

The project includes a PM2 ecosystem configuration for production deployment with cluster mode:

```javascript
// ecosystem.config.js
{
  apps: [
    { name: 'api-gateway',  instances: API_GATEWAY_MAX_THREADS, max_memory_restart: '1G' },
    { name: 'platform',     instances: PLATFORM_MAX_THREADS,    max_memory_restart: '1G' },
    { name: 'invoices',     instances: INVOICES_MAX_THREADS,    max_memory_restart: '1G' },
  ]
}
```

Thread counts are configurable via `.env`:

```env
API_GATEWAY_MAX_THREADS=4
PLATFORM_MAX_THREADS=2
INVOICES_MAX_THREADS=4
```

Logs are stored in `./logs/`:
- `gateway-out.log` / `gateway-error.log`
- `platform-out.log` / `platform-error.log`
- `invoices-out.log` / `invoices-error.log`

---

## Error Code Reference

All errors follow a structured error code system for consistent API responses:

| Range | Domain | Examples |
|-------|--------|---------|
| `1xxx` | Users | `1001` — User already exists |
| `2xxx` | Authentication | `2001` — Username or password incorrect |
| `3xxx` | Products & Units | `3007` — Product not found |
| `4xxx` | Invoices | `4001` — Invoice not found |
| `9xxx` | System | `9999` — Unknown error |

---

## License

This project is **UNLICENSED** — private and internal use only. Not intended for public use or redistribution.
