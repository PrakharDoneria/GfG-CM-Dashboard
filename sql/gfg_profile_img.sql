-- Run this SQL command in your Supabase SQL Editor to add the gfg_profile_img column to your profiles table.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gfg_profile_img TEXT;
