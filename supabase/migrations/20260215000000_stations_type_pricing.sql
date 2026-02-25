-- Add type and pricing to stations (run if you already have stations table without these columns)
ALTER TABLE stations
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'standard_ps5',
  ADD COLUMN IF NOT EXISTS price_1_mad NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_4_mad NUMERIC(10,2);

ALTER TABLE stations DROP CONSTRAINT IF EXISTS stations_type_check;
ALTER TABLE stations ADD CONSTRAINT stations_type_check CHECK (type IN ('standard_ps5', 'premium_ps5', 'xbox'));

UPDATE stations SET type = 'standard_ps5', price_1_mad = 40, price_4_mad = 55 WHERE name IN ('Station 01','Station 02','Station 03','Station 04','Station 05','Station 06','Station 07','Station 08');
UPDATE stations SET type = 'premium_ps5', price_1_mad = 50, price_4_mad = 70 WHERE name = 'Station 09';
UPDATE stations SET type = 'xbox', price_1_mad = 20, price_4_mad = NULL WHERE name = 'Station 10';

ALTER TABLE stations ALTER COLUMN price_1_mad SET NOT NULL;
