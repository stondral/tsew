# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Stondemporium** - A multi-vendor e-commerce platform built with Next.js 15 (App Router) and Payload CMS 3.x.

## Development Commands

```bash
# Start dev server (uses Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

## Environment Variables

Required in `.env` or `.env.local`:
- `DATABASE_URL` - MongoDB connection string
- `PAYLOAD_SECRET` - Secret for Payload authentication
- `NEXT_PUBLIC_PAYLOAD_URL` - Base URL for API calls (e.g., `http://localhost:3000`)
- `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` - Cloudflare R2 storage

## Architecture

### Route Groups (App Router)

The app uses Next.js route groups to separate concerns:

- `app/(frontend)/` - Public storefront (products, cart)
- `app/(payload)/` - Payload CMS admin panel and API routes

The root `app/layout.tsx` wraps everything in Payload's `RootLayout` for CMS functionality. The frontend layout at `app/(frontend)/layout.tsx` provides `AuthProvider` and `CartProvider` context.

### Payload CMS Collections

Collections are defined in `collections/` with role-based access control:

- **Users** - Auth-enabled, roles: `admin`, `seller`, `user`
- **Products** - Multi-vendor products with approval workflow (`draft` → `pending` → `live`/`rejected`)
- **Orders** - Order management with Razorpay integration
- **Categories**, **Media**, **Addresses**

Key pattern: Sellers can only access their own products; admins see all. Products require admin approval to go live.

### Data Flow

1. **Server Components** fetch data via `lib/payload/` functions (e.g., `getFeaturedProducts`)
2. **Domain models** in `lib/models/domain/` transform Payload responses to typed frontend objects
3. **Media URLs** are resolved through `lib/media.ts` → `resolveMediaUrl()` handles R2/local paths

### Client State

- **AuthContext** (`components/auth/AuthContext.tsx`) - JWT auth via Payload, stores token in localStorage
- **CartContext** (`components/cart/CartContext.tsx`) - Client-side cart persisted to localStorage

### UI Components

Uses shadcn/ui (new-york style) with Tailwind CSS. Components in `components/ui/` are generated via:
```bash
npx shadcn@latest add <component>
```

Path aliases: `@/components`, `@/lib`, `@/lib/utils` (for `cn()` helper)

## Key Patterns

### Product Status Workflow
- Sellers create products in `draft` or `pending` status
- Only admins can change status to `live` (making products visible on storefront)
- Featured products auto-expire via `featuredUntil` date (checked on read)

### Access Control Pattern
All collections use inline access functions checking `req.user.role`. Admin has full access; sellers have scoped access to their own data; users can only access their own profile/orders.

### Cart Operations
Cart operates client-side only. Items reference `productId` and optional `variantId`. Hydration from localStorage happens in `CartProvider` on mount.
