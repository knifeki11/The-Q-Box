-- Tournament bracket matches for single-elimination
CREATE TABLE IF NOT EXISTS tournament_matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round         INT NOT NULL,
  match_index   INT NOT NULL,
  player1_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player2_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  winner_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, round, match_index)
);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
