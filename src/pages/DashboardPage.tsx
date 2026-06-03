import { BookOpen, BookMarked, AlertTriangle, Library } from 'lucide-react'
import { useBooks } from '../hooks/useBooks'
import { useBorrowRecords } from '../hooks/useBorrowRecords'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { isOverdue } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { AppLayout } from '../components/layout/AppLayout'

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  accent,
}: {
  label: string
  value: number
  icon: React.ElementType
  sub?: string
  accent?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>
      <p className={`text-3xl font-semibold ${accent ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export function DashboardPage() {
  const { profile } = useAuth()
  const { t, locale } = useLanguage()
  const { books, loading: booksLoading } = useBooks()
  const { borrowRecords, loading: recordsLoading } = useBorrowRecords()

  const loading = booksLoading || recordsLoading

  const totalBooks = books.length
  const totalCopies = books.reduce((sum, b) => sum + b.total_copies, 0)
  const currentlyBorrowed = borrowRecords.filter((r) => r.status !== 'returned').length
  const overdueCount = borrowRecords.filter((r) => isOverdue(r)).length
  const availableCopies = totalCopies - currentlyBorrowed

  const recent = [...borrowRecords]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  const getBook = (id: string) => books.find((b) => b.id === id)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return t.goodMorning
    if (h < 17) return t.goodAfternoon
    return t.goodEvening
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl font-semibold text-gray-900">
            {greeting()}, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString(locale, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard label={t.totalTitles} value={totalBooks} icon={Library} sub={`${totalCopies} ${t.copies}`} />
              <StatCard label={t.available} value={availableCopies} icon={BookOpen} sub={t.onShelf} accent="text-green-600" />
              <StatCard label={t.borrowed} value={currentlyBorrowed} icon={BookMarked} sub={t.currentlyOut} accent="text-blue-600" />
              <StatCard
                label={t.overdue}
                value={overdueCount}
                icon={AlertTriangle}
                sub={overdueCount > 0 ? t.needsAttention : t.allOnTime}
                accent={overdueCount > 0 ? 'text-red-600' : 'text-gray-900'}
              />
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">{t.recentActivity}</h2>
                <span className="text-xs text-gray-400">{t.last10Records}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left px-4 sm:px-5 py-3 text-xs font-medium text-gray-400">{t.borrower}</th>
                      <th className="text-left px-4 sm:px-5 py-3 text-xs font-medium text-gray-400">{t.book}</th>
                      <th className="hidden sm:table-cell text-left px-5 py-3 text-xs font-medium text-gray-400">{t.dueDate}</th>
                      <th className="text-left px-4 sm:px-5 py-3 text-xs font-medium text-gray-400">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recent.map((record) => {
                      const book = getBook(record.book_id)
                      const overdue = isOverdue(record)
                      return (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-5 py-3.5">
                            <div className="text-sm font-medium text-gray-900">{record.borrower_name}</div>
                            {record.borrower_note && (
                              <div className="text-xs text-gray-400 hidden sm:block">{record.borrower_note}</div>
                            )}
                          </td>
                          <td className="px-4 sm:px-5 py-3.5">
                            <div className="text-sm text-gray-700">{book?.title ?? '—'}</div>
                            <div className="text-xs text-gray-400 hidden sm:block">{book?.author}</div>
                          </td>
                          <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-gray-500">
                            {new Date(record.due_date).toLocaleDateString(locale, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 sm:px-5 py-3.5">
                            {record.status === 'returned' ? (
                              <Badge variant="returned">{t.statusReturned}</Badge>
                            ) : overdue ? (
                              <Badge variant="overdue">{t.statusOverdue}</Badge>
                            ) : (
                              <Badge variant="borrowed">{t.statusBorrowed}</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
