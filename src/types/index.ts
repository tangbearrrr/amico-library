export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'admin' | 'staff'
  created_at: string
}

export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  cover_url?: string
  total_copies: number
  created_at: string
  created_by: string
}

export interface AccessRequest {
  id: string
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
}

export interface BorrowRecord {
  id: string
  book_id: string
  borrower_name: string
  borrower_note?: string
  staff_id: string
  borrow_date: string
  due_date: string
  return_date?: string
  status: 'borrowed' | 'returned' | 'overdue'
  created_at: string
}
