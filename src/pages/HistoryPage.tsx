import { useState, useMemo } from 'react'
import { Search, Download } from 'lucide-react'
import { useBorrowRecords } from '../hooks/useBorrowRecords'
import { useBooks } from '../hooks/useBooks'
import { useProfiles } from '../hooks/useProfiles'
import { isOverdue } from '../lib/utils'
import { AppLayout } from '../components/layout/AppLayout'
import { Badge } from '../components/ui/Badge'

type StatusFilter = 'all' | 'borrowed' | 'returned' | 'overdue'

export function HistoryPage() {
  const { borrowRecords, loading: recordsLoading } = useBorrowRecords()
  const { books, loading: booksLoading } = useBooks()
  const { profiles, loading: profilesLoading } = useProfiles()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const loading = recordsLoading || booksLoading || profilesLoading

  const getBook = (id: string) => books.find((b) => b.id === id)
  const getProfile = (id: string) => profiles.find((u) => u.id === id)

  const filtered = useMemo(() => {
    return [...borrowRecords]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter((r) => {
        if (search && !r.borrower_name.toLowerCase().includes(search.toLowerCase())) return false
        const overdue = isOverdue(r)
        if (statusFilter === 'overdue' && !overdue) return false
        if (statusFilter === 'returned' && r.status !== 'returned') return false
        if (statusFilter === 'borrowed' && (r.status !== 'borrowed' || overdue)) return false
        if (dateFrom && r.borrow_date < dateFrom) return false
        if (dateTo && r.borrow_date > dateTo) return false
        return true
      })
  }, [borrowRecords, search, statusFilter, dateFrom, dateTo])

  const exportCSV = () => {
    const headers = ['Borrower', 'Note', 'Book', 'Author', 'Staff', 'Borrow Date', 'Due Date', 'Return Date', 'Status']
    const rows = filtered.map((r) => {
      const book = getBook(r.book_id)
      const staff = getProfile(r.staff_id)
      const status = r.status === 'returned' ? 'Returned' : isOverdue(r) ? 'Overdue' : 'Borrowed'
      return [r.borrower_name, r.borrower_note ?? '', book?.title ?? '', book?.author ?? '', staff?.full_name ?? '', r.borrow_date, r.due_date, r.return_date ?? '', status]
    })
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `amico-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: borrowRecords.length },
    { key: 'borrowed', label: 'Borrowed', count: borrowRecords.filter((r) => r.status === 'borrowed' && !isOverdue(r)).length },
    { key: 'overdue', label: 'Overdue', count: borrowRecords.filter((r) => isOverdue(r)).length },
    { key: 'returned', label: 'Returned', count: borrowRecords.filter((r) => r.status === 'returned').length },
  ]

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">History</h1>
            <p className="text-sm text-gray-400 mt-0.5">Complete borrow & return audit trail</p>
          </div>
          <button
            onClick={exportCSV}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-3.5 mb-4 space-y-3">
          {/* Status tabs */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  statusFilter === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  statusFilter === tab.key ? 'bg-gray-100 text-gray-500' : 'text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search borrower…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 sm:flex-none px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <span>—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 sm:flex-none px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              {(dateFrom || dateTo || search) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); setSearch('') }} className="text-xs text-gray-400 hover:text-gray-600 underline whitespace-nowrap">
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-50 text-xs text-gray-400">
                {filtered.length} of {borrowRecords.length} records
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {[
                        { label: 'Borrower', mobile: true },
                        { label: 'Book', mobile: true },
                        { label: 'Staff', mobile: false },
                        { label: 'Borrow Date', mobile: false },
                        { label: 'Due Date', mobile: true },
                        { label: 'Return Date', mobile: false },
                        { label: 'Status', mobile: true },
                      ].map(({ label, mobile }) => (
                        <th
                          key={label}
                          className={`text-left px-4 py-3 text-xs font-medium text-gray-400 whitespace-nowrap ${mobile ? '' : 'hidden sm:table-cell'}`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                          No records match the current filters
                        </td>
                      </tr>
                    )}
                    {filtered.map((record) => {
                      const book = getBook(record.book_id)
                      const staff = getProfile(record.staff_id)
                      const overdue = isOverdue(record)
                      return (
                        <tr
                          key={record.id}
                          className={`transition-colors ${overdue ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-4 py-3.5">
                            <div className="text-sm font-medium text-gray-900">{record.borrower_name}</div>
                            {record.borrower_note && <div className="text-xs text-gray-400 hidden sm:block">{record.borrower_note}</div>}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-sm text-gray-700 max-w-[140px] sm:max-w-[160px] truncate">{book?.title ?? '—'}</div>
                            <div className="text-xs text-gray-400 hidden sm:block">{book?.author}</div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3.5 text-sm text-gray-500">
                            {staff?.full_name.split(' ')[0] ?? '—'}
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(record.borrow_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              {new Date(record.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                            {record.return_date
                              ? new Date(record.return_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                              : '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            {record.status === 'returned' ? (
                              <Badge variant="returned">Returned</Badge>
                            ) : overdue ? (
                              <Badge variant="overdue">Overdue</Badge>
                            ) : (
                              <Badge variant="borrowed">Borrowed</Badge>
                            )}
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
      </div>
    </AppLayout>
  )
}
