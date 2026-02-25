-- =============================================================================
-- Q-BOX Play Lounge – Supabase schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================================================

-- Extensions (Supabase usually has these; uncomment if needed)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Card tiers (Silver, Gold, Black) – reference data
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS card_tiers (
  id         TEXT PRIMARY KEY CHECK (id IN ('silver', 'gold', 'black')),
  name       TEXT NOT NULL,
  points_required INT NOT NULL DEFAULT 0,
  visits_required INT NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  points_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1,
  free_hours_per_month INT NOT NULL DEFAULT 0,
  guest_passes_per_month INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO card_tiers (id, name, points_required, visits_required, discount_percent, points_multiplier, free_hours_per_month, guest_passes_per_month) VALUES
  ('silver', 'Silver Card', 0, 0, 0, 1, 0, 0),
  ('gold', 'Gold Card', 5000, 50, 10, 1.5, 1, 1),
  ('black', 'Black Card', 15000, 150, 25, 3, 2, 3)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Profiles (users: client or admin) – extends auth.users
-- Shared: first_name, last_name, email, phone, date_of_birth (password in auth.users only)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  first_name    TEXT,
  last_name     TEXT,
  email         TEXT,
  phone         TEXT,
  date_of_birth DATE,
  card_tier_id  TEXT NOT NULL DEFAULT 'silver' REFERENCES card_tiers(id),
  points        INT NOT NULL DEFAULT 0,
  total_visits  INT NOT NULL DEFAULT 0,
  total_spent   NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_card_tier ON profiles(card_tier_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Trigger: create profile on signup (role from metadata, default client)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name, email, phone, date_of_birth)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'client'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 3. Stations (10 premium gaming stations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'reserved', 'maintenance')),
  type            TEXT NOT NULL DEFAULT 'standard_ps5' CHECK (type IN ('standard_ps5', 'premium_ps5', 'xbox')),
  price_1_mad     NUMERIC(10,2) NOT NULL,
  price_4_mad     NUMERIC(10,2),
  current_session_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8 standard PS5 (40 MAD/h, 55 MAD/h for 4), 1 premium PS5 (50/70), 1 Xbox (20, no 4-person)
INSERT INTO stations (name, status, type, price_1_mad, price_4_mad) VALUES
  ('Station 01', 'free', 'standard_ps5', 40, 55),
  ('Station 02', 'free', 'standard_ps5', 40, 55),
  ('Station 03', 'free', 'standard_ps5', 40, 55),
  ('Station 04', 'free', 'standard_ps5', 40, 55),
  ('Station 05', 'free', 'standard_ps5', 40, 55),
  ('Station 06', 'free', 'standard_ps5', 40, 55),
  ('Station 07', 'free', 'standard_ps5', 40, 55),
  ('Station 08', 'free', 'standard_ps5', 40, 55),
  ('Station 09', 'free', 'premium_ps5', 50, 70),
  ('Station 10', 'free', 'xbox', 20, NULL)
ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  price_1_mad = EXCLUDED.price_1_mad,
  price_4_mad = EXCLUDED.price_4_mad;

-- -----------------------------------------------------------------------------
-- 4. Sessions (gameplay sessions – active or completed)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  station_id      UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  duration_minutes INT,
  cost_mad        NUMERIC(10,2) NOT NULL,
  extra_items_mad NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status  TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  points_earned   INT NOT NULL DEFAULT 0,
  game            TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_member ON sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_sessions_station ON sessions(station_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);

-- Note: stations.current_session_id references sessions(id); no FK to avoid circular ref.
-- App should set/clear it when a session starts/ends.

-- -----------------------------------------------------------------------------
-- 5. Bookings (reservations – upcoming or past)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  station_id      UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL,
  cost_mad        NUMERIC(10,2) NOT NULL,
  game            TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bookings_valid_times CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_bookings_member ON bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_bookings_station ON bookings(station_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- -----------------------------------------------------------------------------
-- 6. Tournaments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournaments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  game              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  card_eligibility  TEXT NOT NULL DEFAULT 'all' CHECK (card_eligibility IN ('all', 'silver', 'gold', 'black')),
  entry_fee_mad     NUMERIC(10,2) NOT NULL DEFAULT 0,
  prize             TEXT,
  max_participants  INT NOT NULL,
  starts_at         TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_starts_at ON tournaments(starts_at);

-- -----------------------------------------------------------------------------
-- 7. Tournament registrations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_paid    BOOLEAN NOT NULL DEFAULT false,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_reg_member ON tournament_registrations(member_id);
CREATE INDEX IF NOT EXISTS idx_tournament_reg_tournament ON tournament_registrations(tournament_id);

-- -----------------------------------------------------------------------------
-- 8. Rewards catalog (redeemable items / privileges)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rewards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  points_cost   INT NOT NULL,
  tier_required TEXT NOT NULL DEFAULT 'silver' CHECK (tier_required IN ('silver', 'gold', 'black')),
  category      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. Reward redemptions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id   UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  points_spent INT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redemptions_member ON reward_redemptions(member_id);

-- -----------------------------------------------------------------------------
-- 10. Activity log (dashboard recent activity / audit)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_member ON activity_log(member_id);

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log      ENABLE ROW LEVEL SECURITY;

-- card_tiers: read-only for all authenticated
CREATE POLICY "card_tiers_read" ON card_tiers FOR SELECT TO authenticated USING (true);

-- profiles: users read/update own; anon/service can manage for dashboard
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_service_all" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- stations: read for authenticated (portal + dashboard)
CREATE POLICY "stations_read" ON stations FOR SELECT TO authenticated USING (true);
CREATE POLICY "stations_service_all" ON stations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- sessions: members see own; service_role sees all (dashboard)
CREATE POLICY "sessions_read_own" ON sessions FOR SELECT TO authenticated USING (auth.uid() = member_id);
CREATE POLICY "sessions_insert_own" ON sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = member_id);
CREATE POLICY "sessions_service_all" ON sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- bookings: members see/manage own; service_role all
CREATE POLICY "bookings_read_own" ON bookings FOR SELECT TO authenticated USING (auth.uid() = member_id);
CREATE POLICY "bookings_insert_own" ON bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = member_id);
CREATE POLICY "bookings_update_own" ON bookings FOR UPDATE TO authenticated USING (auth.uid() = member_id);
CREATE POLICY "bookings_service_all" ON bookings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- tournaments: read for authenticated; insert/update via service or admin
CREATE POLICY "tournaments_read" ON tournaments FOR SELECT TO authenticated USING (true);
CREATE POLICY "tournaments_service_all" ON tournaments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- tournament_registrations: members see own, insert own; service all
CREATE POLICY "tournament_reg_read_own" ON tournament_registrations FOR SELECT TO authenticated USING (auth.uid() = member_id);
CREATE POLICY "tournament_reg_insert_own" ON tournament_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = member_id);
CREATE POLICY "tournament_reg_service_all" ON tournament_registrations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- rewards: read for authenticated
CREATE POLICY "rewards_read" ON rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "rewards_service_all" ON rewards FOR ALL TO service_role USING (true) WITH CHECK (true);

-- reward_redemptions: members see own, insert own; service all
CREATE POLICY "redemptions_read_own" ON reward_redemptions FOR SELECT TO authenticated USING (auth.uid() = member_id);
CREATE POLICY "redemptions_insert_own" ON reward_redemptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = member_id);
CREATE POLICY "redemptions_service_all" ON reward_redemptions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- activity_log: members see own; service all (dashboard sees all via service)
CREATE POLICY "activity_read_own" ON activity_log FOR SELECT TO authenticated USING (auth.uid() = member_id);
CREATE POLICY "activity_service_all" ON activity_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Helper: update profiles.updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS stations_updated_at ON stations;
CREATE TRIGGER stations_updated_at BEFORE UPDATE ON stations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tournaments_updated_at ON tournaments;
CREATE TRIGGER tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
