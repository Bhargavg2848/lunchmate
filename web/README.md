# Lunchmate Web

Next.js site + dashboard scaffold for Lunchmate branding, orders, and render automation.

## Setup
```bash
cd /home/runner/work/lunchmate/lunchmate/web
cp .env.example .env.local
npm install
npm run dev
```

## Main routes
- `/` landing page with centered 3D scroll-driven model section
- `/dashboard` admin overview
- `/dashboard/menu`
- `/dashboard/orders`
- `/dashboard/customers`
- `/dashboard/branding`
- `/dashboard/render-jobs`

## API scaffolding
- `POST /api/render-jobs` queue a render job
- `GET /api/render-jobs` list jobs
- `POST /api/brand-assets/activate` set active brand asset

## Supabase
- Schema file: `/home/runner/work/lunchmate/lunchmate/web/supabase/schema.sql`
- Add credentials in `.env.local`

## 3D assets
- Place `lunchmate_3d.glb` in `/home/runner/work/lunchmate/lunchmate/web/public`
- Fallback image is served from `public/lunchmate-fallback.svg`
