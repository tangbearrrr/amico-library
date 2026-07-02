import { useState } from 'react'
import { BookMarked, RotateCcw, AlertTriangle, ChevronDown } from 'lucide-react'
import { useBooks } from '../hooks/useBooks'
import { useBorrowRecords } from '../hooks/useBorrowRecords'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { getAvailableCopies, isOverdue } from '../lib/utils'
import { AppLayout } from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { ConfirmModal } from '../components/ui/Modal'

interface BorrowFormData {
  book_id: string
  borrower_name: string
  borrower_note: string
  borrow_days: number
}

const DURATION_PRESETS = [7]
const DEFAULT_DURATION = 7
const CUSTOM_DURATION = -1

const today = new Date().toISOString().split('T')[0]

const addDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0]

export function BorrowPage() {
  const { profile } = useAuth()
  const { t, locale } = useLanguage()
  const { books } = useBooks()
  const { borrowRecords, addBorrowRecord, returnBook } = useBorrowRecords()

  const [form, setForm] = useState<BorrowFormData>({
    book_id: '',
    borrower_name: '',
    borrower_note: '',
    borrow_days: DEFAULT_DURATION,
  })
  const [durationMode, setDurationMode] = useState<number>(DEFAULT_DURATION)
  const [errors, setErrors] = useState<Partial<Record<keyof BorrowFormData, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [returnTarget, setReturnTarget] = useState<string | null>(null)
  const [bookSearch, setBookSearch] = useState('')
  const [bookOpen, setBookOpen] = useState(false)

  const set = (field: 'book_id' | 'borrower_name' | 'borrower_note', value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const availableBooks = books.filter(
    (b) => getAvailableCopies(b.id, b, borrowRecords) > 0
  )

  const filteredBooks = availableBooks.filter(
    (b) =>
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearch.toLowerCase())
  )

  const selectedBook = books.find((b) => b.id === form.book_id)

  const validate = () => {
    const e: Partial<Record<keyof BorrowFormData, string>> = {}
    if (!form.book_id) e.book_id = t.selectBookError
    if (!form.borrower_name.trim()) e.borrower_name = t.borrowerNameRequired
    if (!form.borrow_days || form.borrow_days < 1) e.borrow_days = t.borrowDaysRequired
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await addBorrowRecord({
      book_id: form.book_id,
      borrower_name: form.borrower_name.trim(),
      borrower_note: form.borrower_note.trim() || undefined,
      staff_id: profile!.id,
      borrow_date: today,
      due_date: addDays(form.borrow_days),
    })
    setForm({ book_id: '', borrower_name: '', borrower_note: '', borrow_days: DEFAULT_DURATION })
    setDurationMode(DEFAULT_DURATION)
    setBookSearch('')
    setErrors({})
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const activeBorrows = borrowRecords
    .filter((r) => r.status !== 'returned')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const getBook = (id: string) => books.find((b) => b.id === id)

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">{t.borrowReturn}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t.borrowPageSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">{t.recordABorrow}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Book selector */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">{t.book} *</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setBookOpen((v) => !v)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white hover:bg-gray-50
                        ${errors.book_id ? 'border-red-300' : 'border-gray-200'}
                        ${selectedBook ? 'text-gray-900' : 'text-gray-400'}`}
                    >
                      <span className="truncate">
                        {selectedBook ? selectedBook.title : t.selectABook}
                      </span>
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${bookOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {bookOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setBookOpen(false)} />
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                          <div className="p-2 border-b border-gray-100">
                            <input
                              type="text"
                              value={bookSearch}
                              onChange={(e) => setBookSearch(e.target.value)}
                              placeholder={t.searchBooks}
                              className="w-full px-3 py-1.5 text-base md:text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredBooks.length === 0 && (
                              <div className="px-3 py-4 text-sm text-gray-400 text-center">{t.noAvailableBooks}</div>
                            )}
                            {filteredBooks.map((book) => {
                              const av = getAvailableCopies(book.id, book, borrowRecords)
                              return (
                                <button
                                  key={book.id}
                                  type="button"
                                  onClick={() => {
                                    set('book_id', book.id)
                                    setBookOpen(false)
                                    setBookSearch('')
                                    setErrors((e) => ({ ...e, book_id: undefined }))
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                                >
                                  <div>
                                    <div className="text-sm text-gray-900">{book.title}</div>
                                    <div className="text-xs text-gray-400">{book.author}</div>
                                  </div>
                                  <span className="text-xs text-green-600 font-medium">{av} {t.availSuffix}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {errors.book_id && <p className="text-xs text-red-500">{errors.book_id}</p>}
                </div>

                <Input
                  label={t.borrowerNameLabel}
                  value={form.borrower_name}
                  onChange={(e) => set('borrower_name', e.target.value)}
                  error={errors.borrower_name}
                  placeholder={t.borrowerNamePlaceholder}
                />

                <Textarea
                  label={t.notePhoneLabel}
                  value={form.borrower_note}
                  onChange={(e) => set('borrower_note', e.target.value)}
                  placeholder={t.notePhonePlaceholder}
                  rows={2}
                  hint={t.optional}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">{t.borrowDurationLabel}</label>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_PRESETS.map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setDurationMode(days)
                          setForm((f) => ({ ...f, borrow_days: days }))
                          setErrors((e) => ({ ...e, borrow_days: undefined }))
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors
                          ${durationMode === days
                            ? 'bg-gray-900 border-gray-900 text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {days} {t.daysSuffix}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDurationMode(CUSTOM_DURATION)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors
                        ${durationMode === CUSTOM_DURATION
                          ? 'bg-gray-900 border-gray-900 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {t.customDuration}
                    </button>
                  </div>
                  {durationMode === CUSTOM_DURATION && (
                    <Input
                      type="number"
                      min={1}
                      placeholder={t.customDaysPlaceholder}
                      value={form.borrow_days || ''}
                      onChange={(e) => {
                        const days = parseInt(e.target.value, 10)
                        setForm((f) => ({ ...f, borrow_days: Number.isNaN(days) ? 0 : days }))
                        setErrors((err) => ({ ...err, borrow_days: undefined }))
                      }}
                      error={errors.borrow_days}
                    />
                  )}
                  {durationMode !== CUSTOM_DURATION && errors.borrow_days && (
                    <p className="text-xs text-red-500">{errors.borrow_days}</p>
                  )}
                  {form.borrow_days > 0 && (
                    <p className="text-xs text-gray-400">
                      {t.dueDatePreview}{' '}
                      {new Date(addDays(form.borrow_days)).toLocaleDateString(locale, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  <BookMarked className="w-4 h-4" />
                  {t.recordBorrowBtn}
                </Button>

                {submitted && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    {t.borrowSuccess}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Active borrows */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{t.activeBorrows}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{activeBorrows.length} {t.booksOut}</p>
                </div>
                {activeBorrows.filter((r) => isOverdue(r)).length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-full px-2.5 py-1">
                    <AlertTriangle className="w-3 h-3" />
                    {activeBorrows.filter((r) => isOverdue(r)).length} {t.overdueCount}
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">{t.borrower}</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">{t.book}</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">{t.dueCol}</th>
                      <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-medium text-gray-400">{t.status}</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeBorrows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                          {t.noActiveBorrows}
                        </td>
                      </tr>
                    )}
                    {activeBorrows.map((record) => {
                      const book = getBook(record.book_id)
                      const overdue = isOverdue(record)
                      return (
                        <tr
                          key={record.id}
                          className={`transition-colors ${overdue ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{record.borrower_name}</div>
                            {record.borrower_note && (
                              <div className="text-xs text-gray-400 truncate max-w-[100px]">{record.borrower_note}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-700 line-clamp-1">{book?.title ?? '—'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              {new Date(record.due_date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                            </span>
                            {overdue && (
                              <span className="sm:hidden ml-1 text-xs text-red-600 font-medium">· {t.statusOverdue}</span>
                            )}
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3">
                            <Badge variant={overdue ? 'overdue' : 'borrowed'}>
                              {overdue ? t.statusOverdue : t.statusBorrowed}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setReturnTarget(record.id)}
                              className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md px-2 py-1 transition-colors whitespace-nowrap"
                            >
                              <RotateCcw className="w-3 h-3" />
                              {t.returnBtn}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!returnTarget}
        onClose={() => setReturnTarget(null)}
        onConfirm={async () => {
          if (returnTarget) await returnBook(returnTarget)
          setReturnTarget(null)
        }}
        title={t.confirmReturnTitle}
        message={t.confirmReturnMsg}
        confirmLabel={t.markReturned}
      />
    </AppLayout>
  )
}
