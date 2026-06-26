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
  return <span className={map[value] || 'badge-neutral'}>{value}</span>
}

function PriorityBadge({ value }) {
  if (!value) return null
  const map = {
    High: 'badge-high',
    Medium: 'badge-medium',
    Low: 'badge-low',
  }
  return <span className={map[value] || 'badge-low'}>{value}</span>
}

async function analyzeWithGemini(feedbackText, productName) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('No Gemini API key found')

  const prompt = `You are a product feedback analyst. Analyze the following feedback and return ONLY a valid JSON object with no extra text, markdown, or explanation.

Product: ${productName || 'Unknown'}
Feedback: "${feedbackText}"

Return exactly this JSON structure:
{
  "sentiment": "Positive" or "Neutral" or "Negative",
  "priority": "High" or "Medium" or "Low",
  "tags": ["tag1", "tag2"] (2-4 lowercase tags like: bug, ux, performance, feature-request, onboarding, pricing, design, speed, reliability, support),
  "summary": "One sentence summary under 15 words"
}

Rules:
- High priority = strong negative emotion, blocking issue, data loss, or security
- Medium priority = friction, confusion, missing feature
- Low priority = positive feedback, minor suggestions
- Tags must be lowercase with hyphens, no #`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.1 },
      }),
    }
  )

  const data = await res.json()
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
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
        const result = await analyzeWithGemini(feedbackText, productName)
        sentiment = result.sentiment || 'Neutral'
        priority = result.priority || 'Medium'
        tags = result.tags || []
        ai_summary = result.summary || ''
      } catch (aiErr) {
        console.error('Gemini error:', aiErr)
        // fallback defaults already set above
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
                required
              />
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
