-- Create 3 client accounts (paste into Supabase SQL Editor → Run)
-- Password for all: ClientPass1!
-- After running, the trigger will create profiles; clients can sign in at /login

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_instance_id UUID := COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid);
  v_pw TEXT := crypt('ClientPass1!', gen_salt('bf'));
  v_id1 UUID := gen_random_uuid();
  v_id2 UUID := gen_random_uuid();
  v_id3 UUID := gen_random_uuid();
BEGIN
  -- 1. Naoufal Mono – mono3249@qbox.ma (2000-05-12)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_id1, v_instance_id, 'authenticated', 'authenticated', 'mono3249@qbox.ma', v_pw,
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Naoufal","last_name":"Mono","date_of_birth":"2000-05-12","role":"client"}'::jsonb,
    now(), now()
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (v_id1, v_id1, format('{"sub":"%s","email":"mono3249@qbox.ma"}', v_id1)::jsonb, 'email', v_id1::text, now(), now());

  -- 2. Saad Akku – akku3249@qbox.ma (2001-08-23)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_id2, v_instance_id, 'authenticated', 'authenticated', 'akku3249@qbox.ma', v_pw,
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Saad","last_name":"Akku","date_of_birth":"2001-08-23","role":"client"}'::jsonb,
    now(), now()
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (v_id2, v_id2, format('{"sub":"%s","email":"akku3249@qbox.ma"}', v_id2)::jsonb, 'email', v_id2::text, now(), now());

  -- 3. Taha Gucci – gucci3249@qbox.ma (2000-11-07)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_id3, v_instance_id, 'authenticated', 'authenticated', 'gucci3249@qbox.ma', v_pw,
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Taha","last_name":"Gucci","date_of_birth":"2000-11-07","role":"client"}'::jsonb,
    now(), now()
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (v_id3, v_id3, format('{"sub":"%s","email":"gucci3249@qbox.ma"}', v_id3)::jsonb, 'email', v_id3::text, now(), now());

  RAISE NOTICE 'Created 3 clients. Password: ClientPass1!';
END $$;
