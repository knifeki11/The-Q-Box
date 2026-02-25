-- Allow walk-in sessions without a client (No client)
ALTER TABLE sessions ALTER COLUMN member_id DROP NOT NULL;
