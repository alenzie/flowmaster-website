CREATE SCHEMA analytics;
-- statement-break
REVOKE ALL ON SCHEMA analytics FROM PUBLIC;
-- statement-break
CREATE TABLE analytics.web_events (
  event_id uuid NOT NULL,
  environment text NOT NULL CHECK (environment IN ('production','preview')),
  site text NOT NULL CHECK (site IN ('flowmaster','spindle','portfolio')),
  kind text NOT NULL CHECK (kind IN ('page_view','download_click','outbound_click')),
  path text NOT NULL CHECK (length(path) <= 160),
  referrer text NOT NULL DEFAULT '' CHECK (length(referrer) <= 120),
  device text NOT NULL CHECK (device IN ('mobile','desktop','unknown')),
  campaign text NOT NULL DEFAULT '' CHECK (length(campaign) <= 80),
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (environment, site, event_id)
);
-- statement-break
CREATE INDEX web_events_time ON analytics.web_events (environment, site, received_at DESC);
-- statement-break
CREATE TABLE analytics.admission (
  environment text NOT NULL,
  site text NOT NULL,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  used integer NOT NULL DEFAULT 0,
  PRIMARY KEY (environment, site, bucket, window_start)
);
-- statement-break
CREATE TABLE analytics.web_daily (
  day date NOT NULL,
  environment text NOT NULL,
  site text NOT NULL,
  kind text NOT NULL,
  path text NOT NULL,
  referrer text NOT NULL,
  device text NOT NULL,
  campaign text NOT NULL,
  events bigint NOT NULL,
  PRIMARY KEY (day, environment, site, kind, path, referrer, device, campaign)
);
-- statement-break
CREATE TABLE analytics.app_events (
  id uuid NOT NULL,
  environment text NOT NULL CHECK (environment IN ('production','preview')),
  source text NOT NULL DEFAULT 'flowmaster_app' CHECK (source = 'flowmaster_app'),
  user_id uuid,
  machine_id uuid,
  license_id uuid,
  activity_type text NOT NULL CHECK (length(activity_type) BETWEEN 1 AND 100),
  details jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(details) = 'object' AND octet_length(details::text) <= 16384),
  created_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (environment,id)
);
-- statement-break
CREATE INDEX app_events_time ON analytics.app_events (environment, created_at DESC, id);
-- statement-break
CREATE INDEX app_events_account ON analytics.app_events (environment, user_id, created_at DESC);
-- statement-break
ALTER TABLE analytics.web_events ENABLE ROW LEVEL SECURITY;
-- statement-break
ALTER TABLE analytics.app_events ENABLE ROW LEVEL SECURITY;
-- statement-break
ALTER TABLE analytics.web_daily ENABLE ROW LEVEL SECURITY;
-- statement-break
ALTER TABLE analytics.admission ENABLE ROW LEVEL SECURITY;
-- statement-break
CREATE FUNCTION analytics.collect_web(p_id uuid, p_environment text, p_site text,
  p_kind text, p_path text, p_referrer text, p_device text, p_campaign text, p_bucket text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, analytics AS $$
DECLARE n integer; minute_start timestamptz := date_trunc('minute', now());
  day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  IF p_environment NOT IN ('production','preview') OR p_site NOT IN ('flowmaster','spindle','portfolio')
    OR p_bucket !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid admission parameters'; END IF;
  -- Daily row lock serializes admission and duplicate checks for this site.
  INSERT INTO analytics.admission VALUES (p_environment,p_site,'daily',day_start,0) ON CONFLICT DO NOTHING;
  PERFORM 1 FROM analytics.admission WHERE environment=p_environment AND site=p_site AND bucket='daily' AND window_start=day_start FOR UPDATE;
  IF EXISTS (SELECT FROM analytics.web_events WHERE environment=p_environment AND site=p_site AND event_id=p_id) THEN RETURN 'duplicate'; END IF;
  SELECT used INTO n FROM analytics.admission WHERE environment=p_environment AND site=p_site AND bucket='daily' AND window_start=day_start;
  IF n >= 10000 THEN RETURN 'limited'; END IF;
  INSERT INTO analytics.admission VALUES (p_environment,p_site,p_bucket,minute_start,0) ON CONFLICT DO NOTHING;
  UPDATE analytics.admission SET used=used+1 WHERE environment=p_environment AND site=p_site AND bucket=p_bucket AND window_start=minute_start AND used < 30;
  IF NOT FOUND THEN RETURN 'limited'; END IF;
  UPDATE analytics.admission SET used=used+1 WHERE environment=p_environment AND site=p_site AND bucket='daily' AND window_start=day_start;
  INSERT INTO analytics.web_events(event_id,environment,site,kind,path,referrer,device,campaign)
    VALUES(p_id,p_environment,p_site,p_kind,p_path,p_referrer,p_device,p_campaign);
  RETURN 'accepted';
END $$;
-- statement-break
REVOKE ALL ON FUNCTION analytics.collect_web(uuid,text,text,text,text,text,text,text,text) FROM PUBLIC;
-- statement-break
CREATE FUNCTION analytics.retain_web() RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, analytics AS $$
DECLARE moved bigint;
BEGIN
  WITH removed AS (
    DELETE FROM analytics.web_events WHERE received_at < ((now() AT TIME ZONE 'UTC')::date - 30)::timestamp AT TIME ZONE 'UTC' RETURNING *
  ), rolled AS (
    INSERT INTO analytics.web_daily
      SELECT (received_at AT TIME ZONE 'UTC')::date,environment,site,kind,path,referrer,device,campaign,count(*) FROM removed GROUP BY 1,2,3,4,5,6,7,8
    ON CONFLICT (day,environment,site,kind,path,referrer,device,campaign)
    DO UPDATE SET events=analytics.web_daily.events+EXCLUDED.events RETURNING events
  ) SELECT coalesce(sum(events),0) INTO moved FROM rolled;
  DELETE FROM analytics.web_daily WHERE day < (now() AT TIME ZONE 'UTC')::date - interval '13 months';
  DELETE FROM analytics.admission WHERE window_start < now()-interval '2 days';
  -- App history has a separate retention decision; never purge it here.
  RETURN moved;
END $$;
-- statement-break
REVOKE ALL ON FUNCTION analytics.retain_web() FROM PUBLIC;
