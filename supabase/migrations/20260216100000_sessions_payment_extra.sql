-- Payment status and extra items for sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid'));
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS extra_items_mad NUMERIC(10,2) NOT NULL DEFAULT 0;
