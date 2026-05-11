-- SECURITY SETUP FOR GfG CM DASHBOARD
-- This script enables RLS and sets up CM/Admin access levels

-- 1. CLEANUP (Prevent "already exists" errors)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;
DROP POLICY IF EXISTS "Admins have full access to submissions" ON submissions;

DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can view tasks" ON tasks;
DROP POLICY IF EXISTS "Admins have full access to tasks" ON tasks;

DROP POLICY IF EXISTS "Anyone can view announcements" ON announcements;
DROP POLICY IF EXISTS "Admins have full access to announcements" ON announcements;

-- 2. ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES POLICIES
-- CM can see and edit only their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Admin can see and edit EVERYTHING
CREATE POLICY "Admins have full access to profiles" 
ON profiles FOR ALL 
USING (auth.jwt() ->> 'email' LIKE '%@geeksforgeeks.org');

-- 4. SUBMISSIONS POLICIES
-- CM can see and create their own submissions
CREATE POLICY "Users can view own submissions" 
ON submissions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions" 
ON submissions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin can review and delete all submissions
CREATE POLICY "Admins have full access to submissions" 
ON submissions FOR ALL 
USING (auth.jwt() ->> 'email' LIKE '%@geeksforgeeks.org');

-- 5. TASKS POLICIES
-- Everyone logged in can see tasks
CREATE POLICY "Anyone can view tasks" 
ON tasks FOR SELECT 
USING (auth.role() = 'authenticated');

-- Only Admins can Create/Update/Delete tasks
CREATE POLICY "Admins have full access to tasks" 
ON tasks FOR ALL 
USING (auth.jwt() ->> 'email' LIKE '%@geeksforgeeks.org');

-- 6. ANNOUNCEMENTS POLICIES
-- Everyone logged in can see announcements
CREATE POLICY "Anyone can view announcements" 
ON announcements FOR SELECT 
USING (auth.role() = 'authenticated');

-- Only Admins can Create/Update/Delete announcements
CREATE POLICY "Admins have full access to announcements" 
ON announcements FOR ALL 
USING (auth.jwt() ->> 'email' LIKE '%@geeksforgeeks.org');
