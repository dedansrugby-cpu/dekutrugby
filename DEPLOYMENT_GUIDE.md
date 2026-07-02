# Vercel Deployment Guide for Dedan Marshalls Rugby Website

## Quick Deployment Steps

### Option 1: Deploy via GitHub (Recommended - Automatic)

1. **Go to** https://vercel.com/dashboard
2. **Click** "New Project"
3. **Select** "Import Git Repository"
4. **Paste** this URL: `https://github.com/dedansrugby-cpu/dekutrugby`
5. **Click** "Continue"
6. **Configure Project:**
   - Framework: `Next.js` (auto-detected)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

7. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add these variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL = https://ocyhnzyzahwlkxmngngy.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_58AEN-aTnoJiU0FguWy08w_MaZapItE
     NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = f80rob8p
     NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = dekutrugby
     ```

8. **Click** "Deploy"
9. **Wait** for deployment to complete (2-5 minutes)
10. **Get Your Live URL** from the deployment success page

### Option 2: Deploy via CLI (After Authentication)

```bash
cd c:\Users\HP\Desktop\dekutrugbyweb
npm install -g vercel
vercel login  # Authenticate with GitHub
vercel --prod  # Deploy to production
```

## Post-Deployment Setup

### 1. Update Supabase Schema (CRITICAL)

Go to https://app.supabase.com/project/ocyhnzyzahwlkxmngngy/sql/new

Copy and paste this SQL, then execute:

```sql
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_jersey_number ON public.profiles(jersey_number);
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
```

### 2. Set Up Supabase Auth Redirects

In Supabase Console:
1. Go to **Authentication > URL Configuration**
2. Add Redirect URLs:
   ```
   https://your-vercel-url.vercel.app/profile
   https://your-vercel-url.vercel.app/login
   ```
3. Replace `your-vercel-url` with your actual Vercel deployment URL

### 3. Test the Application

- **Home:** https://your-vercel-url.vercel.app
- **Team Roster:** https://your-vercel-url.vercel.app/team
- **Login:** https://your-vercel-url.vercel.app/login
- **Admin Dashboard:** https://your-vercel-url.vercel.app/admin (email: dedansrugby@gmail.com)

## Troubleshooting

### Build Fails
- Check that all environment variables are set
- Ensure GitHub repo is up to date: `git push`

### Authentication Issues
- Verify Supabase anon key is correct in .env.local
- Check Supabase URL configuration matches

### Admin Dashboard Access Denied
- Use email: `dedansrugby@gmail.com` to log in
- Other emails cannot access /admin route

## Your Deployment URLs

After deployment, you'll get:
- **Production URL:** `https://your-project-name.vercel.app`
- **Git URL:** `https://github.com/dedansrugby-cpu/dekutrugby`
- **Supabase:** `https://ocyhnzyzahwlkxmngngy.supabase.co`

## Monitoring & Updates

- **Auto-deploys:** Every push to GitHub main branch auto-deploys
- **View Deployments:** https://vercel.com/dashboard
- **Logs:** https://vercel.com/dashboard/your-project/deployments
