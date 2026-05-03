-- ============================================================
-- FELICITE — Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_info JSONB NOT NULL,
  items         JSONB NOT NULL,
  total_amount  NUMERIC(10, 2) NOT NULL,
  delivery_charge NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  grand_total   NUMERIC(10, 2) NOT NULL,
  coupon_used   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'COD'
                  CHECK (payment_method IN ('COD','WhatsApp')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT an order (customer checkout)
CREATE POLICY "Anyone can place orders"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated admins can SELECT / UPDATE / DELETE orders
-- Replace the emails below with your actual admin emails
CREATE POLICY "Admins can view orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'mimpy124ahon124@gmail.com',
      'feliciteclothing@gmail.com'
    )
  );

CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'mimpy124ahon124@gmail.com',
      'feliciteclothing@gmail.com'
    )
  );

CREATE POLICY "Admins can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'mimpy124ahon124@gmail.com',
      'feliciteclothing@gmail.com'
    )
  );

-- Enable Realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================================
-- Products table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  price           NUMERIC(10, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'BDT',
  category        TEXT NOT NULL,
  image           TEXT,           -- primary image URL (Supabase Storage public URL)
  gallery         JSONB DEFAULT '[]',  -- array of image URLs
  colors          JSONB DEFAULT '[]',  -- array of hex strings
  sizes           JSONB DEFAULT '["S","M","L"]',
  description     TEXT,
  details         JSONB DEFAULT '[]',
  fabric          TEXT,
  care_instructions JSONB DEFAULT '[]',
  is_new_arrival  BOOLEAN NOT NULL DEFAULT false,
  sold_out        BOOLEAN NOT NULL DEFAULT false,
  stock           INTEGER,
  sort_order      INTEGER DEFAULT 0,   -- lower = shown first
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ
);

-- Anyone can read products (public storefront)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are public"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'mimpy124ahon124@gmail.com',
      'feliciteclothing@gmail.com'
    )
  );

CREATE POLICY "Admins can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'mimpy124ahon124@gmail.com',
      'feliciteclothing@gmail.com'
    )
  );

CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'mimpy124ahon124@gmail.com',
      'feliciteclothing@gmail.com'
    )
  );

-- Enable Realtime for products
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- ============================================================
-- Supabase Storage bucket for product images
-- Run separately in the SQL editor OR create via the Supabase
-- dashboard: Storage → New bucket → "product-images" (public)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload/delete images
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    auth.jwt() ->> 'email' IN (
      'mimpy124ahon124@gmail.com',
      'feliciteclothing@gmail.com'
    )
  );

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    auth.jwt() ->> 'email' IN (
      'mimpy124ahon124@gmail.com',
      'feliciteclothing@gmail.com'
    )
  );

-- Public read access for product images
CREATE POLICY "Product images are public"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');
