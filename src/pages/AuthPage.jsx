import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useNavigate } from 'react-router-dom'
import PSKFooter from '../components/PSKFooter.jsx'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (isLogin) {
      const { data, error } = await signIn(email, password)
      if (error) { setError(error.message); setLoading(false); return }
      // redirect handled by App.jsx after profile loads
    } else {
      const { data, error } = await signUp(email, password)
      if (error) { setError(error.message); setLoading(false); return }
      setSuccess('Account created! You can now sign in.')
      setIsLogin(true)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-semibold text-sm">FQ</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">FeedbackIQ</h1>
            <p className="text-sm text-gray-400 mt-1">AI-powered feedback triage for PMs</p>
          </div>

          {/* Card */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              {isLogin ? 'Sign in' : 'Create account'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-100 text-green-700 text-xs rounded-lg px-3 py-2 mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess('') }}
                className="text-brand font-medium hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

        </div>
      </div>
      <PSKFooter />
    </div>
  )
}
