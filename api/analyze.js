export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { feedbackText, productName } = await req.json()

  if (!feedbackText) return new Response(JSON.stringify({ error: 'feedbackText required' }), { status: 400 })

  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set' }), { status: 500 })

  const prompt = `You are a product feedback analyst. Analyze the following feedback and return ONLY a valid JSON object with no extra text, markdown, or explanation.

Product: ${productName || 'Unknown'}
Feedback: "${feedbackText}"

Return exactly this JSON structure:
{
  "sentiment": "Positive" or "Neutral" or "Negative",
  "priority": "High" or "Medium" or "Low",
  "tags": ["tag1", "tag2"],
  "summary": "One sentence summary under 15 words"
}

Rules:
- High priority = strong negative emotion, blocking issue, data loss, security
- Medium priority = friction, confusion, missing feature
- Low priority = positive feedback, minor suggestions
- Tags: 2-4 lowercase with hyphens from: bug, ux, performance, feature-request, onboarding, pricing, design, speed, reliability, support
- No markdown, no extra text, pure JSON only`

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.1 },
        }),
      }
    )

    const data = await geminiRes.json()

    if (!geminiRes.ok) {
      return new Response(JSON.stringify({ error: 'Gemini API error', details: data }), { status: 500 })
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { feedbackText, productName } = req.body

  if (!feedbackText) return res.status(400).json({ error: 'feedbackText required' })

  const apiKey = process.env.GEMINI_API_KEY
  
  // Temporary debug — remove after fixing
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set in environment' })
  }

  const prompt = `You are a product feedback analyst. Analyze the following feedback and return ONLY a valid JSON object with no extra text, markdown, or explanation.

Product: ${productName || 'Unknown'}
Feedback: "${feedbackText}"

Return exactly this JSON structure:
{
  "sentiment": "Positive" or "Neutral" or "Negative",
  "priority": "High" or "Medium" or "Low",
  "tags": ["tag1", "tag2"],
  "summary": "One sentence summary under 15 words"
}

Rules:
- High priority = strong negative emotion, blocking issue, data loss, security
- Medium priority = friction, confusion, missing feature
- Low priority = positive feedback, minor suggestions
- Tags: 2-4 lowercase with hyphens from: bug, ux, performance, feature-request, onboarding, pricing, design, speed, reliability, support
- No markdown, no extra text, pure JSON only`

  try {
    const geminiRes = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.1 },
        }),
      }
    )

    const data = await geminiRes.json()
    
    // Log what Gemini actually returned
    console.log('Gemini response status:', geminiRes.status)
    console.log('Gemini response data:', JSON.stringify(data))

    if (!geminiRes.ok) {
      return res.status(500).json({ 
        error: 'Gemini API error', 
        status: geminiRes.status,
        details: data 
      })
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('Gemini error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
