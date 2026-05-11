-- 1. Automatic Profile Creation Trigger
-- This function will run every time a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, college_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'college_name',
    CASE 
      WHEN new.email LIKE '%@geeksforgeeks.org' THEN 'admin' 
      ELSE 'cm' 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Manually Promote Your Account
-- Run this if you have already signed up/logged in once
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'prakhardoneria@geeksforgeeks.org';

-- 3. Verify
SELECT * FROM public.profiles WHERE email = 'prakhardoneria@geeksforgeeks.org';
