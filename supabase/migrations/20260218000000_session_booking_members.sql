-- Session participants (multiple clients per session for points distribution)
CREATE TABLE IF NOT EXISTS session_members (
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_session_members_session ON session_members(session_id);
CREATE INDEX IF NOT EXISTS idx_session_members_member ON session_members(member_id);

-- Booking participants (multiple clients per reservation)
CREATE TABLE IF NOT EXISTS booking_members (
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (booking_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_booking_members_booking ON booking_members(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_members_member ON booking_members(member_id);
