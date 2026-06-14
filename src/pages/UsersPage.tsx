import { useState } from 'react'
import { ShieldCheck, UserCheck, Trash2, UserPlus, Clock } from 'lucide-react'
import { useProfiles } from '../hooks/useProfiles'
import { useAccessRequests } from '../hooks/useAccessRequests'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { AppLayout } from '../components/layout/AppLayout'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal, ConfirmModal } from '../components/ui/Modal'
import type { Profile } from '../types'

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
  }
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
      {initials}
    </div>
  )
}

const EMPTY_FORM = { full_name: '', email: '', role: 'staff' as 'admin' | 'staff' }

export function UsersPage() {
  const { profile: currentUser } = useAuth()
  const { t, locale } = useLanguage()
  const { profiles, loading, updateUserRole, removeUser, addUser } = useProfiles()
  const { requests, approveRequest, deleteRequest } = useAccessRequests()
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const adminCount = profiles.filter((u) => u.role === 'admin').length

  const handleApprove = async (req: import('../types').AccessRequest) => {
    setApprovingId(req.id)
    setApproveError(null)
    const err = await approveRequest(req)
    setApprovingId(null)
    if (err) setApproveError(err)
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim() || !form.email.trim()) {
      setFormError(t.nameEmailRequired)
      return
    }
    setSaving(true)
    setFormError('')
    const err = await addUser(form)
    setSaving(false)
    if (err) { setFormError(err); return }
    setAddOpen(false)
    setForm(EMPTY_FORM)
  }

  return (
    <AppLayout adminOnly>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t.users}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {profiles.length} {t.members} · {adminCount} {adminCount === 1 ? t.adminSingular : t.adminPlural}
            </p>
          </div>
          <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setAddOpen(true) }}>
            <UserPlus className="w-3.5 h-3.5" />
            {t.addUser}
          </Button>
        </div>

        {/* Pending Access Requests */}
        {requests.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900">{t.pendingRequests}</h2>
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                {requests.length}
              </span>
              <span className="text-xs text-gray-400">{t.pendingRequestsSubtitle}</span>
            </div>
            {approveError && <p className="text-xs text-red-500 mb-2">{approveError}</p>}
            <div className="bg-white rounded-xl border border-blue-100 overflow-hidden divide-y divide-gray-50">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0">
                    {(req.full_name ?? req.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {req.full_name ?? '—'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{req.email}</div>
                  </div>
                  <div className="hidden sm:block text-xs text-gray-400 whitespace-nowrap">
                    {t.requested} {new Date(req.requested_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <Button
                    size="sm"
                    loading={approvingId === req.id}
                    onClick={() => handleApprove(req)}
                  >
                    {t.approve}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notice */}
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
          <ShieldCheck className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700">{t.roleChangeNotice}</p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 sm:px-5 py-3 text-xs font-medium text-gray-400">{t.userCol}</th>
                  <th className="hidden sm:table-cell text-left px-5 py-3 text-xs font-medium text-gray-400">{t.emailCol}</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-xs font-medium text-gray-400">{t.roleCol}</th>
                  <th className="hidden sm:table-cell text-left px-5 py-3 text-xs font-medium text-gray-400">{t.joinedCol}</th>
                  <th className="px-4 sm:px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profiles.map((user) => {
                  const isSelf = user.id === currentUser?.id
                  const isLastAdmin = user.role === 'admin' && adminCount === 1

                  return (
                    <tr key={user.id} className={`transition-colors ${isSelf ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}>
                      {/* Mobile card layout */}
                      <td colSpan={5} className="sm:hidden px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.full_name} avatarUrl={user.avatar_url} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-medium text-gray-900 truncate">{user.full_name}</span>
                              {isSelf && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t.youLabel}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{user.email}</div>
                            <div className="flex items-center gap-2 mt-1.5">
                              {isSelf ? (
                                <Badge variant={user.role === 'admin' ? 'admin' : 'staff'}>
                                  {user.role === 'admin' ? t.adminRole : t.staffRole}
                                </Badge>
                              ) : (
                                <>
                                  <select
                                    value={user.role}
                                    onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'staff')}
                                    disabled={isLastAdmin}
                                    className="text-base md:text-sm border border-gray-200 rounded-lg px-2.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <option value="admin">{t.adminRole}</option>
                                    <option value="staff">{t.staffRole}</option>
                                  </select>
                                  {user.role === 'admin' ? (
                                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          {!isSelf && !isLastAdmin ? (
                            <button
                              onClick={() => setDeleteTarget(user)}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="w-7 h-7 flex-shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Desktop table layout */}
                      <td className="hidden sm:table-cell px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.full_name} avatarUrl={user.avatar_url} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900 truncate">{user.full_name}</span>
                              {isSelf && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t.youLabel}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-5 py-4 text-sm text-gray-500">{user.email}</td>
                      <td className="hidden sm:table-cell px-5 py-4">
                        {isSelf ? (
                          <Badge variant={user.role === 'admin' ? 'admin' : 'staff'}>
                            {user.role === 'admin' ? t.adminRole : t.staffRole}
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'staff')}
                              disabled={isSelf || isLastAdmin}
                              className="text-base md:text-sm border border-gray-200 rounded-lg px-2.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <option value="admin">{t.adminRole}</option>
                              <option value="staff">{t.staffRole}</option>
                            </select>
                            {user.role === 'admin' ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="hidden sm:table-cell px-5 py-4 text-sm text-gray-400">
                        {new Date(user.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="hidden sm:table-cell px-5 py-4">
                        <div className="flex justify-end">
                          {!isSelf && !isLastAdmin ? (
                            <button
                              onClick={() => setDeleteTarget(user)}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="w-7 h-7" />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: t.total, value: profiles.length, color: 'text-gray-900' },
            { label: t.adminsLabel, value: adminCount, color: 'text-gray-900' },
            { label: t.staffLabel, value: profiles.filter((u) => u.role === 'staff').length, color: 'text-gray-900' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className={`text-2xl font-semibold ${color}`}>{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await removeUser(deleteTarget.id)
            await deleteRequest(deleteTarget.id)
          }
          setDeleteTarget(null)
        }}
        title={t.removeUser}
        message={`${deleteTarget?.full_name}${t.removeUserConfirmSuffix}`}
        confirmLabel={t.remove}
        variant="danger"
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t.addNewUser} size="sm">
        <form onSubmit={handleAddUser} className="space-y-4">
          <Input
            label={t.fullNameLabel}
            placeholder="Jane Smith"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            required
          />
          <Input
            label={t.emailLabel}
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <Select
            label={t.roleLabel}
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'admin' | 'staff' }))}
          >
            <option value="staff">{t.staffRole}</option>
            <option value="admin">{t.adminRole}</option>
          </Select>
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-2.5 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>{t.cancel}</Button>
            <Button type="submit" loading={saving}>{t.addUser}</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
