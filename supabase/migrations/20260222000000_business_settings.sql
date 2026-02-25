-- Business settings (single row) – pricing rules, defaults, notifications
CREATE TABLE IF NOT EXISTS business_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  -- Pricing (MAD). Standard rate; Gold/Black can use card_tiers.discount_percent or override here.
  standard_rate_mad NUMERIC(10,2) NOT NULL DEFAULT 40,
  weekend_surcharge_mad NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- Session defaults
  default_session_minutes INT NOT NULL DEFAULT 60,
  auto_end_warning_minutes INT NOT NULL DEFAULT 5,
  auto_extend_sessions BOOLEAN NOT NULL DEFAULT false,
  -- Notifications
  session_alerts BOOLEAN NOT NULL DEFAULT true,
  low_station_alerts BOOLEAN NOT NULL DEFAULT true,
  tournament_reminders BOOLEAN NOT NULL DEFAULT true,
  revenue_milestones BOOLEAN NOT NULL DEFAULT false,
  new_member_alerts BOOLEAN NOT NULL DEFAULT true,
  maintenance_alerts BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO business_settings (id, standard_rate_mad, weekend_surcharge_mad, default_session_minutes, auto_end_warning_minutes, auto_extend_sessions, session_alerts, low_station_alerts, tournament_reminders, revenue_milestones, new_member_alerts, maintenance_alerts)
VALUES (1, 40, 0, 60, 5, false, true, true, true, false, true, true)
ON CONFLICT (id) DO NOTHING;

-- Opening hours: one row per day (0=Sunday, 1=Monday, ..., 6=Saturday). Times as HH:MM 24h.
CREATE TABLE IF NOT EXISTS opening_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TEXT NOT NULL DEFAULT '12:00',
  close_time TEXT NOT NULL DEFAULT '23:00',
  UNIQUE(day_of_week)
);

INSERT INTO opening_hours (day_of_week, open_time, close_time) VALUES
  (0, '10:00', '23:00'),
  (1, '12:00', '23:00'),
  (2, '12:00', '23:00'),
  (3, '12:00', '23:00'),
  (4, '12:00', '23:00'),
  (5, '12:00', '01:00'),
  (6, '10:00', '01:00')
ON CONFLICT (day_of_week) DO NOTHING;
