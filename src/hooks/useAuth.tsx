import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true })

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (data) return data
  if (error?.code === 'PGRST116') return null
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)
  const profileRef = useRef<Profile | null>(null)
  // Tracks whether the getSession() bootstrap is still in flight so the
  // onAuthStateChange handler doesn't race it with a concurrent profile fetch.
  const bootstrappingRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    bootstrappingRef.current = true

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!mountedRef.current) return
        const authUser = session?.user ?? null
        setUser(authUser)
        if (authUser) {
          const p = await loadProfile(authUser.id)
          if (!mountedRef.current) return
          profileRef.current = p
          setProfile(p)
        }
      })
      .catch(() => { /* session unavailable — treat as signed out */ })
      .finally(() => {
        bootstrappingRef.current = false
        if (mountedRef.current) setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return
      // INITIAL_SESSION and any events fired while getSession() is still
      // resolving are handled by the bootstrap above.
      if (event === 'INITIAL_SESSION' || bootstrappingRef.current) return

      const authUser = session?.user ?? null
      setUser(authUser)

      if (authUser) {
        // Skip re-fetch if we already have this user's profile (covers
        // TOKEN_REFRESHED and SIGNED_IN on tab-focus for the same user).
        if (profileRef.current?.id === authUser.id) return
        setLoading(true)
        const p = await loadProfile(authUser.id)
        if (!mountedRef.current) return
        profileRef.current = p
        setProfile(p)
        setLoading(false)
      } else {
        profileRef.current = null
        setProfile(null)
      }
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
