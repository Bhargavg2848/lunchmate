# Lunchmate Website + Dashboard Blueprint

## Stack
- Frontend: Next.js + Tailwind + Framer Motion + React Three Fiber
- Backend/API: Next.js API routes + Supabase
- DB/Auth/Realtime: Supabase Postgres + Auth + Realtime
- Storage/CDN: Supabase Storage (or Azure Blob if preferred)
- Hosting: Vercel (recommended) or Azure Static Web Apps
- Monitoring: Sentry + analytics

## Landing page (3D middle-scroll effect)
1. Place `lunchmate_3d.glb` in app public assets.
2. Render centered model section using React Three Fiber.
3. Map scroll progress to model rotation/orbit with eased interpolation.
4. Lazy-load model and provide PNG fallback image for low-power devices.
5. Compress GLB (Draco) before production deploy.

## Dashboard modules
- Branding preset switcher (Classic/Premium/Festive)
- Logo/poster render job trigger
- Menu manager (items, price, availability)
- Orders board (pending/preparing/out-for-delivery/completed)
- Customer updates + add-ons management
- Role-based access (owner/staff)
- Audit trail for content/settings changes

## Automation flow
1. Dashboard form creates render job entry.
2. Worker runs Blender script with selected preset.
3. Output files uploaded to storage.
4. Metadata saved in DB.
5. “Set active brand assets” button updates website references.

## Delivery phases
- Phase 1: Blender asset pipeline complete
- Phase 2: marketing site with 3D section
- Phase 3: dashboard + order/customer updates
- Phase 4: automated creative generation and publishing
