# Next.js Inventory Frontend Architecture

This document describes a clean and scalable frontend architecture for
an inventory dashboard built with:

-   Next.js
-   Axios
-   Zustand
-   React Hook Form
-   Zod

------------------------------------------------------------------------

# Directory Structure

    src
    │
    ├── app                         # Next.js App Router
    │   │
    │   ├── layout.tsx              # Root layout (ThemeProvider, AuthInitializer)
    │   ├── page.tsx                # Root redirect → /login
    │   │
    │   ├── login
    │   │   └── page.tsx            # Login page
    │   │
    │   └── dashboard
    │       ├── layout.tsx          # Dashboard layout (sidebar, header)
    │       └── page.tsx            # Dashboard home
    │
    ├── components                  # Reusable UI components
    │   │
    │   ├── forms
    │   │   └── login-form.tsx
    │   │
    │   ├── auth-initializer.tsx    # Loads token from localStorage on startup
    │   │
    │   └── theme-toggle.tsx
    │
    ├── services                    # API communication layer
    │   │
    │   ├── api-client.ts           # Axios instance + interceptors
    │   │
    │   └── auth.service.ts         # Login API calls
    │
    ├── store                       # Zustand global state
    │   │
    │   └── auth.store.ts
    │
    ├── middleware.ts               # Route protection
    │
    ├── validators                  # Zod schemas (optional but scalable)
    │   │
    │   └── auth.schema.ts
    │
    └── styles
        └── globals.css

------------------------------------------------------------------------

# Authentication Flow

    Login Form
       │
       ▼
    auth.service.ts
       │
       ▼
    api-client.ts (Axios)
       │
       ▼
    Backend API
       │
       ▼
    Response (token + user)
       │
       ▼
    auth.store.ts (Zustand)
       │
       ├── localStorage (API auth)
       └── cookie (middleware)
       │
       ▼
    Redirect /dashboard

------------------------------------------------------------------------

# Route Protection Flow

    User visits /dashboard
           │
           ▼
    middleware.ts
           │
           ├── token exists → allow
           │
           └── no token → redirect /login

------------------------------------------------------------------------

# App Startup Flow

    App loads
       │
       ▼
    AuthInitializer
       │
       ▼
    auth.store.loadUserFromStorage()
       │
       ▼
    token restored from localStorage

------------------------------------------------------------------------

# Feature-Based Growth (Future)

As the project grows, the structure can evolve into a feature-based
architecture:

    src
    ├── features
    │   ├── auth
    │   ├── products
    │   ├── warehouse
    │   ├── purchase-orders
    │   └── invoices

Each feature may contain:

    feature
    ├── components
    ├── services
    ├── schemas
    ├── hooks

This mirrors a backend module structure and keeps the frontend scalable.

------------------------------------------------------------------------

# Current Authentication Components

Your system currently includes:

-   Login page
-   Login form
-   Auth service
-   Axios API client
-   Zustand auth store
-   Auth initializer
-   Route middleware

This forms a complete authentication system suitable for modern
dashboards.

------------------------------------------------------------------------

# Notes

-   Store access tokens in localStorage for API requests.
-   Use cookies only for middleware route protection.
-   Keep API communication inside the services layer.
-   Use Zustand for global auth state.
