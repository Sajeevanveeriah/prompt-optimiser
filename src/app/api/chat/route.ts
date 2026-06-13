import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { messages, model = 'llama-3.1-8b-instant' } = await req.json()
  const apiKey = process.env.GROQ_API_KEY ?? req.headers.get('x-groq-api-key')

  if (!apiKey) {
    return Response.json(
      { error: 'No Groq API key. Set GROQ_API_KEY in .env.local or enter it in Settings.' },
      { status: 401 }
    )
  }

  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 8192, temperature: 0.7 }),
  })

  if (!upstream.ok) {
    const body = await upstream.text()
    return Response.json({ error: body }, { status: upstream.status })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
