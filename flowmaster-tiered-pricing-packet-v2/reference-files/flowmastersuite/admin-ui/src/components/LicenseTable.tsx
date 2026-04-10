import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Search, ChevronLeft, ChevronRight, Download, Loader2, ArrowUpDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { TierBadge, StatusBadge, getLicenseStatus } from './ui/Badge'
import Modal from './ui/Modal'
import { fetchLicenses, revokeLicense, exportKeys, type LicensePage } from '../api/licenses'
import type { License, LicenseType } from '../types'

export interface LicenseTableHandle {
  refresh: () => void
}

interface LicenseTableProps {
  refreshKey?: number
  notify?: { success: (msg: string) => void; error: (msg: string) => void; info: (msg: string) => void }
}

const LicenseTable = forwardRef<LicenseTableHandle, LicenseTableProps>(function LicenseTable({ refreshKey, notify }, ref) {
  const [page, setPage] = useState<LicensePage | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<LicenseType | ''>('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'revoked' | 'expired' | 'unassigned' | ''>('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortAsc, setSortAsc] = useState(false)

  // Revoke modal
  const [revokeTarget, setRevokeTarget] = useState<License | null>(null)
  const [revoking, setRevoking] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchLicenses({
        page: currentPage,
        tier: tierFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
        sortBy,
        sortAsc,
      })
      setPage(result)
    } catch (e) {
      console.error('Failed to load licenses:', e)
    } finally {
      setLoading(false)
    }
  }, [currentPage, tierFilter, statusFilter, search, sortBy, sortAsc])

  useEffect(() => { loadData() }, [loadData, refreshKey])

  useImperativeHandle(ref, () => ({ refresh: loadData }))

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortAsc(!sortAsc)
    } else {
      setSortBy(col)
      setSortAsc(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await revokeLicense(revokeTarget.id)
      setRevokeTarget(null)
      loadData()
      notify?.success('License revoked')
    } catch (e) {
      console.error('Revoke failed:', e)
    } finally {
      setRevoking(false)
    }
  }

  const handleExport = async () => {
    try {
      const csv = await exportKeys(
        tierFilter || undefined,
        statusFilter || undefined,
      )
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flowmaster-licenses-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed:', e)
    }
  }

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1) }, [search, tierFilter, statusFilter])

  const totalPages = page ? Math.ceil(page.total / page.pageSize) : 0

  const SortHeader = ({ col, label }: { col: string; label: string }) => (
    <th
      className="text-left px-4 py-2 font-medium cursor-pointer select-none hover:text-white transition-colors"
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === col && <ArrowUpDown size={12} className="text-fm-red" />}
      </span>
    </th>
  )

  return (
    <div className="bg-fm-dark-secondary border border-fm-border rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-fm-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">
            All Licenses {page ? `(${page.total.toLocaleString()})` : ''}
          </h3>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-fm-text-secondary hover:text-white border border-fm-border rounded transition-colors"
          >
            <Download size={14} />
            Export Filtered as CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fm-text-secondary" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search key..."
              data-search-input
              className="w-full bg-fm-input border border-fm-border rounded-md pl-9 pr-3 py-1.5 text-sm text-white placeholder:text-fm-text-secondary/50 focus:outline-none focus:border-fm-red/50"
            />
          </div>
          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value as LicenseType | '')}
            className="bg-fm-input border border-fm-border rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-fm-red/50"
          >
            <option value="">All Tiers</option>
            <option value="trial">Trial</option>
            <option value="beta">Beta</option>
            <option value="supporter">Supporter</option>
            <option value="pro">Pro</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="bg-fm-input border border-fm-border rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-fm-red/50"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="unassigned">Unassigned</option>
            <option value="revoked">Revoked</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-fm-red" size={24} />
        </div>
      ) : !page || page.data.length === 0 ? (
        <div className="py-12 text-center text-fm-text-secondary text-sm">
          No licenses found
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-fm-text-secondary text-xs uppercase tracking-wide">
                  <SortHeader col="key" label="Key" />
                  <SortHeader col="type" label="Tier" />
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Machine</th>
                  <SortHeader col="created_at" label="Created" />
                  <th className="text-left px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {page.data.map(license => {
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
                      <td className="px-4 py-2.5">
                        {!license.is_revoked && (
                          <button
                            onClick={() => setRevokeTarget(license)}
                            className="text-xs text-fm-red/70 hover:text-fm-red transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-fm-border flex items-center justify-between text-sm text-fm-text-secondary">
            <span>
              Showing {((currentPage - 1) * page.pageSize) + 1}–{Math.min(currentPage * page.pageSize, page.total)} of {page.total.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Revoke confirmation modal */}
      <Modal open={!!revokeTarget} onClose={() => setRevokeTarget(null)} title="Revoke License">
        {revokeTarget && (
          <>
            <p className="text-sm text-fm-text-secondary mb-2">
              Are you sure you want to revoke:
            </p>
            <p className="font-mono text-sm mb-1">{revokeTarget.key}</p>
            <div className="mb-4"><TierBadge type={revokeTarget.type} /></div>
            <p className="text-xs text-fm-text-secondary mb-4">
              This will immediately lock out the user on their next connection check.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRevokeTarget(null)}
                className="px-4 py-2 text-sm text-fm-text-secondary hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="flex items-center gap-2 px-4 py-2 bg-fm-red text-white rounded-md text-sm font-medium hover:bg-fm-red/90 disabled:opacity-50 transition-colors"
              >
                {revoking && <Loader2 size={14} className="animate-spin" />}
                Revoke License
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
})

export default LicenseTable
