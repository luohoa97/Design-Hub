/*
  # Base Platform Schema

  ## Summary
  Creates the foundational tables for the Designly platform, migrated from the
  original Atelier Junior schema. This includes user profiles, teams, team membership,
  products, and orders.

  ## Tables
  1. `profiles` - Extended user profiles (id references auth.users)
  2. `teams` - Seller/creator teams with Stripe Connect
  3. `team_members` - Team membership and roles
  4. `products` - Legacy product listings (kept for compatibility)
  5. `orders` - Legacy order transactions

  ## Security
  - All tables have RLS enabled
  - Policies scope access by ownership and membership
*/

-- ============================================================
-- HELPER FUNCTION: update_updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  handle TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  website_url TEXT,
  instagram_url TEXT,
  role TEXT DEFAULT 'buyer',
  is_creator BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (is_creator = true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 2. TEAMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 3. TEAM MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_select" ON public.team_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.team_members tm2 WHERE tm2.team_id = team_members.team_id
    )
  );

CREATE POLICY "team_members_insert" ON public.team_members
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.team_members tm2
      WHERE tm2.team_id = team_members.team_id AND tm2.role IN ('owner', 'admin')
    ) OR auth.uid() = user_id
  );

CREATE POLICY "team_members_delete" ON public.team_members
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.team_members tm2
      WHERE tm2.team_id = team_members.team_id AND tm2.role = 'owner'
    )
  );

CREATE POLICY "teams_select" ON public.teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "teams_insert" ON public.teams
  FOR INSERT WITH CHECK (true);

CREATE POLICY "teams_update" ON public.teams
  FOR UPDATE USING (
    id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 4. PRODUCTS TABLE (legacy)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_published" ON public.products
  FOR SELECT USING (status = 'published');

CREATE POLICY "products_select_team" ON public.products
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "products_insert" ON public.products
  FOR INSERT WITH CHECK (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    AND auth.uid() = created_by
  );

CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "products_delete" ON public.products
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 5. ORDERS TABLE (legacy)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  customer_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select" ON public.orders
  FOR SELECT USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.team_members tm ON p.team_id = tm.team_id
      WHERE tm.user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
