-- Single-row table for points configuration (dashboard Edit Rules)
CREATE TABLE IF NOT EXISTS points_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  points_per_hour_played INT NOT NULL DEFAULT 10,
  tournament_win_bonus INT NOT NULL DEFAULT 500,
  birthday_bonus INT NOT NULL DEFAULT 1000,
  yearly_bonus INT NOT NULL DEFAULT 500
);

INSERT INTO points_config (id, points_per_hour_played, tournament_win_bonus, birthday_bonus, yearly_bonus)
VALUES (1, 10, 500, 1000, 500)
ON CONFLICT (id) DO NOTHING;
