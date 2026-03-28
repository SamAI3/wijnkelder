import type { Handler, HandlerEvent } from '@netlify/functions'

const ALLOWED_ORIGIN = 'https://onzewijnkelder.netlify.app'
const MODEL = 'claude-sonnet-4-20250514'

export const handler: Handler = async (event: HandlerEvent) => {
  const origin = event.headers['origin']
  const responseOrigin = origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ''

  const corsHeaders = {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Methode niet toegestaan' }),
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'API-sleutel niet geconfigureerd' }),
    }
  }

  let messages: unknown[]
  let system: string | undefined
  try {
    const parsed = JSON.parse(event.body || '{}')
    messages = parsed.messages
    system = parsed.system
    if (!Array.isArray(messages)) throw new Error('messages ontbreekt')
  } catch {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ongeldig verzoek' }),
    }
  }

  const requestBody: Record<string, unknown> = {
    model: MODEL,
    max_tokens: 1024,
    messages,
  }
  if (system) requestBody.system = system

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  const data = await res.json()
  return {
    statusCode: res.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
}
