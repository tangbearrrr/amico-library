'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Book } from '@/types'

const supabase = createClient()

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBooks(data ?? [])
        setLoading(false)
      })
  }, [])

  const addBook = async (book: Omit<Book, 'id' | 'created_at'>) => {
    const { data } = await supabase.from('books').insert(book).select().single()
    if (data) setBooks((prev) => [data, ...prev])
  }

  const updateBook = async (id: string, updates: Partial<Omit<Book, 'id' | 'created_at'>>) => {
    const { data } = await supabase.from('books').update(updates).eq('id', id).select().single()
    if (data) setBooks((prev) => prev.map((b) => (b.id === id ? data : b)))
  }

  const deleteBook = async (id: string) => {
    await supabase.from('borrow_records').delete().eq('book_id', id)
    const { error } = await supabase.from('books').delete().eq('id', id)
    if (!error) setBooks((prev) => prev.filter((b) => b.id !== id))
  }

  return { books, loading, addBook, updateBook, deleteBook }
}
