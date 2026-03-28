# Supabase Setup

This project now supports:

- order capture from checkout
- a protected admin portal at `#/admin`
- order status management
- manual inventory tracking
- customer/revenue metrics

## 1. Environment Variables

Add these to `.env` and Vercel:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

This app also accepts the newer Next-style names if those are what Supabase shows you:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
```

## 2. Database Tables

Open the Supabase SQL editor and run:

- [supabase/schema.sql](/e:/Urban%20Jewells%20Claude/supabase/schema.sql)

That creates:

- `orders`
- `order_items`
- `customers`
- `inventory`

If you already ran an older version of the schema, run the updated file again so `orders.inventory_adjusted` is added for automatic stock reduction on paid orders.

## 3. Admin Auth

Create at least one admin user in Supabase Auth:

1. Go to `Authentication`
2. Create a user with email/password
3. Use those credentials in `#/admin`

## 4. Order Flow

Once Supabase is configured:

1. customer fills checkout form
2. site inserts the order into Supabase
3. site inserts order items into Supabase
4. site opens WhatsApp with the order reference
5. admin reviews and updates status in `#/admin`

If Supabase is not configured, checkout still falls back to the previous WhatsApp-only flow.

## 5. Automatic Stock Reduction

Inventory is reduced automatically when an admin changes an order status to `paid`.

- it reduces only once per order
- it does not reduce stock at initial order creation
- it uses `variant_id` when present, otherwise `base`

## 6. Inventory

The admin portal lets you save stock quantities manually.

- base products use variant id `base`
- variant rows use their actual variant id

## 7. Notes

- Product content still comes from Sanity.
- Operational data now comes from Supabase.
- The storefront does not yet auto-sync stock counts back into public product availability; this first version focuses on order capture and admin operations.
- Cancelled orders are hidden by default in the admin portal and can be permanently deleted there if you no longer want to keep them.
