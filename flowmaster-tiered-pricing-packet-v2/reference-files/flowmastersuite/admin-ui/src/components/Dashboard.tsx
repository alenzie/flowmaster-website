import { useEffect, useState, useCallback } from 'react'
import { useRefresh } from '../lib/refresh'
import {
  Key,
  KeyRound,
  ShieldCheck,
  Users,
  Monitor,
  FileQuestion,
  Link2,
  MousePointerClick,
  Beaker,
  Heart,
  Crown,
  RefreshCw,
  AlertCircle,
  Loader2,
  Megaphone,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import StatCard from './ui/StatCard'
import { TierBadge, StatusBadge, getLicenseStatus } from './ui/Badge'
import { fetchDashboardStats, fetchRecentActivity } from '../api/dashboard'
import { fetchPoolCounts } from '../api/licenses'
import { postAdminAnnouncement, triggerLinkExpiration } from '../api/activity'
import { useNotify } from './ui/Notify'
import type { PoolCounts } from '../api/licenses'
import type { DashboardStats, License } from '../types'

function getUnassignedColor(count: number): 'red' | 'yellow' | 'green' {
  if (count < 50) return 'red'
  if (count < 100) return 'yellow'
  return 'green'
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [poolCounts, setPoolCounts] = useState<PoolCounts | null>(null)
  const [recent, setRecent] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { refreshKey } = useRefresh()
  const notify = useNotify()

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('')
  const [postingAnnouncement, setPostingAnnouncement] = useState(false)

  useEffect(() => {
    document.title = 'Flowmaster Admin — Dashboard'
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsData, recentData, poolData] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentActivity(10),
        fetchPoolCounts(),
      ])
      setStats(statsData)
      setRecent(recentData)
      setPoolCounts(poolData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData, refreshKey])

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) return

    setPostingAnnouncement(true)
    try {
      await postAdminAnnouncement(announcementText.trim())
      notify.success('Announcement posted!')
      setAnnouncementText('')
    } catch (e) {
      notify.error('Failed to post announcement')
    } finally {
      setPostingAnnouncement(false)
    }
  }

  const handleExpireLinks = async () => {
    try {
      const result = await triggerLinkExpiration()
      notify.success(`Expired ${result.expired_count} links, returned ${result.keys_returned} keys`)
    } catch (e) {
      notify.error('Failed to expire links')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-fm-red" size={32} />
        <span className="ml-3 text-fm-text-secondary">Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="text-fm-red" size={40} />
        <p className="text-fm-red">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-fm-red/10 text-fm-red rounded-md hover:bg-fm-red/20 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-fm-text-secondary text-sm mt-1">Flowmaster license & user overview</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 bg-fm-dark-secondary border border-fm-border rounded-md text-sm text-fm-text-secondary hover:text-white hover:border-fm-red/50 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Row 1: Key overview */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Total Keys"
          value={stats.total_licenses}
          icon={<Key size={20} />}
          color="default"
        />
        <StatCard
          title="Unassigned Keys"
          value={stats.unassigned_keys}
          subtitle={stats.unassigned_keys < 50 ? 'Low stock!' : undefined}
          icon={<KeyRound size={20} />}
          color={getUnassignedColor(stats.unassigned_keys)}
        />
        <StatCard
          title="Active Licenses"
          value={stats.active_licenses}
          icon={<ShieldCheck size={20} />}
          color="green"
        />
        <StatCard
          title="Machines"
          value={stats.total_machines}
          icon={<Monitor size={20} />}
          color="blue"
        />
      </div>

      {/* Row 2: By tier */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Trial"
          value={stats.trial_licenses}
          icon={<Beaker size={20} />}
          color="default"
        />
        <StatCard
          title="Beta"
          value={stats.beta_licenses}
          icon={<Users size={20} />}
          color="green"
        />
        <StatCard
          title="Scout"
          value={stats.scout_licenses}
          icon={<Users size={20} />}
          color="default"
        />
        <StatCard
          title="Pro"
          value={stats.pro_licenses}
          icon={<Crown size={20} />}
          color="default"
        />
      </div>

      {/* Row 3: Beta Key Pools */}
      {poolCounts && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-fm-text-secondary uppercase tracking-wide mb-2">Beta Key Pools (Unassigned)</h3>
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              title="Auto-Claim"
              value={poolCounts['auto-claim']}
              subtitle="Post-trial distribution"
              icon={<KeyRound size={20} />}
              color={poolCounts['auto-claim'] < 50 ? 'red' : poolCounts['auto-claim'] < 100 ? 'yellow' : 'green'}
            />
            <StatCard
              title="Direct Invite"
              value={poolCounts['direct-invite']}
              subtitle="Manually sent keys"
              icon={<Users size={20} />}
              color="default"
            />
            <StatCard
              title="Tactical Links"
              value={poolCounts['tactical-links']}
              subtitle="Invite link campaigns"
              icon={<Link2 size={20} />}
              color="default"
            />
            {poolCounts.untagged > 0 && (
              <StatCard
                title="Untagged"
                value={poolCounts.untagged}
                subtitle="No pool assigned"
                icon={<FileQuestion size={20} />}
                color="yellow"
              />
            )}
          </div>
        </div>
      )}

      {/* Row 4: Community */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pending Beta Requests"
          value={stats.pending_beta_requests}
          icon={<FileQuestion size={20} />}
          color={stats.pending_beta_requests > 0 ? 'yellow' : 'default'}
        />
        <StatCard
          title="Invite Links"
          value={stats.total_invite_links}
          icon={<Link2 size={20} />}
          color="default"
        />
        <StatCard
          title="Total Invite Clicks"
          value={stats.total_invite_clicks}
          icon={<MousePointerClick size={20} />}
          color="default"
        />
        <div />
      </div>

      {/* Recent Activity */}
      <div className="bg-fm-dark-secondary border border-fm-border rounded-lg">
        <div className="px-4 py-3 border-b border-fm-border">
          <h3 className="font-semibold">Recent Activity</h3>
        </div>
        {recent.length === 0 ? (
          <div className="px-4 py-8 text-center text-fm-text-secondary">
            No license activity yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-fm-text-secondary text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2 font-medium">Key</th>
                <th className="text-left px-4 py-2 font-medium">Tier</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Machine</th>
                <th className="text-left px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(license => {
                const status = getLicenseStatus(license)
                return (
                  <tr key={license.id} className="border-t border-fm-border/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 font-mono text-xs">{license.key}</td>
                    <td className="px-4 py-2.5"><TierBadge type={license.type} /></td>
                    <td className="px-4 py-2.5"><StatusBadge status={status} /></td>
                    <td className="px-4 py-2.5 text-fm-text-secondary text-xs">
                      {license.machine_id ? license.machine_id.slice(0, 8) + '...' : '\u2014'}
                    </td>
                    <td className="px-4 py-2.5 text-fm-text-secondary text-xs">
                      {formatDistanceToNow(new Date(license.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Scout Announcement Section */}
      <div className="bg-fm-dark-secondary border border-fm-border rounded-lg p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone size={20} className="text-fm-yellow" />
          <h3 className="font-semibold">Post Scout Announcement</h3>
        </div>
        <textarea
          value={announcementText}
          onChange={(e) => setAnnouncementText(e.target.value)}
          placeholder="Enter a message to all scouts..."
          maxLength={500}
          rows={3}
          className="w-full bg-fm-input border border-fm-border rounded-md px-3 py-2 text-sm text-white placeholder:text-fm-text-secondary/50 focus:outline-none focus:border-fm-red/50 resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-fm-text-secondary">
            {announcementText.length}/500 characters
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleExpireLinks}
              className="px-3 py-1.5 text-sm text-fm-text-secondary hover:text-white border border-fm-border rounded-md hover:border-fm-yellow/50"
            >
              Run Link Expiration
            </button>
            <button
              onClick={handlePostAnnouncement}
              disabled={postingAnnouncement || !announcementText.trim()}
              className="flex items-center gap-2 px-4 py-1.5 bg-fm-yellow text-black rounded-md text-sm font-medium hover:bg-fm-yellow/90 disabled:opacity-50"
            >
              {postingAnnouncement && <Loader2 size={14} className="animate-spin" />}
              Post Announcement
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
