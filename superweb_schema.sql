-- 1. Tabel Cabang (Branches)
CREATE TABLE IF NOT EXISTS public.branches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Transaksi Cloud (Sinkronisasi dari Kasir)
CREATE TABLE IF NOT EXISTS public.transactions (
  id text PRIMARY KEY, -- ID dari Zustand
  merchant_id uuid REFERENCES auth.users(id) NOT NULL,
  branch_id uuid REFERENCES public.branches(id),
  subtotal numeric NOT NULL,
  tax numeric NOT NULL,
  total numeric NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL,
  order_type text,
  table_number text,
  cashier_name text,
  timestamp timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Detail Transaksi (Transaction Items)
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id text REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Pelanggan CRM (Member)
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  phone text,
  points integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  visits integer DEFAULT 0,
  last_visit timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Buka akses (RLS Policies) untuk Merchant
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant can view own branches" ON public.branches FOR SELECT USING (auth.uid() = merchant_id);
CREATE POLICY "Merchant can insert own branches" ON public.branches FOR INSERT WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchant can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = merchant_id);
CREATE POLICY "Merchant can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchant can view own transaction items" ON public.transaction_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.transactions WHERE id = transaction_items.transaction_id AND merchant_id = auth.uid())
);
CREATE POLICY "Merchant can insert own transaction items" ON public.transaction_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.transactions WHERE id = transaction_items.transaction_id AND merchant_id = auth.uid())
);

CREATE POLICY "Merchant can view own customers" ON public.customers FOR SELECT USING (auth.uid() = merchant_id);
CREATE POLICY "Merchant can insert/update own customers" ON public.customers FOR ALL USING (auth.uid() = merchant_id);
