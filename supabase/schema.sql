-- Supabase Schema Setup for Dedan Marshalls Rugby Team Website
-- Run this in the Supabase SQL Editor: https://app.supabase.com/project/ocyhnzyzahwlkxmngngy/sql/new

-- ============================================
-- CREATE PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  jersey_number INTEGER NOT NULL UNIQUE,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- CREATE MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  opponent TEXT NOT NULL,
  venue TEXT DEFAULT 'Home',
  format TEXT CHECK (format IN ('7s', '10s', '15s')) DEFAULT '15s',
  status TEXT CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')) DEFAULT 'scheduled',
  score_for INTEGER DEFAULT 0,
  score_against INTEGER DEFAULT 0,
  result TEXT CHECK (result IN ('pending', 'win', 'loss', 'draw', 'cancelled')) DEFAULT 'pending',
  lineup JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================
-- Allow anyone to view all profiles
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MATCHES TABLE POLICIES
-- ============================================
-- Allow anyone to view all matches
CREATE POLICY "Anyone can view matches"
  ON public.matches FOR SELECT
  USING (true);

-- Create admin helper - in Supabase, add these users to admin role
-- Admin check: (SELECT auth.jwt()->>'email' IN ('dedansrugby@gmail.com', 'admin@example.com'))

-- Allow authenticated users to create matches
CREATE POLICY "Authenticated users can create matches"
  ON public.matches FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update matches
CREATE POLICY "Authenticated users can update matches"
  ON public.matches FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete matches
CREATE POLICY "Authenticated users can delete matches"
  ON public.matches FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_jersey_number ON public.profiles(jersey_number);
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
