# MERNcrest Solutions Website

Enterprise website for **MERNcrest Solutions (Pvt) Ltd** — merncrest.lk

## Structure

```
MernCrest/
├── apps/
│   └── web/          # Next.js 14 frontend + API routes
└── docs/             # Deployment and SEO guides
```

## Quick Start

```bash
cd apps/web
cp .env.example .env.local
# Configure DATABASE_URL and other env vars
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en)

## Tech Stack

- **Frontend:** Next.js 14, Tailwind CSS, shadcn/ui, Framer Motion
- **i18n:** next-intl (English, Tamil, Sinhala)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (Phase 3)
- **Media:** Cloudinary

## Build Phases

| Phase | Status |
|-------|--------|
| 1 — Foundation | ✅ In progress |
| 2 — Public Pages | Pending |
| 3 — Backend & APIs | Pending |
| 4 — Admin Dashboard | Pending |
| 5 — Premium Features | Pending |
| 6 — Polish & Deploy | Pending |

## Company

- **Founder:** Mohamed Shakkir
- **Tagline:** Your Technology Partner
- **Location:** Sri Lanka
