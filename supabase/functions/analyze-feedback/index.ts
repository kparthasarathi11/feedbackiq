import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { feedbackText, productName } = await req.json()

    if (!feedbackText) {
      return new Response(
        JSON.stringify({ error: 'feedbackText is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiKey) {
      // Return mock data if no API key yet (for development)
      return new Response(
        JSON.stringify({
          sentiment: 'Neutral',
          priority: 'Medium',
          tags: ['general', 'feedback'],
          summary: 'AI analysis unavailable — add GEMINI_API_KEY to Supabase secrets'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.1,
          }
        })
      }
    )

    const geminiData = await response.json()
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Clean and parse JSON
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({
        sentiment: 'Neutral',
        priority: 'Medium',
        tags: ['general'],
        summary: 'Could not analyze feedback automatically'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
