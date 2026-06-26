import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar.jsx'
import PSKFooter from '../components/PSKFooter.jsx'

const SENTIMENTS = ['Positive', 'Neutral', 'Negative']
const PRIORITIES = ['High', 'Medium', 'Low']

function SentimentBadge({ value }) {
  const map = { Positive: 'badge-positive', Negative: 'badge-negative', Neutral: 'badge-neutral' }
  return <span className={map[value] || 'badge-neutral'}>{value || '—'}</span>
}

function PriorityBadge({ value }) {
  const map = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }
  return <span className={map[value] || 'badge-low'}>{value || '—'}</span>
}

function SegControl({ options, value, onChange, colorMap }) {
  return (
    <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 border-r border-gray-200 last:border-r-0 transition-colors font-medium
            ${value === opt
              ? colorMap?.[opt] || 'bg-brand text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function InlineEditPanel({ feedback, onSave, onCancel }) {
  const [sentiment, setSentiment] = useState(feedback.sentiment)
  const [priority, setPriority] = useState(feedback.priority)
  const [tags, setTags] = useState(feedback.tags || [])
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  function removeTag(tag) { setTags(tags.filter(t => t !== tag)) }

  function addTag(e) {
    e.preventDefault()
    const t = newTag.trim().toLowerCase().replace(/\s+/g, '-').replace(/^#/, '')
    if (t && !tags.includes(t)) setTags([...tags, t])
    setNewTag('')
  }

  function revertToAI() {
    setSentiment(feedback.original_sentiment || feedback.sentiment)
    setPriority(feedback.original_priority || feedback.priority)
    setTags(feedback.original_tags || feedback.tags || [])
  }

  async function handleSave() {
    setSaving(true)
    await onSave(feedback.id, { sentiment, priority, tags })
    setSaving(false)
  }

  const sentimentColors = {
    Positive: 'bg-green-50 text-green-700',
    Neutral: 'bg-amber-50 text-amber-700',
    Negative: 'bg-red-50 text-red-700',
  }
  const priorityColors = {
    High: 'bg-red-50 text-red-700',
    Medium: 'bg-amber-50 text-amber-700',
    Low: 'bg-green-50 text-green-700',
  }

  return (
    <div className="border border-brand bg-brand-light/30 rounded-xl overflow-hidden mb-2">
      {/* Row header */}
      <div className="bg-brand-light px-4 py-3 flex items-center justify-between border-b border-blue-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-brand">Editing</span>
          {feedback.product_name && (
            <span className="text-xs font-semibold text-gray-700">{feedback.product_name}</span>
          )}
        </div>
        <span className="text-xs text-blue-400">Changes saved to DB on confirm</span>
      </div>

      <div className="p-4 space-y-4 bg-white">
        {/* Original text */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Original feedback</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{feedback.feedback_text}</p>
        </div>

        {/* Sentiment + Priority */}
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Sentiment</p>
            <SegControl options={SENTIMENTS} value={sentiment} onChange={setSentiment} colorMap={sentimentColors} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Priority</p>
            <SegControl options={PRIORITIES} value={priority} onChange={setPriority} colorMap={priorityColors} />
          </div>
        </div>

        {/* Tag editor */}
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">Tags — click × to remove</p>
          <div className="flex flex-wrap gap-1.5 p-2.5 border border-gray-200 rounded-lg bg-gray-50 min-h-[36px]">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                #{tag}
                <button onClick={() => removeTag(tag)} className="text-blue-400 hover:text-blue-700 font-medium">×</button>
              </span>
            ))}
            <form onSubmit={addTag} className="inline-flex">
              <input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="+ add tag"
                className="text-xs bg-transparent outline-none placeholder-gray-400 w-20"
              />
            </form>
          </div>
        </div>

        {/* AI original */}
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2.5">
          <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">🤖 AI original classification</p>
          <div className="flex flex-wrap gap-2 items-center">
            <SentimentBadge value={feedback.original_sentiment} />
            <PriorityBadge value={feedback.original_priority} />
            {(feedback.original_tags || []).map(tag => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={revertToAI}
            className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors flex items-center gap-1"
          >
            ↩ Revert to AI original
          </button>
          <div className="flex gap-2">
            <button onClick={onCancel} className="btn-secondary text-xs py-1.5">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-1.5">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [editingId, setEditingId] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState('')

  useEffect(() => { fetchFeedbacks() }, [])

  async function fetchFeedbacks() {
    setLoading(true)
    const { data } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false })
    setFeedbacks(data || [])
    setLoading(false)
  }

  async function handleSave(id, updates) {
    const { error } = await supabase
      .from('feedbacks')
      .update({ ...updates, is_edited: true })
      .eq('id', id)

    if (!error) {
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, ...updates, is_edited: true } : f))
      setEditingId(null)
      setSaveSuccess('Changes saved successfully.')
      setTimeout(() => setSaveSuccess(''), 3000)
    }
  }

  const filtered = filter === 'All' ? feedbacks : feedbacks.filter(f => f.sentiment === filter)

  const stats = {
    total: feedbacks.length,
    positive: feedbacks.filter(f => f.sentiment === 'Positive').length,
    negative: feedbacks.filter(f => f.sentiment === 'Negative').length,
    neutral: feedbacks.filter(f => f.sentiment === 'Neutral').length,
  }

  // Get top tags
  const tagCounts = {}
  feedbacks.forEach(f => (f.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1 }))
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900' },
            { label: 'Positive', value: stats.positive, color: 'text-green-700' },
            { label: 'Negative', value: stats.negative, color: 'text-red-700' },
            { label: 'Neutral', value: stats.neutral, color: 'text-amber-700' },
          ].map(s => (
            <div key={s.label} className="card py-3">
              <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* AI Theme Summary */}
        {topTags.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs font-semibold text-brand mb-1.5">✦ Top themes from AI analysis</p>
            <div className="flex flex-wrap gap-2">
              {topTags.map(([tag, count]) => (
                <span key={tag} className="text-xs bg-white border border-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                  #{tag} <span className="text-blue-400 ml-1">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Success toast */}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-100 text-green-700 text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
            ✓ {saveSuccess} Purple tags = human-corrected. Revert anytime via Edit.
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['All', 'Positive', 'Negative', 'Neutral'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === f
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Feedback list */}
        {loading ? (
          <div className="text-xs text-gray-400 py-8 text-center">Loading feedbacks...</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-sm text-gray-400">No feedbacks yet. Share the app link with others to collect feedback.</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_0.6fr_0.7fr] gap-3 text-xs text-gray-400 font-medium px-4 py-2 border-b border-gray-100 mb-1">
              <div>Summary</div>
              <div>Sentiment</div>
              <div>Priority</div>
              <div>Tags</div>
              <div>Date</div>
              <div>Action</div>
            </div>

            {filtered.map(fb => (
              editingId === fb.id ? (
                <InlineEditPanel
                  key={fb.id}
                  feedback={fb}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div
                  key={fb.id}
                  className={`grid grid-cols-[2fr_1fr_1fr_1.5fr_0.6fr_0.7fr] gap-3 items-center px-4 py-3 border-b border-gray-50 hover:bg-white transition-colors rounded-lg
                    ${editingId && editingId !== fb.id ? 'opacity-40' : ''}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {fb.is_edited && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 inline-block"></span>}
                      {fb.product_name && <span className="text-xs font-semibold text-brand shrink-0">{fb.product_name}</span>}
                    </div>
                    <p className="text-xs text-gray-700 truncate">{fb.ai_summary || fb.feedback_text}</p>
                  </div>
                  <div><SentimentBadge value={fb.sentiment} /></div>
                  <div><PriorityBadge value={fb.priority} /></div>
                  <div className="flex flex-wrap gap-1">
                    {(fb.tags || []).slice(0, 3).map(tag => (
                      <span key={tag} className={fb.is_edited ? 'tag-edited' : 'tag'}>#{tag}</span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(fb.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {fb.is_edited && <div className="text-purple-400 text-[10px]">● edited</div>}
                  </div>
                  <div>
                    <button
                      onClick={() => setEditingId(fb.id)}
                      className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1 hover:border-brand hover:text-brand transition-colors flex items-center gap-1"
                    >
                      ✎ Edit
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </main>
      <PSKFooter />
    </div>
  )
}
