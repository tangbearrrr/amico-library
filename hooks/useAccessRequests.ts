'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AccessRequest } from '@/types'

const supabase = createClient()

export function useAccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('access_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })
      .then(({ data }) => {
        setRequests(data ?? [])
        setLoading(false)
      })
  }, [])

  const approveRequest = async (req: AccessRequest): Promise<string | null> => {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: req.user_id,
      email: req.email,
      full_name: req.full_name ?? req.email,
      avatar_url: req.avatar_url ?? null,
      role: 'staff',
    })
    if (insertError) return insertError.message

    await supabase.from('access_requests').update({ status: 'approved' }).eq('id', req.id)
    setRequests((prev) => prev.filter((r) => r.id !== req.id))
    return null
  }

  const deleteRequest = async (userId: string) => {
    await supabase.from('access_requests').delete().eq('user_id', userId)
  }

  return { requests, loading, approveRequest, deleteRequest }
}
