-- Notify admin when a client joins a tournament (if settings allow)
CREATE OR REPLACE FUNCTION public.notify_admin_tournament_join()
RETURNS TRIGGER AS $$
DECLARE
  alerts_on boolean;
  t_name text;
BEGIN
  SELECT tournament_reminders INTO alerts_on FROM public.business_settings WHERE id = 1 LIMIT 1;
  IF NOT COALESCE(alerts_on, false) THEN
    RETURN NEW;
  END IF;
  SELECT name INTO t_name FROM public.tournaments WHERE id = NEW.tournament_id LIMIT 1;
  INSERT INTO public.admin_notifications (title, message, type, link_url)
  VALUES (
    'Client joined tournament',
    COALESCE(t_name, 'A tournament') || ' has a new registration.',
    'tournament',
    '/dashboard/tournaments'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_tournament_registration_notify_admin ON tournament_registrations;
CREATE TRIGGER on_tournament_registration_notify_admin
  AFTER INSERT ON tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_tournament_join();
