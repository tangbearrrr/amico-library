'use client'
import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar, MobileTopBar, MobileNav } from '@/components/layout/Sidebar'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/login')
    else if (!profile) router.replace('/unauthorized')
  }, [user, profile, loading, router])

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-12 md:pt-0 pb-16 md:pb-0">
          <div className="page-enter">{children}</div>
        </main>
      </div>
      <MobileTopBar />
      <MobileNav />
      <div className="hidden md:block fixed top-4 right-4 z-40">
        <LanguageToggle size="sm" />
      </div>
    </>
  )
}
