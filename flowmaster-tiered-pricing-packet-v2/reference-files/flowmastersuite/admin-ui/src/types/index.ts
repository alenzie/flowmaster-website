// User roles
export type UserRole = 'admin' | 'scout'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  scoutId?: string
  scoutUsername?: string
}

export type LicenseType = 'trial' | 'beta' | 'scout' | 'supporter' | 'pro'

export interface License {
  id: string
  key: string
  type: LicenseType
  user_id: string | null
  machine_id: string | null
  is_revoked: boolean
  revoked_at: string | null
  revoked_reason: string | null
  created_at: string
  updated_at: string | null
  expires_at: string | null
  metadata: Record<string, unknown> | null
}

export interface User {
  id: string
  email: string
  created_at: string
  email_confirmed_at: string | null
}

export interface Machine {
  id: string
  hardware_signature: string
  created_at: string
  last_seen: string | null
  trial_actions_used: number
  is_blocked: boolean
  blocked_reason: string | null
  blocked_at: string | null
}

export interface BetaKeyRequest {
  id: string
  user_id: string
  email: string
  machine_id: string | null
  requested_at: string
  status: 'pending' | 'approved' | 'rejected'
  processed_at: string | null
  assigned_key: string | null
}

export interface InviteLink {
  id: string
  code: string
  license_id: string
  created_at: string
  clicks: number
  last_clicked_at: string | null
  is_active: boolean
  created_by: string | null
  notes: string | null
}

export interface InviteLinkWithLicense extends InviteLink {
  license: {
    key: string
    type: LicenseType
    machine_id: string | null
    is_revoked: boolean
  } | null
}

export interface AuditLogEntry {
  id: string
  action: string
  user_id: string | null
  machine_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

// --- Enriched types for Users & Machines pages ---

export interface UserWithLicenses {
  id: string
  email: string
  created_at: string
  email_confirmed_at: string | null
  licenses: License[]
  machineCount: number
}

export interface MachineWithLicenses extends Machine {
  licenses: (License & { user_email?: string })[]
}

// --- Dashboard ---

export interface DashboardStats {
  total_licenses: number
  active_licenses: number
  trial_licenses: number
  beta_licenses: number
  scout_licenses: number
  pro_licenses: number
  unassigned_keys: number
  total_machines: number
  pending_beta_requests: number
  total_invite_links: number
  total_invite_clicks: number
}

// =============================================================================
// Scout Dashboard Types (Task 07)
// =============================================================================

export interface ScoutStatCards {
  total_links: number
  total_clicks: number
  total_activations: number
  active_users_7d: number
  conversion_rate: number
}

export interface FunnelStage {
  label: string
  count: number
  percentage: number
}

export interface LeaderboardEntry {
  rank: number
  activations: number
}

export interface RecentActivityEntry {
  id: string
  action_type: string
  action_details: Record<string, unknown>
  related_entity_type: string
  related_entity_id: string
  created_at: string
}

export interface ScoutDashboardData {
  stats: ScoutStatCards
  funnel: FunnelStage[]
  leaderboard: LeaderboardEntry[]
  current_scout_rank: number | null
  current_scout_activations: number
  recent_activity: RecentActivityEntry[]
}

// =============================================================================
// Scout My Links Types (Task 08)
// =============================================================================

export interface ScoutInviteLink {
  id: string
  code: string
  license_id: string
  license_key?: string
  scout_id: string
  recipient_name: string | null
  is_active: boolean
  clicks: number
  created_at: string
  last_clicked_at: string | null
  download_matched: boolean
  activation_matched: boolean
  use_stage: number
}

export interface ScoutLinkStats {
  total_links: number
  total_clicks: number
  total_downloads: number
  total_activations: number
  daily_limit: number
  links_created_today: number
  links_remaining: number
}

export interface CreateLinkResponse {
  success: boolean
  link: ScoutInviteLink
  daily_limit: number
  links_created_today: number
  links_remaining: number
}

// =============================================================================
// Activity Feed Types (Task 09B)
// =============================================================================

export interface ActivityFeedItem {
  id: string
  actor_type: 'admin' | 'scout' | 'system'
  actor_username: string | null
  action_type: string
  action_details: Record<string, unknown>
  related_entity_type: string | null
  related_entity_id: string | null
  created_at: string
}

export interface ActivityFeedResponse {
  items: ActivityFeedItem[]
  has_more: boolean
  next_cursor: string | null
}

// Action type display configuration
export type ActivityActionType =
  | 'admin_announcement'
  | 'invite_link_clicked'
  | 'download_attributed'
  | 'activation_attributed'
  | 'use_stage_reached'
  | 'scout_joined'
  | 'scout_link_expired'
  | 'invite_link_created'

// =============================================================================
// User Notification Types (Task 09C)
// =============================================================================

export type NotificationTargetType = 'beta' | 'trial' | 'pro' | 'scout' | 'admin'

export interface UserNotification {
  id: string
  title: string
  body: string
  target_types: NotificationTargetType[]
  require_scroll: boolean
  created_at: string
  expires_at: string | null
  // Stats (from view)
  read_count?: number
  estimated_audience?: number
}

export interface NotificationRead {
  id: string
  notification_id: string
  license_id: string | null
  machine_id: string | null
  user_id: string | null
  read_at: string
}

export interface CreateNotificationInput {
  title: string
  body: string
  target_types: NotificationTargetType[]
  require_scroll: boolean
  expires_at?: string | null
}

export interface NotificationForApp {
  id: string
  title: string
  body: string
  require_scroll: boolean
  created_at: string
}
