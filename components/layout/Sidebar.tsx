'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  History,
  Users,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

const supabase = createClient()

const Logo = ({ size }: { size: number }) => (
  <img src="/logo.jpg" alt="amico" width={size} height={size} className="rounded-lg object-contain" />
)

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' as const },
  { href: '/books', icon: BookOpen, key: 'books' as const },
  { href: '/borrow', icon: BookMarked, key: 'borrowReturn' as const },
  { href: '/history', icon: History, key: 'history' as const },
]

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
  }
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">
      {initials}
    </div>
  )
}

export function Sidebar() {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <aside className="hidden md:flex w-56 flex-shrink-0 h-screen bg-white border-r border-gray-100 flex-col sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <Logo size={28} />
        <span className="font-bold text-gray-900 text-[15px] tracking-tight">amico library</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, key }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
              {t[key]}
            </Link>
          )
        })}

        {profile?.role === 'admin' && (() => {
          const isActive = pathname === '/users'
          return (
            <Link
              href="/users"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
              {t.users}
            </Link>
          )
        })()}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        {profile && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <UserAvatar
              name={profile.full_name}
              avatarUrl={user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? profile.avatar_url}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                {profile.full_name.split(' ')[0]}
              </p>
              <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4 text-gray-400" />
          {t.signOut}
        </button>
      </div>
    </aside>
  )
}

export function MobileTopBar() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 md:hidden bg-white border-b border-gray-100 h-12 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Logo size={24} />
        <span className="font-bold text-gray-900 text-sm tracking-tight">amico</span>
      </div>
      <div className="flex items-center gap-3">
        {profile && (
          <span className="text-xs text-gray-400 capitalize">{profile.role}</span>
        )}
        <LanguageToggle size="sm" />
        <button
          onClick={handleLogout}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

export function MobileNav() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const pathname = usePathname()

  const allNavItems = [
    ...navItems,
    ...(profile?.role === 'admin' ? [{ href: '/users', icon: Users, key: 'users' as const }] : []),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100">
      <div className="flex items-center justify-around px-1 pt-2 pb-3">
        {allNavItems.map(({ href, icon: Icon, key }) => {
          const isActive = pathname === href
          return (
            <Link key={href} href={href} className="flex-1">
              <div className="flex flex-col items-center gap-0.5">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                <span className={`text-[9px] font-medium transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                  {t[key]}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
