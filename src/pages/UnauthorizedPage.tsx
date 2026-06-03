import { useEffect, useState } from 'react'
import { ShieldOff, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'

type RequestStatus = 'checking' | 'idle' | 'loading' | 'sent' | 'error'

export function UnauthorizedPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('checking')
  const [backingOut, setBackingOut] = useState(false)

  useEffect(() => {
    if (!user) { setRequestStatus('idle'); return }
    supabase
      .from('access_requests')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setRequestStatus(data ? 'sent' : 'idle'))
  }, [user])

  const handleBack = async () => {
    setBackingOut(true)
    await Promise.race([
      supabase.auth.signOut(),
      new Promise<void>(resolve => setTimeout(resolve, 2000)),
    ]).catch(() => {})
    navigate('/login', { replace: true })
  }

  const handleRequestAccess = async () => {
    if (!user) return
    setRequestStatus('loading')
    const { error } = await supabase.from('access_requests').insert({
      user_id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    })
    setRequestStatus(error ? 'error' : 'sent')
  }

  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <img src="/logo.jpg" alt="amico" className="w-9 h-9 rounded-xl object-contain" />
        <span className="font-bold text-gray-900 text-lg tracking-tight">amico library</span>
      </div>

      <div className="w-full max-w-[380px] bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {requestStatus === 'sent' ? (
          /* ── Pending state ── */
          <div className="text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Clock className="w-7 h-7 text-amber-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">{t.requestPending}</h1>
            <p className="text-sm text-gray-500 mb-5">{t.requestSent}</p>

            {displayName && (
              <div className="flex items-center justify-center gap-2 mb-5">
                {user?.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={displayName}
                    className="w-6 h-6 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="text-xs text-gray-400">
                  {t.signedInAs} <span className="text-gray-600 font-medium">{displayName}</span>
                </span>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 text-left">
              <p className="text-xs text-amber-700">{t.requestPendingNote}</p>
            </div>

            <button
              onClick={handleBack}
              disabled={backingOut}
              className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {backingOut && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t.back}
            </button>
          </div>
        ) : (
          /* ── Access denied state ── */
          <div className="text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShieldOff className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-sm text-gray-500 mb-6">
              Your account is not authorised to access this system.
              Request access and an admin will review it.
            </p>

            {requestStatus === 'error' && (
              <p className="text-xs text-red-500 mb-4">{t.requestError}</p>
            )}

            <button
              onClick={handleRequestAccess}
              disabled={requestStatus === 'loading' || requestStatus === 'checking'}
              className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors mb-3 flex items-center justify-center gap-2"
            >
              {requestStatus === 'loading' && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {requestStatus === 'loading' || requestStatus === 'checking'
                ? t.checkingRequest
                : t.requestAccess}
            </button>

            <button
              onClick={handleBack}
              disabled={backingOut}
              className="w-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {backingOut && <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />}
              {t.back}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
