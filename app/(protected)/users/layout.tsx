'use client'
import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function UsersLayout({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile && profile.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [profile, loading, router])

  if (loading || !profile || profile.role !== 'admin') return null

  return <>{children}</>
}
