# RMS - Repair Management System

A comprehensive **Repair Management System** built with Next.js 16, designed for phone repair shops to manage services, inventory, spare parts, and multi-store operations.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-white?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)
- [API & Actions](#api--actions)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Deployment](#deployment)

## ✨ Features

### Service Management
- Track repair services from intake to completion
- Service status workflow: `received` → `repairing` → `done` → `picked_up`
- Assign technicians to service tasks
- Service history and logging
- WhatsApp notification tracking

### Inventory Control
- **Spareparts Management**: Create, update, delete spare parts per store
- **Service Pricelists**: Define service pricing per store
- **HP Catalog**: Global device catalog with brand-model relationships
- **Sparepart Compatibility**: Link spare parts to specific device models

### Multi-Store Support
- **Toko (Store)** management with independent data isolation
- Each store has its own users, spare parts, services, and pricelists
- Global brand and HP catalog shared across all stores
- Admin overview of all stores

### User Management
- Role-based access control (Admin, Staff, Technician)
- Email/password and Google OAuth authentication
- User assignment to specific stores

### Dashboard & Analytics
- Real-time service statistics
- Revenue tracking with payment status
- Recent services overview
- Store performance metrics

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4 |
| **Components** | shadcn/ui (base-luma) |
| **Icons** | Remix Icon |
| **Database ORM** | Prisma 7 |
| **Database** | PostgreSQL 15 |
| **Authentication** | Better Auth |
| **Theme** | next-themes |
| **Charts** | Recharts |
| **Package Manager** | Bun |

## 📁 Project Structure

```
rms-nextjs/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── auth/[...all]/        # Better Auth API routes
│   ├── auth/                     # Authentication pages
│   │   ├── page.tsx              # Login/Register page
│   │   └── loading.tsx           # Auth loading state
│   └── dashboard/                # Protected dashboard routes
│       ├── page.tsx              # Admin: Toko list
│       ├── admin/                # Admin dashboard
│       │   ├── page.tsx          # Store overview
│       │   ├── inventory/        # Inventory management
│       │   └── karyawan/         # Employee management
│       ├── staff/                # Staff dashboard
│       │   └── services/         # Service creation & list
│       └── technician/           # Technician dashboard
│           └── tasks/            # Task management
├── actions/                      # Server Actions
│   ├── dashboard.ts              # Dashboard data fetching
│   ├── inventory.ts              # Sparepart & pricelist CRUD
│   ├── toko.ts                   # Store management
│   └── user.ts                   # User management
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── sidebar/                  # Navigation sidebars (role-based)
│   ├── add-service-form.tsx      # Service creation form
│   ├── add-user-form.tsx         # User creation form
│   ├── auth-card.tsx             # Auth form component
│   ├── toko-*.tsx                # Store-related components
│   └── user-*.tsx                # User-related components
├── lib/
│   ├── auth.ts                   # Better Auth configuration
│   ├── auth-client.ts            # Auth client for React
│   ├── get-session.ts            # Session utilities
│   ├── prisma.ts                 # Prisma client setup
│   ├── utils.ts                  # Utility functions
│   └── generated/prisma/         # Generated Prisma types
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Database seeding
├── hooks/
│   └── use-mobile.ts             # Mobile detection hook
└── docker-compose.yml            # PostgreSQL development setup
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL 15+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rms-nextjs
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up the database**
   
   Using Docker (recommended for development):
   ```bash
   docker-compose up -d
   ```
   
   Or connect to an existing PostgreSQL instance.

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rms_dev"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

5. **Run database migrations**
   ```bash
   bunx prisma migrate dev
   # or
   npx prisma migrate dev
   ```

6. **Seed the database** (optional)
   ```bash
   bun run db:seed
   # or
   npm run db:seed
   ```
   
   This creates default users:
   - **Admin**: `admin@example.com` / `admin123`
   - **Staff**: `staff@example.com` / `staff123`
   - **Technician**: `technician@example.com` / `technician123`

7. **Start the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

8. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

### Core Models

| Model | Description |
|-------|-------------|
| `Toko` | Store/branch location |
| `User` | System users with role-based access |
| `Service` | Repair service tickets |
| `Sparepart` | Inventory items per store |
| `ServicePricelist` | Service pricing per store |
| `Brand` | Global device brands |
| `HpCatalog` | Global device models |
| `SparepartCompatibility` | Links parts to compatible devices |
| `ServiceItem` | Items used in a service (parts or services) |
| `Invoice` | Billing records |
| `ServiceLog` | Audit trail for service changes |
| `NotificationLog` | Notification history |

### Key Relationships

- **Toko** has many **Users**, **Spareparts**, **ServicePricelists**, and **Services**
- **User** belongs to a **Toko** (nullable for admin)
- **Service** references **Toko**, **HpCatalog**, **User** (creator & technician)
- **HpCatalog** belongs to a **Brand** (global, not toko-specific)
- **Sparepart** can be compatible with multiple **HpCatalog** entries

## 👥 User Roles

### Admin
- Access to all stores and data
- Create and manage stores (Toko)
- View aggregated dashboard across all stores
- Assign users to stores

### Staff
- Create new service tickets
- Manage customer information
- View all services in their assigned store
- Add users to their store

### Technician
- View available services in their store
- Accept/claim service tasks
- Update service status
- Add spare parts and service items to repairs
- Mark services as complete

## 📡 API & Actions

### Server Actions

#### Dashboard Actions ([`actions/dashboard.ts`](actions/dashboard.ts:1))
- [`getTokoDashboardData()`](actions/dashboard.ts:53) - Get store dashboard statistics
- [`getAllTokoSummary()`](actions/dashboard.ts:228) - Get all stores summary (admin)
- [`getStaffDashboardData()`](actions/dashboard.ts:344) - Get staff-specific dashboard
- [`getTechnicianDashboardData()`](actions/dashboard.ts:886) - Get technician dashboard
- [`createService()`](actions/dashboard.ts:602) - Create new service ticket
- [`searchHpCatalogs()`](actions/dashboard.ts:677) - Search device catalog
- [`technicianTakeService()`](actions/dashboard.ts:1056) - Assign service to technician
- [`updateServiceStatus()`](actions/dashboard.ts:1228) - Update service workflow status

#### Inventory Actions ([`actions/inventory.ts`](actions/inventory.ts:1))
- [`getSpareparts()`](actions/inventory.ts:69) - List spare parts for a store
- [`createSparepart()`](actions/inventory.ts:117) - Add new spare part
- [`updateSparepart()`](actions/inventory.ts:171) - Update spare part
- [`deleteSparepart()`](actions/inventory.ts:240) - Remove spare part
- [`getServicePricelists()`](actions/inventory.ts:294) - List service pricelists
- [`createServicePricelist()`](actions/inventory.ts:329) - Add service pricing
- [`updateServicePricelist()`](actions/inventory.ts:382) - Update pricing
- [`deleteServicePricelist()`](actions/inventory.ts:450) - Remove pricing

#### Store Actions ([`actions/toko.ts`](actions/toko.ts:1))
- [`getAllToko()`](actions/toko.ts:36) - List stores (filtered by user role)
- [`getTokoById()`](actions/toko.ts:87) - Get store by ID
- [`createToko()`](actions/toko.ts:118) - Create new store
- [`updateToko()`](actions/toko.ts:159) - Update store
- [`deleteToko()`](actions/toko.ts:209) - Delete store

#### User Actions ([`actions/user.ts`](actions/user.ts:1))
- [`getUsersByToko()`](actions/user.ts:29) - List users by store
- [`addUserToToko()`](actions/user.ts:57) - Add user to store
- [`searchUserByEmail()`](actions/user.ts:140) - Find existing user
- [`assignUserToToko()`](actions/user.ts:178) - Assign user to store
- [`removeUserFromToko()`](actions/user.ts:245) - Remove user from store

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXT_PUBLIC_APP_URL` | Application base URL | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | For Google login |

## 🧑‍💻 Development

### Available Scripts

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run ESLint
bun run lint

# Seed database
bun run db:seed

# Generate Prisma client
bunx prisma generate

# Run database migrations
bunx prisma migrate dev
```

### Code Style

- **ESLint**: Configured with Next.js recommended rules
- **TypeScript**: Strict mode enabled
- **Prettier**: Code formatting (via ESLint)

### Component Library

This project uses **shadcn/ui** with the base-luma style. Components are located in [`components/ui/`](components/ui/).

To add new components:
```bash
bunx shadcn add <component-name>
```

## 📦 Deployment

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t rms-nextjs .
   ```

2. Run with environment variables:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e DATABASE_URL=your-db-url \
     -e NEXT_PUBLIC_APP_URL=your-app-url \
     rms-nextjs
   ```

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up SSL/HTTPS
- [ ] Configure environment variables
- [ ] Run `prisma migrate deploy`
- [ ] Build the application (`npm run build`)

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

Please read the project documentation and understand the codebase structure before making contributions.

---

**Built with** ❤️ **using Next.js 16, React 19, and TypeScript**
