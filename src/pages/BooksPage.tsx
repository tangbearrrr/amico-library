import { useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { useBooks } from '../hooks/useBooks'
import { useBorrowRecords } from '../hooks/useBorrowRecords'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { getAvailableCopies } from '../lib/utils'
import { AppLayout } from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal, ConfirmModal } from '../components/ui/Modal'
import type { Book } from '../types'

interface BookFormData {
  title: string
  author: string
  isbn: string
  total_copies: number
}

const emptyForm: BookFormData = { title: '', author: '', isbn: '', total_copies: 1 }

function BookForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: BookFormData
  onSubmit: (data: BookFormData) => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const [form, setForm] = useState<BookFormData>(initial ?? emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof BookFormData, string>>>({})

  const set = (field: keyof BookFormData, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  const validate = () => {
    const e: Partial<Record<keyof BookFormData, string>> = {}
    if (!form.title.trim()) e.title = t.titleRequired
    if (form.total_copies < 1) e.total_copies = t.atLeast1Copy
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t.titleLabel}
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
        error={errors.title}
        placeholder={t.titlePlaceholder}
        autoFocus
      />
      <Input
        label={t.authorLabel}
        value={form.author}
        onChange={(e) => set('author', e.target.value)}
        placeholder={t.authorPlaceholder}
      />
      <Input
        label={t.isbnLabel}
        value={form.isbn}
        onChange={(e) => set('isbn', e.target.value)}
        placeholder="978-0000000000"
      />
      <Input
        label={t.totalCopiesLabel}
        type="number"
        min={1}
        value={form.total_copies}
        onChange={(e) => set('total_copies', parseInt(e.target.value) || 1)}
        error={errors.total_copies?.toString()}
      />
      <div className="flex gap-2.5 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          {t.cancel}
        </Button>
        <Button type="submit" className="flex-1">
          {t.save}
        </Button>
      </div>
    </form>
  )
}

function BookInitial({ title }: { title: string }) {
  const palettes = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-green-100 text-green-700',
    'bg-rose-100 text-rose-700',
    'bg-teal-100 text-teal-700',
    'bg-amber-100 text-amber-700',
    'bg-indigo-100 text-indigo-700',
  ]
  const palette = palettes[title.charCodeAt(0) % palettes.length]
  return (
    <div className={`w-7 h-9 ${palette} rounded flex items-center justify-center text-xs font-semibold flex-shrink-0`}>
      {title[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export function BooksPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const { books, loading: booksLoading, addBook, updateBook, deleteBook } = useBooks()
  const { borrowRecords, loading: recordsLoading } = useBorrowRecords()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editBook, setEditBook] = useState<Book | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)

  const loading = booksLoading || recordsLoading

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (data: BookFormData) => {
    await addBook({ ...data, created_by: profile!.id })
    setAddOpen(false)
  }

  const handleEdit = async (data: BookFormData) => {
    if (!editBook) return
    await updateBook(editBook.id, data)
    setEditBook(null)
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t.books}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{books.length} {t.titlesInLibrary}</p>
          </div>
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus className="w-3.5 h-3.5" />
            {t.addBook}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder={t.searchTitleOrAuthor}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Mobile cards (iPhone) */}
            <div className="sm:hidden space-y-2">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-12 text-center text-sm text-gray-400">
                  {t.noBooksFound}
                </div>
              ) : (
                filtered.map((book) => {
                  const available = getAvailableCopies(book.id, book, borrowRecords)
                  return (
                    <div key={book.id} className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-start gap-3">
                        <BookInitial title={book.title} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900">{book.title}</div>
                          {book.author && <div className="text-xs text-gray-400 mt-0.5">{book.author}</div>}
                          {book.isbn && <div className="text-xs text-gray-400 font-mono mt-0.5">{book.isbn}</div>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold ${
                              available === 0
                                ? 'bg-red-50 text-red-600'
                                : available <= 1
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-green-50 text-green-600'
                            }`}
                          >
                            {available}
                          </span>
                          <span className="text-xs text-gray-400">{book.total_copies} {t.copies}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => setEditBook(book)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {profile?.role === 'admin' && (
                            <button
                              onClick={() => setDeleteTarget(book)}
                              className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Table (iPad and Desktop) */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 sm:px-5 py-3 text-xs font-medium text-gray-400">{t.book}</th>
                    <th className="hidden sm:table-cell text-left px-5 py-3 text-xs font-medium text-gray-400">{t.isbn}</th>
                    <th className="hidden sm:table-cell text-center px-4 py-3 text-xs font-medium text-gray-400">{t.copiesCol}</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-400">{t.availCol}</th>
                    <th className="px-4 sm:px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                        {t.noBooksFound}
                      </td>
                    </tr>
                  )}
                  {filtered.map((book) => {
                    const available = getAvailableCopies(book.id, book, borrowRecords)
                    return (
                      <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <BookInitial title={book.title} />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{book.title}</div>
                              <div className="text-xs text-gray-400 truncate">{book.author || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-5 py-3.5 text-xs text-gray-400 font-mono">{book.isbn || '—'}</td>
                        <td className="hidden sm:table-cell px-4 py-3.5 text-center text-sm text-gray-600">{book.total_copies}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                              available === 0
                                ? 'bg-red-50 text-red-600'
                                : available <= 1
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-green-50 text-green-600'
                            }`}
                          >
                            {available}
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-3.5">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => setEditBook(book)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {profile?.role === 'admin' && (
                              <button
                                onClick={() => setDeleteTarget(book)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t.addBook}>
        <BookForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>

      <Modal open={!!editBook} onClose={() => setEditBook(null)} title={t.editBook}>
        {editBook && (
          <BookForm
            initial={{ title: editBook.title, author: editBook.author, isbn: editBook.isbn ?? '', total_copies: editBook.total_copies }}
            onSubmit={handleEdit}
            onCancel={() => setEditBook(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteBook(deleteTarget.id)
          setDeleteTarget(null)
        }}
        title={t.deleteBook}
        message={`"${deleteTarget?.title}"${t.deleteBookConfirmSuffix}`}
        confirmLabel={t.delete}
        variant="danger"
      />
    </AppLayout>
  )
}
