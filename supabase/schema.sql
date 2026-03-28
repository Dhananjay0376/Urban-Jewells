create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  created_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null,
  email text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  pincode text not null,
  notes text,
  subtotal numeric not null default 0,
  shipping numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'new',
  inventory_adjusted boolean not null default false,
  payment_method text not null default 'whatsapp',
  source text not null default 'website',
  whatsapp_sent boolean not null default false
);

alter table public.orders add column if not exists inventory_adjusted boolean not null default false;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  product_slug text,
  variant_id text,
  variant_color_name text,
  size text,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  line_total numeric not null default 0
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  email text,
  name text not null,
  created_at timestamptz not null default now(),
  last_order_at timestamptz,
  order_count integer not null default 0,
  total_spend numeric not null default 0
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  variant_id text not null default 'base',
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 2,
  updated_at timestamptz not null default now()
);

create unique index if not exists inventory_product_variant_unique
on public.inventory (product_id, variant_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customers enable row level security;
alter table public.inventory enable row level security;

drop policy if exists "public can insert orders" on public.orders;
create policy "public can insert orders"
on public.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "public can insert order items" on public.order_items;
create policy "public can insert order items"
on public.order_items
for insert
to anon, authenticated
with check (true);

drop policy if exists "public can insert customers" on public.customers;
create policy "public can insert customers"
on public.customers
for insert
to anon, authenticated
with check (true);

drop policy if exists "public can update customers by phone" on public.customers;
create policy "public can update customers by phone"
on public.customers
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "admins can read orders" on public.orders;
create policy "admins can read orders"
on public.orders
for select
to authenticated
using (true);

drop policy if exists "admins can update orders" on public.orders;
create policy "admins can update orders"
on public.orders
for update
to authenticated
using (true)
with check (true);

drop policy if exists "admins can read order items" on public.order_items;
create policy "admins can read order items"
on public.order_items
for select
to authenticated
using (true);

drop policy if exists "admins can read customers" on public.customers;
create policy "admins can read customers"
on public.customers
for select
to authenticated
using (true);

drop policy if exists "admins can read inventory" on public.inventory;
create policy "admins can read inventory"
on public.inventory
for select
to authenticated
using (true);

drop policy if exists "admins can upsert inventory" on public.inventory;
create policy "admins can upsert inventory"
on public.inventory
for insert
to authenticated
with check (true);

drop policy if exists "admins can update inventory" on public.inventory;
create policy "admins can update inventory"
on public.inventory
for update
to authenticated
using (true)
with check (true);
