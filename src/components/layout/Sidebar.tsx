import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  History,
  Users,
  LogOut,
} from 'lucide-react'

const Logo = ({ size }: { size: number }) => (
  <img src="/logo.jpg" alt="amico" width={size} height={size} className="rounded-lg object-contain" />
)
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/books', icon: BookOpen, label: 'Books' },
  { to: '/borrow', icon: BookMarked, label: 'Borrow' },
  { to: '/history', icon: History, label: 'History' },
]

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">
      {initials}
    </div>
  )
}

export function Sidebar() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
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
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
              ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                {label === 'Borrow' ? 'Borrow & Return' : label}
              </>
            )}
          </NavLink>
        ))}

        {profile?.role === 'admin' && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
              ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Users className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                Users
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        {profile && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <UserAvatar name={profile.full_name} />
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
          Sign out
        </button>
      </div>
    </aside>
  )
}

export function MobileTopBar() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
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

  const allNavItems = [
    ...navItems,
    ...(profile?.role === 'admin' ? [{ to: '/users', icon: Users, label: 'Users' }] : []),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100">
      <div className="flex items-center justify-around px-1 pt-2 pb-3">
        {allNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1"
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5">
                <Icon
                  className={`w-5 h-5 transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`}
                />
                <span
                  className={`text-[9px] font-medium transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`}
                >
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
