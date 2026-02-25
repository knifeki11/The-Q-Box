-- Persist session pause state so station shows "Paused" after closing the end-session modal
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN sessions.paused_at IS 'When set, session timer is paused at this time; elapsed = paused_at - started_at until resumed.';
