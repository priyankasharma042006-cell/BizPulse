/*
# BizPulse: Core Database Schema

## Purpose
Creates the full data model for BizPulse, an AI co-pilot for small businesses.
Multi-tenant: each authenticated user owns their business data.
Users are authenticated by Firebase Auth (Supabase Third-Party Auth), so
ownership is keyed on the Firebase UID, read from the JWT `sub` claim.

Free-tier note: Firebase ID tokens carry no `role` claim (adding one needs Cloud
Functions, which require a billing account), so Supabase runs these requests as
the `anon` Postgres role. Policies are therefore granted to `anon` AND
`authenticated`, but every one of them still requires a verified token whose
`sub` matches the row owner. A request with only the anon key has no `sub`,
so it can read or write nothing.

## New Tables
1. businesses — Root entity (owner_id defaults to the Firebase UID)
2. items — Product/inventory catalog (F9)
3. transactions — Sales and expenses log (F1)
4. daily_rollups — Pre-aggregated daily totals for forecasts
5. customers — Customer ledger (F25)
6. bills — Payables and wage due dates (F6)
7. alerts — AI-generated alerts and insights (F20)

## Security
- RLS on ALL tables, owner-scoped via the Firebase UID (auth.jwt() ->> 'sub')
- Child tables scoped through parent business ownership
*/

CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL DEFAULT (auth.jwt() ->> 'sub'),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'grocery',
  currency text NOT NULL DEFAULT 'INR',
  opening_balance numeric NOT NULL DEFAULT 0,
  lang text NOT NULL DEFAULT 'en',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_businesses" ON businesses;
CREATE POLICY "select_own_businesses" ON businesses FOR SELECT
  TO anon, authenticated USING ((auth.jwt() ->> 'sub') = owner_id);

DROP POLICY IF EXISTS "insert_own_businesses" ON businesses;
CREATE POLICY "insert_own_businesses" ON businesses FOR INSERT
  TO anon, authenticated WITH CHECK ((auth.jwt() ->> 'sub') = owner_id);

DROP POLICY IF EXISTS "update_own_businesses" ON businesses;
CREATE POLICY "update_own_businesses" ON businesses FOR UPDATE
  TO anon, authenticated USING ((auth.jwt() ->> 'sub') = owner_id) WITH CHECK ((auth.jwt() ->> 'sub') = owner_id);

DROP POLICY IF EXISTS "delete_own_businesses" ON businesses;
CREATE POLICY "delete_own_businesses" ON businesses FOR DELETE
  TO anon, authenticated USING ((auth.jwt() ->> 'sub') = owner_id);

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  cost numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  stock numeric NOT NULL DEFAULT 0,
  reorder_level numeric NOT NULL DEFAULT 0,
  shelf_life_days integer,
  supplier_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_items" ON items;
CREATE POLICY "select_own_items" ON items FOR SELECT
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = items.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "insert_own_items" ON items;
CREATE POLICY "insert_own_items" ON items FOR INSERT
  TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = items.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "update_own_items" ON items;
CREATE POLICY "update_own_items" ON items FOR UPDATE
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = items.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = items.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "delete_own_items" ON items;
CREATE POLICY "delete_own_items" ON items FOR DELETE
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = items.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('sale', 'expense')),
  amount numeric NOT NULL CHECK (amount >= 0),
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  qty numeric,
  note text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_txns" ON transactions;
CREATE POLICY "select_own_txns" ON transactions FOR SELECT
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = transactions.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "insert_own_txns" ON transactions;
CREATE POLICY "insert_own_txns" ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = transactions.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "update_own_txns" ON transactions;
CREATE POLICY "update_own_txns" ON transactions FOR UPDATE
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = transactions.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = transactions.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "delete_own_txns" ON transactions;
CREATE POLICY "delete_own_txns" ON transactions FOR DELETE
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = transactions.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

CREATE TABLE IF NOT EXISTS daily_rollups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_sales numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  unit_count integer NOT NULL DEFAULT 0,
  UNIQUE(business_id, date)
);

ALTER TABLE daily_rollups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rollups" ON daily_rollups;
CREATE POLICY "select_own_rollups" ON daily_rollups FOR SELECT
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = daily_rollups.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "insert_own_rollups" ON daily_rollups;
CREATE POLICY "insert_own_rollups" ON daily_rollups FOR INSERT
  TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = daily_rollups.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "update_own_rollups" ON daily_rollups;
CREATE POLICY "update_own_rollups" ON daily_rollups FOR UPDATE
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = daily_rollups.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = daily_rollups.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "delete_own_rollups" ON daily_rollups;
CREATE POLICY "delete_own_rollups" ON daily_rollups FOR DELETE
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = daily_rollups.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  balance_due numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_customers" ON customers;
CREATE POLICY "select_own_customers" ON customers FOR SELECT
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = customers.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "insert_own_customers" ON customers;
CREATE POLICY "insert_own_customers" ON customers FOR INSERT
  TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = customers.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "update_own_customers" ON customers;
CREATE POLICY "update_own_customers" ON customers FOR UPDATE
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = customers.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = customers.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "delete_own_customers" ON customers;
CREATE POLICY "delete_own_customers" ON customers FOR DELETE
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = customers.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  payee text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bills" ON bills;
CREATE POLICY "select_own_bills" ON bills FOR SELECT
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bills.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "insert_own_bills" ON bills;
CREATE POLICY "insert_own_bills" ON bills FOR INSERT
  TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bills.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "update_own_bills" ON bills;
CREATE POLICY "update_own_bills" ON bills FOR UPDATE
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bills.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bills.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "delete_own_bills" ON bills;
CREATE POLICY "delete_own_bills" ON bills FOR DELETE
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = bills.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  kind text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  reason text NOT NULL,
  suggested_action text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_alerts" ON alerts;
CREATE POLICY "select_own_alerts" ON alerts FOR SELECT
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = alerts.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "insert_own_alerts" ON alerts;
CREATE POLICY "insert_own_alerts" ON alerts FOR INSERT
  TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = alerts.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "update_own_alerts" ON alerts;
CREATE POLICY "update_own_alerts" ON alerts FOR UPDATE
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = alerts.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = alerts.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "delete_own_alerts" ON alerts;
CREATE POLICY "delete_own_alerts" ON alerts FOR DELETE
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = alerts.business_id AND businesses.owner_id = (auth.jwt() ->> 'sub')));

CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_business_id ON items(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_daily_rollups_business_date ON daily_rollups(business_id, date);
CREATE INDEX IF NOT EXISTS idx_bills_business_id ON bills(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_alerts_business_id ON alerts(business_id);

-- Expose the tables to the Data API roles (RLS above still restricts every row).
GRANT SELECT, INSERT, UPDATE, DELETE ON
  businesses, items, transactions, daily_rollups, customers, bills, alerts
  TO anon, authenticated;
