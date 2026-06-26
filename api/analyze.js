export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { feedbackText, productName } = req.body

// OLD
const apiKey = process.env.VITE_GEMINI_API_KEY
  const apiKey = process.env.VITE_GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing Gemini API key' })

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

    const data = await geminiRes.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('Gemini error:', err)
    return res.status(500).json({ error: 'Gemini call failed' })
  }
}
