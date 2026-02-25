-- Allow walk-in reservations (no client)
ALTER TABLE bookings ALTER COLUMN member_id DROP NOT NULL;
