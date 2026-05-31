import type { Book, BorrowRecord } from '../types'

export const getAvailableCopies = (
  bookId: string,
  book: Book,
  borrowRecords: BorrowRecord[]
): number => {
  const active = borrowRecords.filter(
    (r) => r.book_id === bookId && r.status !== 'returned'
  ).length
  return Math.max(0, book.total_copies - active)
}

export const isOverdue = (record: BorrowRecord): boolean => {
  if (record.status === 'returned') return false
  if (record.status === 'overdue') return true
  return new Date(record.due_date) < new Date(new Date().toISOString().split('T')[0])
}
