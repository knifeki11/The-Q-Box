-- Console-type pricing (same as home page: Xbox, Standard PS5, PS5 Premium; 1 player and 4 players)
ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS xbox_price_1_mad NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS xbox_price_4_mad NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS standard_ps5_price_1_mad NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS standard_ps5_price_4_mad NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS premium_ps5_price_1_mad NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS premium_ps5_price_4_mad NUMERIC(10,2);

UPDATE business_settings SET
  xbox_price_1_mad = 20,
  xbox_price_4_mad = NULL,
  standard_ps5_price_1_mad = 40,
  standard_ps5_price_4_mad = 55,
  premium_ps5_price_1_mad = 50,
  premium_ps5_price_4_mad = 70
WHERE id = 1 AND xbox_price_1_mad IS NULL;
