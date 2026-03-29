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
  admin_notes text,
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
alter table public.orders add column if not exists admin_notes text;

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

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status text,
  next_status text not null,
  changed_at timestamptz not null default now()
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

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function public.create_order_request(
  order_payload jsonb,
  order_items_payload jsonb,
  customer_payload jsonb
)
returns table (
  id uuid,
  order_ref text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_order_id uuid;
  next_order_ref text;
begin
  insert into public.orders (
    order_ref,
    created_at,
    customer_name,
    phone,
    email,
    address_line_1,
    address_line_2,
    city,
    state,
    pincode,
    notes,
    subtotal,
    shipping,
    total,
    status,
    payment_method,
    source,
    whatsapp_sent
  )
  values (
    order_payload->>'order_ref',
    coalesce((order_payload->>'created_at')::timestamptz, now()),
    order_payload->>'customer_name',
    order_payload->>'phone',
    nullif(order_payload->>'email', ''),
    order_payload->>'address_line_1',
    nullif(order_payload->>'address_line_2', ''),
    order_payload->>'city',
    order_payload->>'state',
    order_payload->>'pincode',
    nullif(order_payload->>'notes', ''),
    coalesce((order_payload->>'subtotal')::numeric, 0),
    coalesce((order_payload->>'shipping')::numeric, 0),
    coalesce((order_payload->>'total')::numeric, 0),
    coalesce(order_payload->>'status', 'new'),
    coalesce(order_payload->>'payment_method', 'whatsapp'),
    coalesce(order_payload->>'source', 'website'),
    coalesce((order_payload->>'whatsapp_sent')::boolean, false)
  )
  returning orders.id, orders.order_ref into next_order_id, next_order_ref;

  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    product_slug,
    variant_id,
    variant_color_name,
    size,
    quantity,
    unit_price,
    line_total
  )
  select
    next_order_id,
    item->>'product_id',
    item->>'product_name',
    nullif(item->>'product_slug', ''),
    nullif(item->>'variant_id', ''),
    nullif(item->>'variant_color_name', ''),
    nullif(item->>'size', ''),
    coalesce((item->>'quantity')::integer, 1),
    coalesce((item->>'unit_price')::numeric, 0),
    coalesce((item->>'line_total')::numeric, 0)
  from jsonb_array_elements(coalesce(order_items_payload, '[]'::jsonb)) as item;

  insert into public.customers (
    phone,
    email,
    name,
    created_at,
    last_order_at,
    order_count,
    total_spend
  )
  values (
    customer_payload->>'phone',
    nullif(customer_payload->>'email', ''),
    customer_payload->>'name',
    coalesce((customer_payload->>'created_at')::timestamptz, now()),
    coalesce((customer_payload->>'last_order_at')::timestamptz, now()),
    coalesce((customer_payload->>'order_count')::integer, 1),
    coalesce((customer_payload->>'total_spend')::numeric, 0)
  )
  on conflict (phone) do update set
    email = excluded.email,
    name = excluded.name,
    last_order_at = excluded.last_order_at,
    order_count = public.customers.order_count + excluded.order_count,
    total_spend = public.customers.total_spend + excluded.total_spend;

  return query
  select next_order_id, next_order_ref;
end;
$$;

create unique index if not exists inventory_product_variant_unique
on public.inventory (product_id, variant_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.create_order_request(jsonb, jsonb, jsonb) to anon, authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customers enable row level security;
alter table public.inventory enable row level security;
alter table public.order_status_history enable row level security;
alter table public.admin_users enable row level security;

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
using (public.is_admin());

drop policy if exists "admins can update orders" on public.orders;
create policy "admins can update orders"
on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins can delete cancelled orders" on public.orders;
create policy "admins can delete cancelled orders"
on public.orders
for delete
to authenticated
using (public.is_admin() and status = 'cancelled');

drop policy if exists "admins can read order items" on public.order_items;
create policy "admins can read order items"
on public.order_items
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins can read order history" on public.order_status_history;
create policy "admins can read order history"
on public.order_status_history
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins can insert order history" on public.order_status_history;
create policy "admins can insert order history"
on public.order_status_history
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins can read customers" on public.customers;
create policy "admins can read customers"
on public.customers
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins can read inventory" on public.inventory;
create policy "admins can read inventory"
on public.inventory
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins can upsert inventory" on public.inventory;
create policy "admins can upsert inventory"
on public.inventory
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins can update inventory" on public.inventory;
create policy "admins can update inventory"
on public.inventory
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins can read own profile" on public.admin_users;
create policy "admins can read own profile"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());
