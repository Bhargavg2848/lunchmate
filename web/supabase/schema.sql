create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'staff')) default 'staff',
  full_name text,
  created_at timestamptz default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_inr integer not null,
  is_available boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_inr integer not null,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text,
  status text not null check (status in ('pending','preparing','out_for_delivery','completed','cancelled')) default 'pending',
  total_inr integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  quantity integer not null default 1,
  unit_price_inr integer not null,
  created_at timestamptz default now()
);

create table if not exists customer_updates (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  message text not null,
  channel text not null default 'dashboard',
  created_at timestamptz default now()
);

create table if not exists branding_presets (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  payload jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists brand_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  preset text not null,
  logo_png_url text,
  hero_png_url text,
  glb_url text,
  is_active boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists render_jobs (
  id uuid primary key default gen_random_uuid(),
  preset text not null,
  template text not null default 'default',
  status text not null check (status in ('queued','running','failed','complete')) default 'queued',
  output_manifest_url text,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  payload jsonb,
  created_at timestamptz default now()
);

alter table orders replica identity full;
alter table render_jobs replica identity full;

alter table profiles enable row level security;
alter table menu_items enable row level security;
alter table addons enable row level security;
alter table orders enable row level security;
alter table customer_updates enable row level security;
alter table branding_presets enable row level security;
alter table brand_assets enable row level security;
alter table render_jobs enable row level security;
alter table audit_logs enable row level security;

create policy if not exists "staff can read menu"
on menu_items for select to authenticated using (true);

create policy if not exists "owner and staff manage orders"
on orders for all to authenticated using (true) with check (true);

create policy if not exists "owner and staff manage render jobs"
on render_jobs for all to authenticated using (true) with check (true);
