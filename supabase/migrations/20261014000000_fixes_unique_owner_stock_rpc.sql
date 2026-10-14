/*
  # Fixes

  1. One business per owner (prevents duplicate rows that broke `.maybeSingle()` and hung the app).
     Skipped with a notice if duplicates already exist - delete the extras, then re-run the CREATE INDEX line.
  2. Composite index for the app's main query (transactions by business ordered by date).
  3. adjust_item_stock(): atomic stock change, so two quick logs can't overwrite each other.
     Runs as the caller (SECURITY INVOKER), so row level security still applies.
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM businesses GROUP BY owner_id HAVING count(*) > 1) THEN
    RAISE NOTICE 'Duplicate businesses per owner found: remove extras, then run: CREATE UNIQUE INDEX uniq_businesses_owner_id ON businesses(owner_id);';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_businesses_owner_id ON businesses(owner_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_business_date ON transactions(business_id, date);

CREATE OR REPLACE FUNCTION adjust_item_stock(p_item_id uuid, p_delta numeric)
RETURNS numeric
LANGUAGE sql
SECURITY INVOKER
AS $$
  UPDATE items
  SET stock = GREATEST(0, stock + p_delta)
  WHERE id = p_item_id
  RETURNING stock;
$$;
