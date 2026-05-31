import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AuthCallbackPage() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (user && profile) navigate('/dashboard', { replace: true })
    else if (user && !profile) navigate('/unauthorized', { replace: true })
    else navigate('/login', { replace: true })
  }, [user, profile, loading, navigate])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
  )
}
