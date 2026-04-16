# RMS - Agent Guide

## Project Overview
Next.js 16 + React 19 repair management system for phone repair shops. Multi-store architecture with role-based access (admin/staff/technician).

## Critical Constraints

### Next.js 16 - Breaking Changes
This is **NOT** the Next.js you know. APIs, conventions, and file structure differ from training data. Always consult `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.

### Package Manager: Bun
- Use `bun` for all commands, not npm/yarn
- Install: `bun install`
- Run: `bun run dev`, `bun run build`
- Prisma: `bunx prisma migrate dev`

### Database: Prisma 7 with Custom Output
- Schema: `prisma/schema.prisma`
- Generated client: `lib/generated/prisma/` (NOT node_modules)
- Always run after schema changes: `bunx prisma generate`
- Dev DB: PostgreSQL via `docker-compose up -d`

## Developer Commands

```bash
# Development
bun run dev                    # Start dev server (port 3000)
bun run build                  # Production build
bun run lint                   # ESLint check

# Database
bunx prisma migrate dev        # Run migrations + generate client
bunx prisma generate           # Generate Prisma client only
bun run db:seed                # Seed test data
bun run db:reset-data          # Reset data (keep schema)

# Docker
docker-compose up -d           # Start PostgreSQL
```

## Architecture

### Route Structure
```
app/
├── auth/                      # Login/register (public)
├── dashboard/
│   ├── page.tsx              # Admin: store list
│   ├── admin/                # Admin routes (inventory, karyawan, toko)
│   ├── staff/                # Staff routes (services, sparepart)
│   └── technician/           # Technician routes (tasks)
└── api/auth/[...all]/        # Better Auth API
```

### Server Actions (no API routes for app logic)
- `actions/dashboard.ts` - Service CRUD, dashboard data
- `actions/inventory.ts` - Spareparts, pricelists
- `actions/toko.ts` - Store management
- `actions/staff.ts` - Staff-specific operations
- `actions/user.ts` - User management

### Key Libs
- `lib/auth.ts` - Better Auth config
- `lib/prisma.ts` - Prisma client with adapter
- `lib/blob.ts` - Vercel Blob utilities

## Authentication
- **Provider**: Better Auth with email/password + Google OAuth
- **Roles**: `admin`, `staff`, `technician`
- **Store isolation**: Users have `tokoId` (null for admin)
- **Session**: DB-backed via Prisma

## Data Model Highlights
- `Toko` - Store/branch (data isolation boundary)
- `Service` - Repair tickets with status workflow: `received` → `repairing` → `done` → `picked_up`
- `HpCatalog` - Global device catalog (shared across stores)
- `Sparepart` - Store-specific inventory with compatibility links
- `ServiceItem` - Polymorphic: sparepart or service reference

## Conventions
- **Imports**: `@/*` maps to root (`@/components/ui/button`)
- **Icons**: Remix Icon (`@remixicon/react`)
- **UI**: shadcn/ui (base-luma style) in `components/ui/`
- **Styling**: Tailwind CSS 4 (no config file, uses CSS variables)
- **TypeScript**: Strict mode, no emit (types checked via build)

## Testing
No test framework configured. Manual verification via UI.

## Gotchas
1. **Prisma import path**: Always import from `@/lib/generated/prisma`, never `@prisma/client`
2. **DEV_MODE env**: Check `process.env.DEV_MODE` for local vs prod behavior
3. **Bun scripts**: `db:seed` and `db:reset-data` use `tsx`, not `ts-node`
4. **Allowed origins**: `next.config.ts` has `allowedDevOrigins` for IP-based dev access
5. **React Compiler**: Enabled in `next.config.ts` (babel-plugin-react-compiler)

## Existing Instructions
- `CLAUDE.md` - Legacy, minimal content
- `node_modules/next/dist/docs/` - Authoritative Next.js 16 docs
