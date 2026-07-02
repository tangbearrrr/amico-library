import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { BorrowRecord } from '../types'

export function useBorrowRecords() {
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('borrow_records')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBorrowRecords(data ?? [])
        setLoading(false)
      })
  }, [])

  const addBorrowRecord = async (
    record: Omit<BorrowRecord, 'id' | 'created_at' | 'status' | 'return_date'>
  ) => {
    const { data } = await supabase
      .from('borrow_records')
      .insert({ ...record, status: 'borrowed' })
      .select()
      .single()
    if (data) setBorrowRecords((prev) => [data, ...prev])
  }

  const returnBook = async (recordId: string) => {
    const return_date = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('borrow_records')
      .update({ status: 'returned', return_date })
      .eq('id', recordId)
      .select()
      .single()
    if (data) setBorrowRecords((prev) => prev.map((r) => (r.id === recordId ? data : r)))
  }

  // Makes `name` the canonical borrower name for every existing record on this phone.
  const setMainBorrowerName = async (phone: string, name: string) => {
    const { error } = await supabase
      .from('borrow_records')
      .update({ borrower_name: name })
      .eq('borrower_phone', phone)
    if (!error) {
      setBorrowRecords((prev) =>
        prev.map((r) => (r.borrower_phone === phone ? { ...r, borrower_name: name } : r))
      )
    }
  }

  return { borrowRecords, loading, addBorrowRecord, returnBook, setMainBorrowerName }
}
