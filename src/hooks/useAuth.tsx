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
  // Tracks the loaded profile outside React state so the async callback always
  // sees the current value without stale-closure issues.
  const profileRef = useRef<Profile | null>(null)

  useEffect(() => {
    mountedRef.current = true

    // onAuthStateChange fires INITIAL_SESSION synchronously from localStorage,
    // so getSession() is redundant and creates a race. Use only this.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return
      const authUser = session?.user ?? null
      setUser(authUser)
      if (authUser) {
        // TOKEN_REFRESHED only rotates the access token — profile is unchanged.
        // SIGNED_IN on tab-focus also fires for an already-authenticated user;
        // skip the re-fetch if we already have this user's profile to avoid a
        // loading flash and prevent a transient fetch failure from kicking the
        // user to /unauthorized.
        if (event === 'TOKEN_REFRESHED' || (event === 'SIGNED_IN' && profileRef.current?.id === authUser.id)) {
          setLoading(false)
          return
        }
        setLoading(true)
        const p = await loadProfile(authUser.id)
        if (mountedRef.current) {
          profileRef.current = p
          setProfile(p)
          setLoading(false)
        }
      } else {
        if (mountedRef.current) {
          profileRef.current = null
          setProfile(null)
          setLoading(false)
        }
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
