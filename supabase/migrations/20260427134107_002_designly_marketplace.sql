/*
  # Designly Marketplace Schema

  ## Summary
  Adds the full Designly marketplace layer: design listings, social interactions
  (likes, saves, follows), purchases with commission tracking, comments, reports,
  and impact allocation ledger.

  ## New Tables
  1. `designs` - Marketplace design listings with full status workflow
  2. `follows` - Creator follow relationships
  3. `design_likes` - Design like interactions
  4. `design_saves` - Design save/bookmark interactions
  5. `purchases` - Purchase transactions with platform fee + impact allocation tracking
  6. `comments` - Design comments
  7. `reports` - Content/user moderation reports
  8. `impact_allocations` - Ledger: 10% of platform commission allocated toward young designers in Africa

  ## Security
  - All tables RLS enabled
  - Public: only published designs + public creator profiles
  - Buyers: can access their own purchases/saves/likes
  - Creators: can manage their own designs
  - Admins: full moderation access
  - Webhook/service role: insert purchases and impact allocations

  ## Notes
  1. Impact allocations are ledger-tracked only — not real Stripe transfers
  2. Design slugs unique for URL routing (/designs/[slug])
  3. Purchase idempotency enforced via UNIQUE on stripe_checkout_session_id
*/

-- ============================================================
-- 1. DESIGNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'uncategorized',
  tags TEXT[] DEFAULT '{}',
  preview_image_urls TEXT[] DEFAULT '{}',
  asset_url TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'aud',
  licence_type TEXT NOT NULL DEFAULT 'personal' CHECK (licence_type IN ('personal', 'commercial', 'exclusive')),
  licence_summary TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'hidden', 'rejected', 'archived')),
  like_count INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,
  purchase_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "designs_select_published" ON public.designs
  FOR SELECT USING (status = 'published');

CREATE POLICY "designs_select_own" ON public.designs
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "designs_select_admin" ON public.designs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "designs_insert_own" ON public.designs
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "designs_update_own" ON public.designs
  FOR UPDATE USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "designs_update_admin" ON public.designs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "designs_delete_own" ON public.designs
  FOR DELETE USING (
    creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE TRIGGER designs_updated_at
  BEFORE UPDATE ON public.designs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS designs_creator_id_idx ON public.designs(creator_id);
CREATE INDEX IF NOT EXISTS designs_status_idx ON public.designs(status);
CREATE INDEX IF NOT EXISTS designs_slug_idx ON public.designs(slug);
CREATE INDEX IF NOT EXISTS designs_category_idx ON public.designs(category);
CREATE INDEX IF NOT EXISTS designs_created_at_idx ON public.designs(created_at DESC);

-- ============================================================
-- 2. FOLLOWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, creator_id),
  CHECK (follower_id <> creator_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select" ON public.follows
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "follows_insert" ON public.follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "follows_delete" ON public.follows
  FOR DELETE USING (follower_id = auth.uid());

CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_creator_id_idx ON public.follows(creator_id);

-- ============================================================
-- 3. DESIGN LIKES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.design_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, design_id)
);

ALTER TABLE public.design_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "design_likes_select" ON public.design_likes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "design_likes_insert" ON public.design_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "design_likes_delete" ON public.design_likes
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS design_likes_user_id_idx ON public.design_likes(user_id);
CREATE INDEX IF NOT EXISTS design_likes_design_id_idx ON public.design_likes(design_id);

-- ============================================================
-- 4. DESIGN SAVES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.design_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, design_id)
);

ALTER TABLE public.design_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "design_saves_select" ON public.design_saves
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "design_saves_insert" ON public.design_saves
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "design_saves_delete" ON public.design_saves
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS design_saves_user_id_idx ON public.design_saves(user_id);
CREATE INDEX IF NOT EXISTS design_saves_design_id_idx ON public.design_saves(design_id);

-- ============================================================
-- 5. PURCHASES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  design_id UUID NOT NULL REFERENCES public.designs(id),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  creator_amount_cents INTEGER NOT NULL DEFAULT 0,
  impact_allocation_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'aud',
  licence_type TEXT NOT NULL DEFAULT 'personal',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchases_select_buyer" ON public.purchases
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "purchases_select_creator" ON public.purchases
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "purchases_select_admin" ON public.purchases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "purchases_insert" ON public.purchases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "purchases_update_admin" ON public.purchases
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE TRIGGER purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS purchases_buyer_id_idx ON public.purchases(buyer_id);
CREATE INDEX IF NOT EXISTS purchases_design_id_idx ON public.purchases(design_id);
CREATE INDEX IF NOT EXISTS purchases_creator_id_idx ON public.purchases(creator_id);
CREATE INDEX IF NOT EXISTS purchases_stripe_session_id_idx ON public.purchases(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS purchases_status_idx ON public.purchases(status);

-- ============================================================
-- 6. COMMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 2000),
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_visible" ON public.comments
  FOR SELECT USING (
    status = 'visible'
    AND EXISTS (SELECT 1 FROM public.designs WHERE id = design_id AND status = 'published')
  );

CREATE POLICY "comments_select_own" ON public.comments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "comments_select_admin" ON public.comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.designs WHERE id = design_id AND status = 'published')
  );

CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "comments_update_admin" ON public.comments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "comments_delete_own" ON public.comments
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS comments_design_id_idx ON public.comments(design_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);

-- ============================================================
-- 7. REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select_reporter" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "reports_select_admin" ON public.reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "reports_insert" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "reports_update_admin" ON public.reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_design_id_idx ON public.reports(design_id);

-- ============================================================
-- 8. IMPACT ALLOCATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.impact_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'aud',
  cause TEXT NOT NULL DEFAULT 'young_designers_africa',
  status TEXT NOT NULL DEFAULT 'allocated' CHECK (status IN ('allocated', 'disbursed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.impact_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "impact_allocations_select_admin" ON public.impact_allocations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "impact_allocations_insert" ON public.impact_allocations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "impact_allocations_update_admin" ON public.impact_allocations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE TRIGGER impact_allocations_updated_at
  BEFORE UPDATE ON public.impact_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS impact_allocations_purchase_id_idx ON public.impact_allocations(purchase_id);
CREATE INDEX IF NOT EXISTS impact_allocations_status_idx ON public.impact_allocations(status);
