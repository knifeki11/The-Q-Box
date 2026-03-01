-- Membership monthly price (MAD) for home page pricing display
ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS membership_price_mad NUMERIC(10,2);

UPDATE business_settings SET membership_price_mad = 900 WHERE id = 1 AND membership_price_mad IS NULL;
