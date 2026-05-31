import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setProfiles(data ?? [])
        setLoading(false)
      })
  }, [])

  const updateUserRole = async (userId: string, role: 'admin' | 'staff') => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (!error) setProfiles((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
  }

  const removeUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (!error) setProfiles((prev) => prev.filter((u) => u.id !== userId))
  }

  const addUser = async (data: { full_name: string; email: string; role: 'admin' | 'staff' }): Promise<string | null> => {
    const { data: existing } = await supabase.from('profiles').select('id').eq('email', data.email).maybeSingle()
    if (existing) return 'A user with this email already exists.'

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: crypto.randomUUID(),
      options: { data: { full_name: data.full_name } },
    })
    if (signUpError || !authData.user) return signUpError?.message ?? 'Failed to create user.'

    const newProfile: Profile = {
      id: authData.user.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      created_at: new Date().toISOString(),
    }
    const { error: insertError } = await supabase.from('profiles').insert(newProfile)
    if (insertError) return insertError.message

    setProfiles((prev) => [...prev, newProfile])
    return null
  }

  return { profiles, loading, updateUserRole, removeUser, addUser }
}
