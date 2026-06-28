export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { feedbackText, productName } = await req.json()

  if (!feedbackText) return new Response(JSON.stringify({ error: 'feedbackText required' }), { status: 400 })

  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) return new Response(JSON.stringify({ error: 'GROQ_API_KEY not set' }), { status: 500 })

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
- Tags: 2-4 lowercase tags that best describe the feedback topic. Choose from: bug, crash, data-loss, login-issue, performance, speed, reliability, feature-request, missingfeature, ui-design, navigation, onboarding, pricing, billing, support, integration, notification, search, export, mobile. Only use ux if the feedback is specifically about user experience flow.  Pick the most specific tag possible, not a generic one.
- No markdown, no extra text, pure JSON only`

  try {
    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.1,
        }),
      }
    )

    const data = await groqRes.json()

    if (!groqRes.ok) {
      return new Response(JSON.stringify({ error: 'Groq API error', details: data }), { status: 500 })
    }

    const raw = data?.choices?.[0]?.message?.content || ''
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
