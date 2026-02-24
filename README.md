# Seikyu Warehouse Management Project
> A microservices-based inventory and invoice management system built with NestJS.
> Designed for businesses to manage import invoices, return invoices, products, and user roles with a clean, scalable architecture.

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
- 📦 **Import Invoices** — Record goods received from vendors into the warehouse
- 🔄 **Return Import Invoices** — Handle returns of defective or incorrect goods back to vendors
- � **Selling Invoices** — Record goods sold to customers
- � **Stock Adjustments** — Adjust inventory levels manually
- 🏷️ **Product & Unit Management** — Manage product catalog, SKUs, and inventory stock levels
- 👥 **User & Role Management** — Control access with role-based permissions (Admin, Manager, Cashier)

This system is intended for **warehouse managers and administrators** to maintain accurate stock records, traceability, and audit trails for all inventory movements.

> ⚠️ This is a private, internal project. Not intended for public use or redistribution.

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
└──────────┬──────────────────────────────────┬───────────────────┘
           │ TCP (:4001)                      │ TCP (:4002)
           ▼                                  ▼
┌─────────────────────────┐    ┌──────────────────────────────────┐
│   Platform Service      │    │      Invoices Service            │
│   (:4001)               │    │      (:4002)                     │
│                         │    │                                  │
│  • Products CRUD        │    │  • Import Invoices               │
│  • Product Units        │    │  • Return Import Invoices        │
│  • Stock Management     │    │  • Selling Invoices              │
│  • Product History      │    │  • Invoice Helper                │
│  • User Management      │    │                                  │
│  • Admin Operations     │    │                                  │
└──────────┬──────────────┘    └──────────────┬───────────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────────┐    ┌──────────────────────────────────┐
│   PostgreSQL (platform) │    │   PostgreSQL (invoices)          │
└─────────────────────────┘    └──────────────────────────────────┘
                          │
                    ┌─────▼─────┐
                    │   Redis   │
                    │  (:6400)  │
                    └───────────┘
```

### Microservices

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| **API Gateway** | `4000` | `api_gateway` | REST API entry point, JWT auth, Swagger docs, request validation |
| **Platform** | `4001` | `platform` | Products, product units, users, stock management, history tracking |
| **Invoices** | `4002` | `invoices` | Import, return import, and selling invoice lifecycle management |

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
| **Task Scheduling** | @nestjs/schedule |
| **Health Checks** | @nestjs/terminus |

---

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with **access tokens** and **refresh tokens**
- Refresh token rotation and revocation stored in PostgreSQL
- Role-Based Access Control (RBAC) with 3 roles: **Admin**, **Manager**, **Cashier**
- Custom decorators: `@Roles()`, `@Public()`, `@CurrentUser()`
- Custom guards: `JwtGuard`, `RolesGuard`

### 🏷️ Product Management
- Full CRUD for products and product units
- SKU-based product identification
- Multi-name support for products (e.g., Vietnamese + English names)
- Inventory stock tracking with stock status (`in_stock`, `low_stock`, `out_of_stock`)
- Product activation/deactivation
- **History versioning** — Every product/unit edit creates a versioned history snapshot (max 10 versions with auto-cleanup)
- **Stock history** — Audit trail for every stock change with action type and reference

### 📦 Invoice Management
- **Import Invoices** — Draft → Confirm workflow with auto-ID generation (format: `IYY-XXXXXXX`)
  - Products linked to import invoices with quantity, price, and discount
  - On confirmation: inventory stock automatically updated
  - Tracks return count and status (`draft`, `confirmed`, `partially_returned`, `returned`)

- **Return Import Invoices** — Return goods back to vendors against an existing import invoice
  - Validates returned quantity against original import quantities
  - Updates import invoice return count and status
  - Adjusts inventory stock on confirmation

- **Selling Invoices** — Record goods sold with product-level and invoice-level discounts
  - Auto-confirmed on creation (no draft state)
  - Supports percentage-based discounts

### 👥 User Management
- Admin-managed user accounts with role assignment
- First admin account creation endpoint
- User activation/deactivation
- Password management (change password, admin reset)
- User search with filtering and pagination

### 🛡️ Error Handling
- **Centralized error code system** — 90+ unique error codes organized by domain (users `1xxx`, auth `2xxx`, products `3xxx`, invoices `4xxx`)
- **Custom exception filter** — Consistent error response format across all endpoints
- **RPC exception filter** — Handles errors in TCP microservice communication
- **`@HandleServiceError` decorator** — Auto-wraps service methods with try/catch and contextual error codes

### 📄 API Documentation
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
│   │       │   ├── importInvoices/     # Import invoice gateway endpoints
│   │       │   ├── returnImportInvoices/ # Return invoice gateway endpoints
│   │       │   └── sellingInvoices/    # Selling invoice gateway endpoints
│   │       └── platform/              # Platform proxy controllers
│   │
│   ├── platform/                       # Platform Microservice (TCP :4001)
│   │   └── src/
│   │       ├── products/               # Product & product unit management
│   │       │   ├── controllers/        # MessagePattern handlers
│   │       │   ├── entities/           # Product, ProductUnit, History entities
│   │       │   ├── repositories/       # Database operations
│   │       │   └── services/           # Business logic
│   │       └── users/                  # User & admin management
│   │           ├── controllers/        # MessagePattern handlers
│   │           ├── entities/           # User, UserRole entities
│   │           ├── repositories/       # Database operations
│   │           └── services/           # Business logic
│   │
│   └── invoices/                       # Invoices Microservice (TCP :4002)
│       └── src/
│           ├── importInvoices/         # Import invoice module
│           │   ├── controllers/        # MessagePattern handlers
│           │   ├── entities/           # ImportInvoice, ImportInvoiceProducts
│           │   ├── repositories/       # Database operations
│           │   └── services/           # Business logic
│           ├── returnImportInvoices/   # Return import invoice module
│           ├── sellingInvoices/        # Selling invoice module
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
│   │       └── mappers/               # Entity ↔ DTO mappers
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
│           └── invoices/              # Invoices DB migrations
│
├── .env                                # Environment variables
├── nest-cli.json                       # NestJS monorepo configuration
├── package.json                        # Dependencies & scripts
└── tsconfig.json                      # TypeScript configuration
```

---

## Database Schema

### API Gateway Database (`api_gateway`)
| Entity | Description |
|--------|-------------|
| `RefreshTokenEntity` | Stores JWT refresh tokens for session management |

### Platform Database (`platform`)
| Entity | Description |
|--------|-------------|
| `UserEntity` | User accounts with credentials |
| `UserRoleEntity` | User-role mapping (many-to-many) |
| `ProductsEntity` | Product catalog with SKU, stock, pricing |
| `ProductNamesEntity` | Multi-language product names |
| `ProductUnitsEntity` | Product units (e.g., kg, box, piece) |
| `ProductsHistoryEntity` | Versioned product edit history |
| `ProductUnitsHistoryEntity` | Versioned unit edit history |
| `ProductStockHistoryEntity` | Audit trail for stock changes |

### Invoices Database (`invoices`)
| Entity | Description |
|--------|-------------|
| `ImportInvoiceEntity` | Import invoices (draft → confirmed) |
| `ImportInvoiceProductsEntity` | Products within an import invoice |
| `ReturnImportInvoiceEntity` | Return invoices against imports |
| `ReturnImportInvoiceProductsEntity` | Products within a return invoice |
| `SellingInvoiceEntity` | Selling invoices (auto-confirmed) |
| `SellingInvoiceProductsEntity` | Products within a selling invoice |

---

## Getting Started

### Prerequisites
- **Node.js** >= 18.x
- **PostgreSQL** >= 15
- **Redis** server
- **npm** >= 9.x

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
Create a `.env` file in the project root (or modify the existing one):

```env
# PostgreSQL Configuration
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

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6400
REDIS_PASSWORD=
REDIS_DB=0

# Microservices Ports
API_GATEWAY_HOST=localhost
API_GATEWAY_PORT=4000

PLATFORM_SERVICE_HOST=localhost
PLATFORM_SERVICE_PORT=4001

INVOICES_SERVICE_HOST=localhost
INVOICES_SERVICE_PORT=4002

# JWT Secrets
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
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

### 6. Start All Services
```bash
# Start all 3 services concurrently (development mode)
npm run start:dev:all
```

Or start each service individually:
```bash
npm run start:dev:gateway    # API Gateway on :4000
npm run start:dev:platform   # Platform Service on :4001
npm run start:dev:invoices   # Invoices Service on :4002
```

### 7. Access the API
- **API Gateway**: `http://localhost:4000`
- **Swagger Docs**: `http://localhost:4000/api/docs`

---

## Available Scripts

### Development

| Script | Description |
|--------|-------------|
| `npm run start:dev:all` | Start all 3 services concurrently in watch mode |
| `npm run start:dev:gateway` | Start API Gateway in watch mode |
| `npm run start:dev:platform` | Start Platform service in watch mode |
| `npm run start:dev:invoices` | Start Invoices service in watch mode |
| `npm run build` | Build the project |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run test` | Run unit tests |
| `npm run test:e2e:platform` | Run Platform e2e tests |
| `npm run test:e2e:gateway` | Run API Gateway e2e tests |

### Migrations

> Migration `create` and `generate` commands require the `MIGRATION_NAME` environment variable.

**Usage (Windows CMD):**
```bash
set MIGRATION_NAME=AddProductTable && npm run migration:create:platform
set MIGRATION_NAME=AddProductTable && npm run migration:generate:platform
```

**Usage (PowerShell):**
```powershell
$env:MIGRATION_NAME="AddProductTable"; npm run migration:create:platform
$env:MIGRATION_NAME="AddProductTable"; npm run migration:generate:platform
```

**Usage (Linux / macOS):**
```bash
MIGRATION_NAME=AddProductTable npm run migration:create:platform
MIGRATION_NAME=AddProductTable npm run migration:generate:platform
```

| Script | Description |
|--------|-------------|
| `npm run migration:run:all` | Run all pending migrations for all 3 databases |
| **API Gateway** | |
| `npm run migration:create:gateway` | Create an empty migration file for API Gateway |
| `npm run migration:generate:gateway` | Auto-generate migration from entity changes for API Gateway |
| `npm run migration:run:gateway` | Run pending migrations for API Gateway |
| `npm run migration:revert:gateway` | Revert the last migration for API Gateway |
| `npm run migration:show:gateway` | Show all migrations and their status for API Gateway |
| **Platform** | |
| `npm run migration:create:platform` | Create an empty migration file for Platform |
| `npm run migration:generate:platform` | Auto-generate migration from entity changes for Platform |
| `npm run migration:run:platform` | Run pending migrations for Platform |
| `npm run migration:revert:platform` | Revert the last migration for Platform |
| `npm run migration:show:platform` | Show all migrations and their status for Platform |
| **Invoices** | |
| `npm run migration:create:invoices` | Create an empty migration file for Invoices |
| `npm run migration:generate:invoices` | Auto-generate migration from entity changes for Invoices |
| `npm run migration:run:invoices` | Run pending migrations for Invoices |
| `npm run migration:revert:invoices` | Revert the last migration for Invoices |
| `npm run migration:show:invoices` | Show all migrations and their status for Invoices |

---

## API Endpoints Overview

### Auth (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login with credentials | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout and revoke refresh token | Yes |

### Users (`/api/users`)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/users/first-admin` | Create first admin account | Public |
| POST | `/api/users` | Create a new user | Admin |
| GET | `/api/users` | List all users | Admin, Manager |
| GET | `/api/users/:id` | Get user by ID | Admin, Manager |
| PATCH | `/api/users/:id` | Edit user | Admin |
| PATCH | `/api/users/:id/activate` | Activate user | Admin |
| PATCH | `/api/users/:id/deactivate` | Deactivate user | Admin |

### Products (`/api/products`)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/products` | Create a product | Admin, Manager |
| GET | `/api/products` | List products | All |
| GET | `/api/products/:id` | Get product by ID | All |
| PATCH | `/api/products/:id` | Edit product | Admin, Manager |
| PATCH | `/api/products/:id/activate` | Activate product | Admin, Manager |
| PATCH | `/api/products/:id/deactivate` | Deactivate product | Admin, Manager |

### Import Invoices (`/api/invoices/import`)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/invoices/import` | Create draft import invoice | Admin, Manager |
| PATCH | `/api/invoices/import/:id` | Edit draft import invoice | Admin, Manager |
| DELETE | `/api/invoices/import` | Delete draft import invoices | Admin, Manager |
| PATCH | `/api/invoices/import/:id/confirm` | Confirm import invoice | Admin, Manager |
| GET | `/api/invoices/import` | List import invoices | Admin, Manager |
| GET | `/api/invoices/import/:id` | Get import invoice by ID | Admin, Manager |

### Return Import Invoices (`/api/invoices/return-import`)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/invoices/return-import` | Create draft return invoice | Admin, Manager |
| PATCH | `/api/invoices/return-import/:id` | Edit draft return invoice | Admin, Manager |
| DELETE | `/api/invoices/return-import` | Delete draft return invoices | Admin, Manager |
| PATCH | `/api/invoices/return-import/:id/confirm` | Confirm return invoice | Admin, Manager |
| GET | `/api/invoices/return-import` | List return invoices | Admin, Manager |
| GET | `/api/invoices/return-import/:id` | Get return invoice by ID | Admin, Manager |

### Selling Invoices (`/api/invoices/selling`)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/invoices/selling` | Create selling invoice | All |
| GET | `/api/invoices/selling` | List selling invoices | Admin, Manager |
| GET | `/api/invoices/selling/:id` | Get selling invoice by ID | Admin, Manager |

---

## Error Code Reference

All errors follow a structured error code system:

| Range | Domain | Example |
|-------|--------|---------|
| `1xxx` | Users | `1001` — User already exists |
| `2xxx` | Authentication | `2001` — Username or password incorrect |
| `3xxx` | Products & Units | `3007` — Product not found |
| `4xxx` | Invoices | `4001` — Invoice not found |
| `9xxx` | System | `9999` — Unknown error |

Service-level error codes follow the pattern `X1XX` where the first digit indicates the domain and `1XX` is the service operation.

---

## License

This project is **UNLICENSED** — private and internal use only. Not intended for public use or redistribution.
