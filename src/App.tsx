import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { LanguageProvider } from './hooks/useLanguage'
import { LoginPage } from './pages/LoginPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { UnauthorizedPage } from './pages/UnauthorizedPage'
import { DashboardPage } from './pages/DashboardPage'
import { BooksPage } from './pages/BooksPage'
import { BorrowPage } from './pages/BorrowPage'
import { HistoryPage } from './pages/HistoryPage'
import { UsersPage } from './pages/UsersPage'

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/borrow" element={<BorrowPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
