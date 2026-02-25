-- Keep profiles.email for real emails only; phone-only users get NULL email.
-- Auth still uses synthetic email (ph_xxx@qbox.app) in auth.users for sign-in.

-- 1. Backfill: clear synthetic emails from profiles (phone stays in profiles.phone)
UPDATE profiles
SET email = NULL
WHERE email LIKE 'ph_%@qbox.app';

-- 2. Trigger: set profiles.email from real email only
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  real_email TEXT;
BEGIN
  -- Use metadata email if present and not synthetic; else auth email only if real
  real_email := NULLIF(TRIM(NEW.raw_user_meta_data->>'email'), '');
  IF real_email IS NULL AND (NEW.email IS NULL OR NEW.email NOT LIKE 'ph_%@qbox.app') THEN
    real_email := NEW.email;
  ELSIF real_email IS NOT NULL AND real_email LIKE 'ph_%@qbox.app' THEN
    real_email := NULL;
  END IF;

  INSERT INTO public.profiles (id, role, first_name, last_name, email, phone, date_of_birth)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'client'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    real_email,
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Index for login lookup by phone
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
