import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.jsx'
import AuthPage from './pages/AuthPage.jsx'
import UserDashboard from './pages/UserDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

function ProtectedRoute({ children, requireAdmin }) {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )

  if (!user) return <Navigate to="/auth" replace />
  if (requireAdmin && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return children
}

export default function App() {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <AuthPage />}
      />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><UserDashboard /></ProtectedRoute>}
      />
      <Route
        path="/admin"
        element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>}
      />
      <Route
        path="*"
        element={<Navigate to={user ? (profile?.role === 'admin' ? '/admin' : '/dashboard') : '/auth'} replace />}
      />
    </Routes>
  )
}
