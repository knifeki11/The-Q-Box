-- Admin notifications: shown in dashboard header dropdown
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('session_alert', 'low_station', 'tournament', 'revenue', 'new_member', 'maintenance', 'info')),
  link_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- Per-admin read state (dashboard users are profiles with role = 'admin')
CREATE TABLE IF NOT EXISTS admin_notification_reads (
  notification_id UUID NOT NULL REFERENCES admin_notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_notification_reads_user ON admin_notification_reads(user_id);

-- Allow service_role and authenticated admins to manage notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notification_reads ENABLE ROW LEVEL SECURITY;

-- Admins can read all notifications; service can do everything
CREATE POLICY "admin_notifications_select" ON admin_notifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
CREATE POLICY "admin_notifications_service" ON admin_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_notification_reads_select" ON admin_notification_reads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin_notification_reads_insert" ON admin_notification_reads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_notification_reads_service" ON admin_notification_reads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed one welcome notification so the dropdown shows real data
INSERT INTO admin_notifications (title, message, type, link_url)
SELECT 'Welcome to Qbox Dashboard', 'Use the sidebar to manage stations, members, sessions, and more. Notifications will appear here.', 'info', '/dashboard'
WHERE NOT EXISTS (SELECT 1 FROM admin_notifications LIMIT 1);

-- Create admin notification when a new member (profile) is created, if settings allow
CREATE OR REPLACE FUNCTION public.notify_admin_new_member()
RETURNS TRIGGER AS $$
DECLARE
  alerts_on boolean;
BEGIN
  SELECT new_member_alerts INTO alerts_on FROM public.business_settings WHERE id = 1 LIMIT 1;
  IF COALESCE(alerts_on, false) THEN
    INSERT INTO public.admin_notifications (title, message, type, link_url)
    VALUES ('New member', 'A new member has signed up.', 'new_member', '/dashboard/members');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_created_notify_admin ON profiles;
CREATE TRIGGER on_profile_created_notify_admin
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_member();
