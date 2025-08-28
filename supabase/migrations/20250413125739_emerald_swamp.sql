/*
  # Add admin user if not exists

  1. Changes
    - Create admin user with specified email and password if it doesn't already exist
    - Create corresponding profile record if needed
*/

DO $$
DECLARE
  admin_uid uuid;
  existing_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'thejoeycagle@gmail.com';

  -- Only create user if they don't exist
  IF existing_user_id IS NULL THEN
    -- Insert admin user into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone_change,
      phone_change_token,
      phone,
      phone_confirmed_at,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'thejoeycagle@gmail.com',
      crypt('LastPassword1$', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      FALSE,
      '',
      '',
      '',
      '',
      '',
      '',
      NULL,
      NULL,
      NULL,
      '',
      NULL,
      FALSE,
      NULL
    )
    RETURNING id INTO admin_uid;

    -- Create profile for admin user if it doesn't exist
    INSERT INTO public.profiles (id, email, created_at)
    VALUES (admin_uid, 'thejoeycagle@gmail.com', NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;