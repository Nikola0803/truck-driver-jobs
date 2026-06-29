-- ============================================================
-- Migration: Facebook groups seed + recruitment_groups updates
-- ============================================================

-- 1. Extend recruitment_groups with posting-specific columns
ALTER TABLE recruitment_groups
  ADD COLUMN IF NOT EXISTS fb_group_id   TEXT,
  ADD COLUMN IF NOT EXISTS post_method   TEXT    DEFAULT 'playwright',
  ADD COLUMN IF NOT EXISTS posts_count   INT     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_post_status TEXT,
  ADD COLUMN IF NOT EXISTS last_post_error  TEXT;

-- Update last_posted_at column type to timestamptz if not already
ALTER TABLE recruitment_groups
  ALTER COLUMN last_posted_at TYPE TIMESTAMPTZ
  USING last_posted_at AT TIME ZONE 'UTC';

-- 2. Helper RPC used by the publisher Edge Function
CREATE OR REPLACE FUNCTION increment_group_posts(g_id BIGINT, p_status TEXT DEFAULT 'success', p_error TEXT DEFAULT NULL)
RETURNS void AS $$
  UPDATE recruitment_groups
  SET
    posts_count       = COALESCE(posts_count, 0) + 1,
    last_post_status  = p_status,
    last_post_error   = p_error,
    last_posted_at    = NOW(),
    updated_at        = NOW()
  WHERE id = g_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Seed all 27 Facebook groups
--    Names are placeholders — update in /admin/groups once you know the group names.
INSERT INTO recruitment_groups
  (name, platform, url, fb_group_id, post_method, allows_posts, status, priority, category, notes)
VALUES
  ('Truck Drivers USA (Main)',         'facebook', 'https://www.facebook.com/groups/921396095025365/', '921396095025365',     'playwright', true, 'active', 'high',   'All',      'Large general trucking group'),
  ('CDL Drivers Network A',            'facebook', 'https://www.facebook.com/groups/228370191915023/', '228370191915023',     'playwright', true, 'active', 'medium', 'All',      NULL),
  ('CDL Drivers Network B',            'facebook', 'https://www.facebook.com/groups/281673173137216/', '281673173137216',     'playwright', true, 'active', 'medium', 'All',      NULL),
  ('Trucking Jobs USA',                'facebook', 'https://www.facebook.com/groups/960541557304112/', '960541557304112',     'playwright', true, 'active', 'high',   'All',      NULL),
  ('OTR Driver Community',             'facebook', 'https://www.facebook.com/groups/3352268341755388/','3352268341755388',    'playwright', true, 'active', 'medium', 'OTR',      NULL),
  ('CDL Class A Jobs',                 'facebook', 'https://www.facebook.com/groups/1696754780792367/','1696754780792367',    'playwright', true, 'active', 'high',   'All',      NULL),
  ('Truck Drivers US (Community)',     'facebook', 'https://www.facebook.com/groups/truckdriversus/',  'truckdriversus',      'playwright', true, 'active', 'high',   'All',      NULL),
  ('Trucking Network 847',             'facebook', 'https://www.facebook.com/groups/847284725411510/', '847284725411510',     'playwright', true, 'active', 'medium', 'All',      NULL),
  ('Dispatch USA Serbia',              'facebook', 'https://www.facebook.com/groups/dispatch.usa.serbia/','dispatch.usa.serbia','playwright',true, 'active', 'high',   'All',      'Serbian-American trucking community'),
  ('CDL Drivers Group 631',            'facebook', 'https://www.facebook.com/groups/631222537837962/', '631222537837962',     'playwright', true, 'active', 'medium', 'All',      NULL),
  ('Trucking Jobs Board 569',          'facebook', 'https://www.facebook.com/groups/569318286799430/', '569318286799430',     'playwright', true, 'active', 'medium', 'All',      NULL),
  ('CDL Hiring Now 491',               'facebook', 'https://www.facebook.com/groups/491424409772481/', '491424409772481',     'playwright', true, 'active', 'medium', 'All',      NULL),
  ('Best Trucking Jobs',               'facebook', 'https://www.facebook.com/groups/besttruckingjobs/', 'besttruckingjobs',   'playwright', true, 'active', 'high',   'All',      NULL),
  ('Trucking Jobs Network 1266',       'facebook', 'https://www.facebook.com/groups/1266755550686851/','1266755550686851',    'playwright', true, 'active', 'medium', 'All',      NULL),
  ('OTR Jobs Community 952',           'facebook', 'https://www.facebook.com/groups/952610268155885/', '952610268155885',     'playwright', true, 'active', 'medium', 'OTR',      NULL),
  ('Trucking Job',                     'facebook', 'https://www.facebook.com/groups/truckingjob/',     'truckingjob',         'playwright', true, 'active', 'high',   'All',      NULL),
  ('CDL Community 254',                'facebook', 'https://www.facebook.com/groups/254167063171544/', '254167063171544',     'playwright', true, 'active', 'medium', 'All',      NULL),
  ('USA Trucking',                     'facebook', 'https://www.facebook.com/groups/usatruckingg/',    'usatruckingg',        'playwright', true, 'active', 'high',   'All',      NULL),
  ('Truckers Network 1531',            'facebook', 'https://www.facebook.com/groups/1531705420974366/','1531705420974366',    'playwright', true, 'active', 'medium', 'All',      NULL),
  ('CDL Hiring 1404',                  'facebook', 'https://www.facebook.com/groups/1404824917072635/','1404824917072635',    'playwright', true, 'active', 'medium', 'All',      NULL),
  ('K1 Trans Freight Inc',             'facebook', 'https://www.facebook.com/groups/k1transfreightinc/','k1transfreightinc',  'playwright', true, 'active', 'medium', 'All',      'Company-specific group'),
  ('Kolegijalnost (Serbian Truckers)', 'facebook', 'https://www.facebook.com/groups/kolegijalnost/',  'kolegijalnost',       'playwright', true, 'active', 'high',   'All',      'Serbian trucking community — post in Serbian too'),
  ('Box Trucks',                       'facebook', 'https://www.facebook.com/groups/boxtrucks/',       'boxtrucks',           'playwright', true, 'active', 'medium', 'Local',    'Box truck / sprinter drivers'),
  ('CDL Drivers 2274',                 'facebook', 'https://www.facebook.com/groups/2274711102555387/','2274711102555387',    'playwright', true, 'active', 'medium', 'All',      NULL),
  ('Trucking Community 180',           'facebook', 'https://www.facebook.com/groups/180574302419995/', '180574302419995',     'playwright', true, 'active', 'medium', 'All',      NULL),
  ('Truck Drivers Network 1975',       'facebook', 'https://www.facebook.com/groups/1975285256161053/','1975285256161053',    'playwright', true, 'active', 'medium', 'All',      NULL),
  ('CDL Jobs Community 1746',          'facebook', 'https://www.facebook.com/groups/1746800759092046/','1746800759092046',    'playwright', true, 'active', 'medium', 'All',      NULL)
ON CONFLICT DO NOTHING;

-- 4. Add queued_posts status value 'publishing' (in-progress guard)
--    (No enum change needed — status is TEXT)

-- 5. Schedule the publisher Edge Function every 5 minutes via pg_cron
--    Requires pg_cron extension enabled in Supabase (Dashboard → Extensions).
--    Replace YOUR_SUPABASE_PROJECT_REF with your actual project ref.
--    Run this AFTER deploying the publisher Edge Function.

-- SELECT cron.schedule(
--   'publish-queued-posts',
--   '*/5 * * * *',
--   $$
--     SELECT net.http_post(
--       url := 'https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/publisher',
--       headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
--       body := '{}'::jsonb
--     ) AS request_id;
--   $$
-- );
