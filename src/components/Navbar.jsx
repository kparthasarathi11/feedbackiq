import { useAuth } from '../hooks/useAuth.jsx'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U'

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-brand"></div>
        <span className="font-semibold text-gray-900 text-sm">FeedbackIQ</span>
        {profile?.role === 'admin' && (
          <span className="text-xs text-brand bg-brand-light px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">{user?.email}</span>
        <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center">
          <span className="text-white text-[10px] font-medium">{initials}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
