-- Notify admin when a client creates a booking (from portal or elsewhere)
CREATE OR REPLACE FUNCTION public.notify_admin_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  station_name text;
  member_name text;
BEGIN
  SELECT name INTO station_name FROM public.stations WHERE id = NEW.station_id LIMIT 1;
  SELECT COALESCE(TRIM(first_name || ' ' || last_name), email, phone, 'A member')
    INTO member_name
    FROM public.profiles
    WHERE id = NEW.member_id
    LIMIT 1;

  INSERT INTO public.admin_notifications (title, message, type, link_url)
  VALUES (
    'New booking',
    COALESCE(member_name, 'A client') || ' booked ' || COALESCE(station_name, 'a station') || '.',
    'info',
    '/dashboard/sessions'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_booking_created_notify_admin ON bookings;
CREATE TRIGGER on_booking_created_notify_admin
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_booking();
