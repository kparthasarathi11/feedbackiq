import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar.jsx'
import PSKFooter from '../components/PSKFooter.jsx'

const GOLDEN = [
  { id:1, category:"Crash / data loss", product:"Notion", text:"The app crashed right after I pasted a large table and I lost 2 hours of work. No autosave warning at all.", expectedSentiment:"Negative", expectedPriority:"High", expectedTags:["crash","data-loss","reliability"] },
  { id:2, category:"Positive / delight", product:"Figma", text:"Figma's new auto-layout is absolutely incredible. It cut my component-building time in half. Best update in years!", expectedSentiment:"Positive", expectedPriority:"Low", expectedTags:["ui-design","feature-request"] },
  { id:3, category:"Login / auth", product:"Slack", text:"I keep getting logged out every morning even though I have 'keep me signed in' checked. Happens on both Chrome and Safari.", expectedSentiment:"Negative", expectedPriority:"High", expectedTags:["login-issue","reliability","bug"] },
  { id:4, category:"Feature request", product:"Jira", text:"It would be really helpful if we could bulk-edit story points across multiple tickets without opening each one individually.", expectedSentiment:"Neutral", expectedPriority:"Medium", expectedTags:["feature-request","missing-feature"] },
  { id:5, category:"Performance", product:"Linear", text:"The search is painfully slow when the team has more than 500 issues. Takes 4-5 seconds every query.", expectedSentiment:"Negative", expectedPriority:"High", expectedTags:["performance","speed","search"] },
  { id:6, category:"Onboarding", product:"Notion", text:"As a new user I had absolutely no idea where to start. The blank canvas is intimidating and the tutorial is too long.", expectedSentiment:"Negative", expectedPriority:"Medium", expectedTags:["onboarding","navigation","ui-design"] },
  { id:7, category:"Pricing / billing", product:"Figma", text:"The new pricing is honestly shocking. We went from $12 to $45 per seat with barely any new features. Considering switching.", expectedSentiment:"Negative", expectedPriority:"High", expectedTags:["pricing","billing"] },
  { id:8, category:"Sarcasm / tricky", product:"Jira", text:"Oh great, another Jira update that made everything slower and moved all the buttons to different places. Love it.", expectedSentiment:"Negative", expectedPriority:"Medium", expectedTags:["performance","navigation","bug"] },
  { id:9, category:"Positive / feature praise", product:"Linear", text:"The keyboard shortcuts in Linear are so well thought out. I barely touch my mouse anymore. Team productivity went up noticeably.", expectedSentiment:"Positive", expectedPriority:"Low", expectedTags:["ui-design","navigation"] },
  { id:10, category:"Mixed sentiment", product:"Slack", text:"Huddles are great but the video quality is terrible on lower bandwidth. Audio works fine, video is unwatchable.", expectedSentiment:"Neutral", expectedPriority:"Medium", expectedTags:["bug","performance","speed"] },
  { id:11, category:"Support / response", product:"Intercom", text:"Submitted a critical bug 3 days ago with zero response. The support team seems completely overwhelmed or non-existent.", expectedSentiment:"Negative", expectedPriority:"High", expectedTags:["support","reliability"] },
  { id:12, category:"Mobile experience", product:"Notion", text:"The mobile app is basically unusable for editing. Keyboard pops up and hides the cursor, impossible to select text.", expectedSentiment:"Negative", expectedPriority:"High", expectedTags:["mobile","bug","ui-design"] },
  { id:13, category:"Integration", product:"Jira", text:"The GitHub integration stopped syncing PRs to tickets about a week ago. Entire engineering workflow is broken.", expectedSentiment:"Negative", expectedPriority:"High", expectedTags:["integration","bug","reliability"] },
  { id:14, category:"Vague / generic", product:"Slack", text:"Pretty good app overall, does what it needs to do. Nothing special but gets the job done.", expectedSentiment:"Neutral", expectedPriority:"Low", expectedTags:["ui-design"] },
  { id:15, category:"Export / data", product:"Linear", text:"Please add CSV and PDF export for roadmaps. We constantly have to take screenshots for stakeholder updates which is embarrassing.", expectedSentiment:"Neutral", expectedPriority:"Medium", expectedTags:["export","missing-feature","feature-request"] },
  { id:16, category:"Notification overload", product:"Slack", text:"The notification system is completely out of control. I get pinged for everything even when I mute channels. Very disruptive.", expectedSentiment:"Negative", expectedPriority:"Medium", expectedTags:["notification","bug","ui-design"] },
  { id:17, category:"Positive / onboarding", product:"Linear", text:"Onboarded our 15-person team in under an hour. The import from Jira worked flawlessly and the UI is self-explanatory.", expectedSentiment:"Positive", expectedPriority:"Low", expectedTags:["onboarding","integration"] },
  { id:18, category:"Security concern", product:"Notion", text:"I accidentally shared a private page publicly and only noticed because a colleague mentioned seeing it. No warning was shown.", expectedSentiment:"Negative", expectedPriority:"High", expectedTags:["bug","reliability","ui-design"] },
  { id:19, category:"Emoji / informal", product:"Figma", text:"omg the new variables feature is a GAME CHANGER!! spent 2 hrs playing with it, so good. please never remove it", expectedSentiment:"Positive", expectedPriority:"Low", expectedTags:["ui-design","feature-request"] },
  { id:20, category:"Multi-issue", product:"Jira", text:"Backlog view is slow, the sprint board doesn't update in real time, and the roadmap feature is half-baked. Feels abandoned.", expectedSentiment:"Negative", expectedPriority:"High", expectedTags:["performance","bug","missing-feature","reliability"] }
]

function StatCard({ label, value, sub, color }) {
  const colors = { blue: 'text-blue-700', green: 'text-green-700', red: 'text-red-700', amber: 'text-amber-700', gray: 'text-gray-700' }
  return (
    <div className="card py-3">
      <div className={`text-2xl font-semibold ${colors[color] || 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function AccuracyBar({ label, pct, color }) {
  const colors = { blue: 'bg-blue-500', green: 'bg-green-500', amber: 'bg-amber-500' }
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${colors[color]} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-10 text-right">{pct}%</span>
    </div>
  )
}

function SentimentBadge({ value }) {
  const map = { Positive: 'badge-positive', Negative: 'badge-negative', Neutral: 'badge-neutral' }
  return value ? <span className={map[value] || 'badge-neutral'}>{value}</span> : <span className="text-gray-300 text-xs">—</span>
}

function PriorityBadge({ value }) {
  const map = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }
  return value ? <span className={map[value] || 'badge-low'}>{value}</span> : <span className="text-gray-300 text-xs">—</span>
}

export default function EvalDashboard() {
  const [results, setResults] = useState([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [lastRanAt, setLastRanAt] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { fetchLatestRun() }, [])

  async function fetchLatestRun() {
    setLoading(true)
    const { data } = await supabase
      .from('evals')
      .select('*')
      .order('ran_at', { ascending: false })
      .limit(20)
    if (data && data.length > 0) {
      setResults(data)
      setLastRanAt(data[0].ran_at)
    }
    setLoading(false)
  }

  async function runEval() {
    setRunning(true)
    setProgress(0)
    const newResults = []

    for (let i = 0; i < GOLDEN.length; i++) {
      const g = GOLDEN[i]
      let aiSentiment = '', aiPriority = '', aiTags = [], aiSummary = ''

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedbackText: g.text, productName: g.product }),
        })
        const data = await res.json()
        aiSentiment = data.sentiment || ''
        aiPriority = data.priority || ''
        aiTags = data.tags || []
        aiSummary = data.summary || ''
      } catch (e) {
        console.error('Eval error on #' + g.id, e)
      }

      const sentimentCorrect = aiSentiment === g.expectedSentiment
      const priorityCorrect = aiPriority === g.expectedPriority
      const tagsMatch = aiTags.some(t => g.expectedTags.includes(t))
      const overallCorrect = sentimentCorrect && priorityCorrect

      const row = {
        id: g.id,
        category: g.category,
        product: g.product,
        feedback_text: g.text,
        expected_sentiment: g.expectedSentiment,
        expected_priority: g.expectedPriority,
        expected_tags: g.expectedTags,
        ai_sentiment: aiSentiment,
        ai_priority: aiPriority,
        ai_tags: aiTags,
        ai_summary: aiSummary,
        sentiment_correct: sentimentCorrect,
        priority_correct: priorityCorrect,
        tags_match: tagsMatch,
        overall_correct: overallCorrect,
        model_version: 'llama-3.1-8b-instant',
        ran_at: new Date().toISOString(),
      }

      newResults.push(row)
      setProgress(i + 1)
      await supabase.from('evals').upsert(row, { onConflict: 'id' })
      await new Promise(r => setTimeout(r, 300))
    }

    setResults(newResults)
    setLastRanAt(new Date().toISOString())
    setRunning(false)
  }

  const filtered = filter === 'all' ? results
    : filter === 'correct' ? results.filter(r => r.overall_correct)
    : results.filter(r => !r.overall_correct && r.ai_sentiment)

  const labeled = results.filter(r => r.ai_sentiment)
  const correct = results.filter(r => r.overall_correct)
  const sentCorrect = labeled.filter(r => r.sentiment_correct)
  const priCorrect = labeled.filter(r => r.priority_correct)
  const tagMatch = labeled.filter(r => r.tags_match)

  const overallPct = labeled.length ? Math.round(correct.length / labeled.length * 100) : 0
  const sentPct = labeled.length ? Math.round(sentCorrect.length / labeled.length * 100) : 0
  const priPct = labeled.length ? Math.round(priCorrect.length / labeled.length * 100) : 0
  const tagPct = labeled.length ? Math.round(tagMatch.length / labeled.length * 100) : 0

  const categoryBreakdown = {}
  results.forEach(r => {
    if (!r.ai_sentiment) return
    if (!categoryBreakdown[r.category]) categoryBreakdown[r.category] = { total: 0, correct: 0 }
    categoryBreakdown[r.category].total++
    if (r.overall_correct) categoryBreakdown[r.category].correct++
  })

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Model eval dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Golden dataset · 20 examples · model: <span className="font-medium text-gray-600">llama-3.1-8b-instant</span>
              {lastRanAt && (
                <span> · last run {new Date(lastRanAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </p>
          </div>
          <button onClick={runEval} disabled={running} className="btn-primary flex items-center gap-2">
            {running ? `Running ${progress}/20…` : '▶ Run eval'}
          </button>
        </div>

        {/* Progress bar */}
        {running && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Sending examples through /api/analyze…</span>
              <span>{progress}/20</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-2 bg-brand rounded-full transition-all" style={{ width: `${(progress / 20) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Overall accuracy" value={labeled.length ? `${overallPct}%` : '—'} sub={`${correct.length}/${labeled.length} correct`} color="blue" />
          <StatCard label="Sentiment accuracy" value={labeled.length ? `${sentPct}%` : '—'} sub={`${sentCorrect.length}/${labeled.length}`} color="green" />
          <StatCard label="Priority accuracy" value={labeled.length ? `${priPct}%` : '—'} sub={`${priCorrect.length}/${labeled.length}`} color="amber" />
          <StatCard label="Tag match rate" value={labeled.length ? `${tagPct}%` : '—'} sub={`${tagMatch.length}/${labeled.length}`} color="gray" />
        </div>

        {/* Accuracy bars */}
        {labeled.length > 0 && (
          <div className="card mb-6">
            <p className="text-xs font-semibold text-gray-700 mb-4">Accuracy breakdown</p>
            <div className="space-y-3">
              <AccuracyBar label="Overall (sent + pri)" pct={overallPct} color="blue" />
              <AccuracyBar label="Sentiment only" pct={sentPct} color="green" />
              <AccuracyBar label="Priority only" pct={priPct} color="amber" />
              <AccuracyBar label="Tags (any match)" pct={tagPct} color="blue" />
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <div className="card mb-6">
            <p className="text-xs font-semibold text-gray-700 mb-4">Accuracy by category</p>
            <div className="space-y-2.5">
              {Object.entries(categoryBreakdown).map(([cat, { total, correct }]) => {
                const pct = Math.round(correct / total * 100)
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-44 shrink-0 truncate">{cat}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-20 text-right shrink-0">{correct}/{total} · {pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Confusion — where model goes wrong */}
        {labeled.length > 0 && (
          <div className="card mb-6">
            <p className="text-xs font-semibold text-gray-700 mb-4">Where the model goes wrong</p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">Sentiment mismatches</p>
                {results.filter(r => r.ai_sentiment && !r.sentiment_correct).length === 0
                  ? <p className="text-xs text-green-600">No mismatches ✓</p>
                  : results.filter(r => r.ai_sentiment && !r.sentiment_correct).map(r => (
                    <div key={r.id} className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] text-gray-400 w-6">#{r.id}</span>
                      <span className="text-xs text-red-500 font-medium">{r.ai_sentiment}</span>
                      <span className="text-[10px] text-gray-400">expected</span>
                      <span className="text-xs text-green-600 font-medium">{r.expected_sentiment}</span>
                      <span className="text-[10px] text-gray-400 truncate">· {r.category}</span>
                    </div>
                  ))
                }
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">Priority mismatches</p>
                {results.filter(r => r.ai_priority && !r.priority_correct).length === 0
                  ? <p className="text-xs text-green-600">No mismatches ✓</p>
                  : results.filter(r => r.ai_priority && !r.priority_correct).map(r => (
                    <div key={r.id} className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] text-gray-400 w-6">#{r.id}</span>
                      <span className="text-xs text-red-500 font-medium">{r.ai_priority}</span>
                      <span className="text-[10px] text-gray-400">expected</span>
                      <span className="text-xs text-green-600 font-medium">{r.expected_priority}</span>
                      <span className="text-[10px] text-gray-400 truncate">· {r.category}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'all', label: `All (${results.length})` },
            { key: 'correct', label: `Correct (${correct.length})` },
            { key: 'wrong', label: `Wrong (${results.filter(r => !r.overall_correct && r.ai_sentiment).length})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === f.key ? 'bg-brand text-white border-brand' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-xs text-gray-400 py-8 text-center">Loading last eval run…</div>
        ) : results.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-sm text-gray-400 mb-2">No eval runs yet.</p>
            <p className="text-xs text-gray-400">Click "Run eval" to send all 20 golden examples through your AI and see accuracy scores.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <div key={r.id}>
                <div
                  className={`card cursor-pointer hover:border-gray-200 transition-colors
                    ${r.overall_correct && r.ai_sentiment ? 'border-l-4 border-l-green-400' : ''}
                    ${!r.overall_correct && r.ai_sentiment ? 'border-l-4 border-l-red-400' : ''}
                    ${!r.ai_sentiment ? 'opacity-50' : ''}
                  `}
                  style={{ borderRadius: '0 12px 12px 0' }}
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-gray-400 font-medium">#{r.id}</span>
                      <span className="text-xs font-semibold text-brand">{r.product}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{r.category}</span>
                    </div>
                    {r.ai_sentiment && (
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${r.overall_correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {r.overall_correct ? '✓ Pass' : '✗ Fail'}
                      </span>
                    )}
                  </div>

                  {/* Feedback text — full width */}
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{r.feedback_text}</p>

                  {/* Badges row */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-14 shrink-0">Expected</span>
                      <SentimentBadge value={r.expected_sentiment} />
                      <PriorityBadge value={r.expected_priority} />
                    </div>
                    {r.ai_sentiment && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-14 shrink-0">AI output</span>
                        <SentimentBadge value={r.ai_sentiment} />
                        <PriorityBadge value={r.ai_priority} />
                      </div>
                    )}
                    {r.ai_sentiment && (
                      <div className="flex items-center gap-3 ml-auto">
                        <span className={`text-[10px] font-medium ${r.sentiment_correct ? 'text-green-600' : 'text-red-500'}`}>
                          Sentiment {r.sentiment_correct ? '✓' : '✗'}
                        </span>
                        <span className={`text-[10px] font-medium ${r.priority_correct ? 'text-green-600' : 'text-red-500'}`}>
                          Priority {r.priority_correct ? '✓' : '✗'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === r.id && (
                  <div className="mx-1 mb-2 p-4 bg-gray-50 border border-gray-100 rounded-b-xl border-t-0 -mt-2 pt-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-1.5">Expected tags</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {(r.expected_tags || []).map(t => (
                            <span key={t} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-medium">#{t}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-1.5">AI tags <span className="font-normal">(green = match, red = hallucinated)</span></p>
                        <div className="flex gap-1.5 flex-wrap">
                          {(r.ai_tags || []).map(t => {
                            const match = (r.expected_tags || []).includes(t)
                            return (
                              <span key={t} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${match ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                #{t}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    {r.ai_summary && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-400 font-medium mb-1">AI summary</p>
                        <p className="text-xs text-gray-600">{r.ai_summary}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <PSKFooter />
    </div>
  )
}
