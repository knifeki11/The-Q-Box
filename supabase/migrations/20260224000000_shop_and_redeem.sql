-- Shop: rewards visible in portal; admin can enable/disable
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Tier rank for eligibility (silver=0, gold=1, black=2)
CREATE OR REPLACE FUNCTION public.tier_rank(tier_id text)
RETURNS int AS $$
  SELECT CASE tier_id
    WHEN 'silver' THEN 0
    WHEN 'gold' THEN 1
    WHEN 'black' THEN 2
    ELSE -1
  END;
$$ LANGUAGE sql IMMUTABLE;

-- Redeem reward: deduct points and record redemption (atomic)
CREATE OR REPLACE FUNCTION public.redeem_reward(p_reward_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_points int;
  v_tier text;
  v_cost int;
  v_tier_required text;
  v_reward_name text;
BEGIN
  v_member_id := auth.uid();
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT points, card_tier_id INTO v_points, v_tier
  FROM profiles WHERE id = v_member_id;
  IF v_points IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Profile not found');
  END IF;

  SELECT points_cost, tier_required, name
  INTO v_cost, v_tier_required, v_reward_name
  FROM rewards WHERE id = p_reward_id AND active = true;
  IF v_cost IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Reward not found or not available');
  END IF;

  IF tier_rank(v_tier) < tier_rank(v_tier_required) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tier too low for this reward');
  END IF;

  IF v_points < v_cost THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not enough points');
  END IF;

  UPDATE profiles SET points = points - v_cost WHERE id = v_member_id;
  INSERT INTO reward_redemptions (member_id, reward_id, points_spent)
  VALUES (v_member_id, p_reward_id, v_cost);

  RETURN jsonb_build_object('ok', true, 'points_spent', v_cost, 'reward_name', v_reward_name);
END;
$$;

-- Notify admin when a client redeems a reward
CREATE OR REPLACE FUNCTION public.notify_admin_reward_redemption()
RETURNS TRIGGER AS $$
DECLARE
  member_name text;
  reward_name text;
BEGIN
  SELECT COALESCE(TRIM(p.first_name || ' ' || p.last_name), p.email, p.phone, 'A member')
  INTO member_name FROM profiles p WHERE p.id = NEW.member_id LIMIT 1;
  SELECT name INTO reward_name FROM rewards WHERE id = NEW.reward_id LIMIT 1;

  INSERT INTO public.admin_notifications (title, message, type, link_url)
  VALUES (
    'Shop redemption',
    COALESCE(member_name, 'A client') || ' redeemed "' || COALESCE(reward_name, 'reward') || '" for ' || NEW.points_spent || ' points.',
    'revenue',
    '/dashboard/shop'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_reward_redemption_notify_admin ON reward_redemptions;
CREATE TRIGGER on_reward_redemption_notify_admin
  AFTER INSERT ON reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_reward_redemption();

-- Allow authenticated to call redeem_reward (for own user only, enforced inside function)
GRANT EXECUTE ON FUNCTION public.redeem_reward(uuid) TO authenticated;
