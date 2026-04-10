-- ============================================================================
-- V4 Base Schema Migration
-- Date: 2026-02-06
-- Purpose: Create core tables for V4 auth system
-- ============================================================================

-- ============================================================================
-- Table: machines
-- Purpose: Hardware-locked machine registrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hardware_signature TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),

  -- V4 additions (will be added by later migrations if not present)
  trial_actions_used INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  blocked_at TIMESTAMPTZ
);

-- Index for fast hardware signature lookups
CREATE INDEX IF NOT EXISTS idx_machines_hardware_signature
  ON public.machines(hardware_signature);

-- Partial index for blocked machines
CREATE INDEX IF NOT EXISTS idx_machines_blocked
  ON public.machines(is_blocked)
  WHERE is_blocked = true;

-- ============================================================================
-- Table: licenses
-- Purpose: License keys (trial, beta, supporter, pro)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'trial', 'beta', 'supporter', 'pro'

  -- Ownership
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,

  -- Status
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  -- Validity
  expires_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_licenses_key ON public.licenses(key);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON public.licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_machine_id ON public.licenses(machine_id);
CREATE INDEX IF NOT EXISTS idx_licenses_type ON public.licenses(type);

-- Index for finding available trial/beta keys
CREATE INDEX IF NOT EXISTS idx_licenses_available
  ON public.licenses(type, created_at)
  WHERE user_id IS NULL
    AND machine_id IS NULL
    AND is_revoked = false;

-- ============================================================================
-- Table: audit_log
-- Purpose: Track all license operations for security and debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  user_id UUID,
  machine_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON public.audit_log(action);

-- ============================================================================
-- Table: invite_links
-- Purpose: Trackable invite links for beta key distribution
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,

  -- Tracking
  clicks INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by TEXT,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_invite_links_code
  ON public.invite_links(code);

-- ============================================================================
-- View: available_trial_keys
-- Purpose: Find unassigned trial keys (used by trial-assign edge function)
-- ============================================================================

CREATE OR REPLACE VIEW public.available_trial_keys AS
SELECT
  id,
  key,
  created_at,
  expires_at
FROM public.licenses
WHERE type = 'trial'
  AND user_id IS NULL
  AND machine_id IS NULL
  AND is_revoked = false
  AND (expires_at IS NULL OR expires_at > now())
ORDER BY created_at ASC;

-- ============================================================================
-- RLS Policies (Security)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;

-- Machines: Only service role can read/write
DROP POLICY IF EXISTS "Service role full access" ON public.machines;
CREATE POLICY "Service role full access"
  ON public.machines FOR ALL
  USING (auth.role() = 'service_role');

-- Licenses: Only service role can read/write
DROP POLICY IF EXISTS "Service role full access" ON public.licenses;
CREATE POLICY "Service role full access"
  ON public.licenses FOR ALL
  USING (auth.role() = 'service_role');

-- Audit log: Only service role can write, read own records
DROP POLICY IF EXISTS "Service role full access" ON public.audit_log;
CREATE POLICY "Service role full access"
  ON public.audit_log FOR ALL
  USING (auth.role() = 'service_role');

-- Invite links: Only service role can read/write
DROP POLICY IF EXISTS "Service role full access" ON public.invite_links;
CREATE POLICY "Service role full access"
  ON public.invite_links FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Functions
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for licenses table
DROP TRIGGER IF EXISTS update_licenses_updated_at ON public.licenses;
CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE public.machines IS 'Hardware-locked machine registrations';
COMMENT ON TABLE public.licenses IS 'License keys for all tiers (trial, beta, supporter, pro)';
COMMENT ON TABLE public.audit_log IS 'Audit trail for all license operations';
COMMENT ON TABLE public.invite_links IS 'Trackable invite links for beta key distribution';
COMMENT ON VIEW public.available_trial_keys IS 'Unassigned, non-revoked trial keys for auto-assignment';
