import { useEffect, useState } from 'react'
import { BookOpen, ShieldOff, CheckCircle } from 'lucide-react'
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
    await supabase.auth.signOut().catch(() => {})
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] text-center">
        <div className="inline-flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">amico</span>
        </div>

        {requestStatus === 'sent' ? (
          <>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access denied</h1>
            <p className="text-sm text-gray-500 mb-8">{t.requestSent}</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShieldOff className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Access denied</h1>
            <p className="text-sm text-gray-500 mb-6">
              Your account is not authorised to access this system.
              Contact an administrator to request access.
            </p>
            {requestStatus === 'error' && (
              <p className="text-xs text-red-500 mb-4">{t.requestError}</p>
            )}
            <button
              onClick={handleRequestAccess}
              disabled={requestStatus === 'loading' || requestStatus === 'checking'}
              className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors mb-3"
            >
              {requestStatus === 'loading' || requestStatus === 'checking'
                ? t.checkingRequest
                : t.requestAccess}
            </button>
          </>
        )}

        <button
          onClick={handleBack}
          className={`w-full text-sm font-medium py-2.5 rounded-xl transition-colors ${
            requestStatus === 'sent'
              ? 'bg-gray-900 hover:bg-gray-700 text-white'
              : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
          }`}
        >
          {t.back}
        </button>
      </div>
    </div>
  )
}
