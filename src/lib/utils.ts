import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Book, BorrowRecord } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

// Distinct borrower names on file for a given phone number, in first-seen order.
export const getBorrowerNamesForPhone = (
  phone: string,
  borrowRecords: BorrowRecord[]
): string[] => {
  if (!phone.trim()) return []
  const names = new Set(
    borrowRecords.filter((r) => r.borrower_phone === phone).map((r) => r.borrower_name)
  )
  return [...names]
}

// Borrower label for table rows: joins all names on file for the record's
// phone with " | " when more than one name shares that phone number.
export const getBorrowerDisplayName = (
  record: BorrowRecord,
  borrowRecords: BorrowRecord[]
): string => {
  const names = getBorrowerNamesForPhone(record.borrower_phone, borrowRecords)
  return names.length > 1 ? names.join(' | ') : record.borrower_name
}
