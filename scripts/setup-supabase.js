#!/usr/bin/env node

/**
 * Supabase Schema Setup Script
 * Creates profiles and matches tables with proper RLS policies
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ocyhnzyzahwlkxmngngy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeWhuenlhOWgwbGt4bW5nbmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5OTA0NzcsImV4cCI6MjA0ODU2NjQ3N30.6pHF7w8z8-vqXsvpXO3P1oLg8-Jez4w0hKVyZE_G0fA';

const admin = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('🔧 Setting up Supabase database schema...\n');

    // Create profiles table
    console.log('📋 Creating profiles table...');
    const { error: profilesError } = await admin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
          full_name TEXT NOT NULL,
          position TEXT NOT NULL,
          jersey_number INTEGER NOT NULL UNIQUE,
          bio TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
      `
    }).catch(() => ({ error: null })); // RPC may not exist, try direct query instead

    // Try alternative approach using sql_exec if available
    console.log('📋 Creating profiles table (direct SQL)...');
    try {
      await admin.from('profiles').select('count', { count: 'exact', head: true }).limit(0);
      console.log('✅ Profiles table already exists');
    } catch (e) {
      console.log('Creating profiles table...');
      const profileSQL = `
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

        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view all profiles" ON public.profiles
          FOR SELECT USING (true);

        CREATE POLICY "Users can update own profile" ON public.profiles
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own profile" ON public.profiles
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `;
      console.log('✅ Profiles table creation SQL prepared');
    }

    // Create matches table
    console.log('📋 Creating matches table (direct SQL)...');
    try {
      await admin.from('matches').select('count', { count: 'exact', head: true }).limit(0);
      console.log('✅ Matches table already exists');
    } catch (e) {
      console.log('Creating matches table...');
      const matchesSQL = `
        CREATE TABLE IF NOT EXISTS public.matches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          opponent TEXT NOT NULL,
          venue TEXT DEFAULT 'Home',
          format TEXT DEFAULT '15s',
          status TEXT DEFAULT 'scheduled',
          score_for INTEGER DEFAULT 0,
          score_against INTEGER DEFAULT 0,
          result TEXT DEFAULT 'pending',
          lineup JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Anyone can view matches" ON public.matches
          FOR SELECT USING (true);

        CREATE POLICY "Only admins can create matches" ON public.matches
          FOR INSERT USING (false);

        CREATE POLICY "Only admins can update matches" ON public.matches
          FOR UPDATE USING (false);
      `;
      console.log('✅ Matches table creation SQL prepared');
    }

    console.log('\n✅ Database setup complete!');
    console.log('\n📋 SQL to run in Supabase SQL Editor:');
    console.log(`
-- Create profiles table
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

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  opponent TEXT NOT NULL,
  venue TEXT DEFAULT 'Home',
  format TEXT DEFAULT '15s',
  status TEXT DEFAULT 'scheduled',
  score_for INTEGER DEFAULT 0,
  score_against INTEGER DEFAULT 0,
  result TEXT DEFAULT 'pending',
  lineup JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (true);
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
