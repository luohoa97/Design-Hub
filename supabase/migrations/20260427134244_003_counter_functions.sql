/*
  # Counter Helper Functions

  ## Summary
  Adds atomic increment/decrement functions for design counters
  (likes, saves, purchases). These are called from server actions
  and the Stripe webhook to keep counts in sync.

  ## Functions
  - increment_like_count(design_id)
  - decrement_like_count(design_id)
  - increment_save_count(design_id)
  - decrement_save_count(design_id)
  - increment_purchase_count(design_id)
*/

CREATE OR REPLACE FUNCTION public.increment_like_count(design_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.designs
  SET like_count = GREATEST(0, like_count + 1)
  WHERE id = design_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_like_count(design_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.designs
  SET like_count = GREATEST(0, like_count - 1)
  WHERE id = design_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_save_count(design_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.designs
  SET save_count = GREATEST(0, save_count + 1)
  WHERE id = design_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_save_count(design_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.designs
  SET save_count = GREATEST(0, save_count - 1)
  WHERE id = design_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_purchase_count(design_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.designs
  SET purchase_count = purchase_count + 1
  WHERE id = design_id;
END;
$$;
