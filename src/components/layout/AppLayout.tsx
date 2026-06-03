import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Sidebar, MobileTopBar, MobileNav } from './Sidebar'
import { LanguageToggle } from '../ui/LanguageToggle'

interface AppLayoutProps {
  children: ReactNode
  adminOnly?: boolean
}

export function AppLayout({ children, adminOnly }: AppLayoutProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/unauthorized" replace />
  if (adminOnly && profile.role !== 'admin') return <Navigate to="/dashboard" replace />

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
