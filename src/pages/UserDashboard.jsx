import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Navbar from '../components/Navbar.jsx'
import PSKFooter from '../components/PSKFooter.jsx'

function SentimentBadge({ value }) {
  if (!value) return null
  const map = {
    Positive: 'badge-positive',
    Negative: 'badge-negative',
    Neutral: 'badge-neutral',
  }
  return (
    <span className={map[value] || 'badge-neutral'}>
      😊 {value === 'Positive' ? 'Positive feedback' : value === 'Negative' ? 'Negative feedback' : 'Neutral feedback'}
    </span>
  )
}

function PriorityBadge({ value }) {
  if (!value) return null
  const map = {
    High: 'badge-high',
    Medium: 'badge-medium',
    Low: 'badge-low',
  }
  const icons = { High: '🔴', Medium: '🟡', Low: '🟢' }
  const labels = {
    High: 'Needs urgent attention',
    Medium: 'Will be reviewed soon',
    Low: 'Nice to have',
  }
  return (
    <span className={map[value] || 'badge-low'}>
      {icons[value]} {labels[value]}
    </span>
  )
}

function AILegend() {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6">
      <p className="text-xs font-semibold text-brand mb-2">✦ How AI analyzes your feedback</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Sentiment — how you feel</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge-positive text-[10px]">😊 Positive</span>
              <span className="text-[10px] text-gray-400">You're happy with it</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-negative text-[10px]">😤 Negative</span>
              <span className="text-[10px] text-gray-400">Something frustrated you</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-neutral text-[10px]">😐 Neutral</span>
              <span className="text-[10px] text-gray-400">Suggestion or observation</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Priority — how urgent it is</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge-high text-[10px]">🔴 High</span>
              <span className="text-[10px] text-gray-400">Blocking or critical issue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-medium text-[10px]">🟡 Medium</span>
              <span className="text-[10px] text-gray-400">Friction or missing feature</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-low text-[10px]">🟢 Low</span>
              <span className="text-[10px] text-gray-400">Nice to have</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function analyzeWithGroq(feedbackText, productName) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedbackText, productName }),
  })
  if (!res.ok) throw new Error('API call failed')
  return res.json()
}

export default function UserDashboard() {
  const { user } = useAuth()
  const [productName, setProductName] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [feedbacks, setFeedbacks] = useState([])
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true)

  useEffect(() => { fetchMyFeedbacks() }, [])

  async function fetchMyFeedbacks() {
    setLoadingFeedbacks(true)
    const { data } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setFeedbacks(data || [])
    setLoadingFeedbacks(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!feedbackText.trim()) return
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      let sentiment = 'Neutral', priority = 'Medium', tags = [], ai_summary = ''

      try {
        const result = await analyzeWithGroq(feedbackText, productName)
        sentiment = result.sentiment || 'Neutral'
        priority = result.priority || 'Medium'
        tags = result.tags || []
        ai_summary = result.summary || ''
      } catch (aiErr) {
        console.error('AI error:', aiErr)
      }

      const { error: insertError } = await supabase.from('feedbacks').insert({
        user_id: user.id,
        product_name: productName,
        feedback_text: feedbackText,
        sentiment,
        priority,
        tags,
        ai_summary,
        original_sentiment: sentiment,
        original_priority: priority,
        original_tags: tags,
      })

      if (insertError) throw insertError

      setSuccess('Feedback submitted and analyzed!')
      setProductName('')
      setFeedbackText('')
      fetchMyFeedbacks()
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">

        {/* AI Legend */}
        <AILegend />

        {/* Submit Form */}
        <div className="card mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Submit feedback</h2>
          <p className="text-xs text-gray-400 mb-5">AI will instantly tag and analyze your feedback</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-100 text-green-700 text-xs rounded-lg px-3 py-2 mb-4">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Product / App name</label>
                <input
                  className="input"
                  placeholder="e.g. Notion, Slack, Jira"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Your role (optional)</label>
                <input className="input" placeholder="e.g. Product Manager" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Your feedback</label>
              <textarea
  className="input resize-none h-24"
  placeholder="Describe your experience in detail…"
  value={feedbackText}
  onChange={e => setFeedbackText(e.target.value)}
  maxLength={500}
  required
/>
<div className="flex justify-end mt-1">
  <span className={`text-xs ${feedbackText.length > 450 ? 'text-red-400' : 'text-gray-400'}`}>
    {feedbackText.length}/500
  </span>
</div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setProductName(''); setFeedbackText('') }} className="btn-secondary">
                Clear
              </button>
              <button type="submit" disabled={submitting || !feedbackText.trim()} className="btn-primary">
                {submitting ? 'Analyzing...' : 'Submit & analyze ✦'}
              </button>
            </div>
          </form>
        </div>

        {/* Past Submissions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Your past submissions</h3>

          {loadingFeedbacks ? (
            <div className="text-xs text-gray-400 py-4">Loading...</div>
          ) : feedbacks.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-gray-400">No submissions yet. Submit your first feedback above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map(fb => (
                <div key={fb.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {fb.product_name && (
                          <span className="text-xs font-semibold text-brand">{fb.product_name}</span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(fb.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {fb.ai_summary ? (
                        <p className="text-sm text-gray-700">{fb.ai_summary}</p>
                      ) : (
                        <p className="text-sm text-gray-700 truncate">{fb.feedback_text}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 items-end shrink-0">
                      <SentimentBadge value={fb.sentiment} />
                      <PriorityBadge value={fb.priority} />
                    </div>
                  </div>
                  {fb.tags?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-3">
                      {fb.tags.map(tag => (
                        <span key={tag} className={fb.is_edited ? 'tag-edited' : 'tag'}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
      <PSKFooter />
    </div>
  )
}
