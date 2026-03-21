const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const MODEL = 'claude-sonnet-4-20250514'

async function callClaude(messages: { role: string; content: unknown }[], systemPrompt?: string): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: 1024,
    messages,
  }
  if (systemPrompt) body.system = systemPrompt

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-allow-browser': 'true',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic API fout: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.content[0].text as string
}

function extractJSON(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Geen JSON gevonden in antwoord')
  return JSON.parse(match[0])
}

export interface WijnScan {
  naam?: string
  wijnhuis?: string
  jaartal?: number
  land?: string
  druivensoorten?: string[]
  smaakomschrijving?: string
  prijs?: number
  drinkVanaf?: number
  drinkVoor?: number
}

export async function scanEtiket(base64Image: string, mimeType: string): Promise<WijnScan> {
  const sysPrompt = `Je bent een wijnexpert. Analyseer het etiket en geef alle zichtbare informatie terug.
Geef ook een schatting van het ideale drinkvenster als drinkVanaf (jaar) en drinkVoor (jaar) op basis van wijntype, druivensoorten, regio en oogstjaar.
Antwoord altijd in JSON met velden: naam, wijnhuis, jaartal, land, druivensoorten (array), smaakomschrijving, drinkVanaf, drinkVoor.`

  const text = await callClaude([{
    role: 'user',
    content: [
      {
        type: 'image',
        source: { type: 'base64', media_type: mimeType, data: base64Image }
      },
      { type: 'text', text: 'Analyseer dit wijn-etiket en geef de gevraagde informatie als JSON.' }
    ]
  }], sysPrompt)

  return extractJSON(text) as WijnScan
}

export async function opzoekWijn(naam: string, wijnhuis: string, jaartal: number): Promise<WijnScan> {
  const sysPrompt = `Je bent een wijnexpert. Zoek informatie op over de gegeven wijn.
Geef ook een schatting van het ideale drinkvenster als drinkVanaf (jaar) en drinkVoor (jaar) op basis van wijntype, druivensoorten, regio en oogstjaar.
Antwoord altijd in JSON met velden: land, druivensoorten (array), smaakomschrijving, prijs (schatting in euro), drinkVanaf, drinkVoor.`

  const text = await callClaude([{
    role: 'user',
    content: `Geef informatie over: ${naam} van ${wijnhuis}, jaar ${jaartal}. Antwoord als JSON.`
  }], sysPrompt)

  return extractJSON(text) as WijnScan
}

export async function schatDrinkvenster(
  naam: string, wijnhuis: string, land: string, druivensoorten: string[], jaartal: number
): Promise<{ drinkVanaf: number; drinkVoor: number }> {
  const sysPrompt = `Je bent een wijnexpert. Geef een schatting van het ideale drinkvenster.
Antwoord als JSON met exact twee velden: drinkVanaf (jaar als getal) en drinkVoor (jaar als getal).`

  const text = await callClaude([{
    role: 'user',
    content: `Wijn: ${naam}, Wijnhuis: ${wijnhuis}, Land: ${land}, Druivensoorten: ${druivensoorten.join(', ')}, Oogstjaar: ${jaartal}. Geef drinkvenster als JSON.`
  }], sysPrompt)

  const result = extractJSON(text) as { drinkVanaf: number; drinkVoor: number }
  return result
}

export interface WijnAdvies {
  topkeuze: { naam: string; onderbouwing: string }
  alternatieven: { naam: string; onderbouwing: string }[]
}

export async function wijnAdviesEten(maaltijd: string, wijnenVoorraad: Array<{
  naam: string; wijnhuis: string; kleur: string; druivensoorten: string[]; smaakomschrijving: string
}>): Promise<WijnAdvies> {
  const wijnLijst = wijnenVoorraad.map(w =>
    `- ${w.naam} (${w.wijnhuis}, ${w.kleur}, ${w.druivensoorten.join('/')}): ${w.smaakomschrijving}`
  ).join('\n')

  const text = await callClaude([{
    role: 'user',
    content: `Geef wijnadvies op basis van deze maaltijd: ${maaltijd}. Kies uit deze wijnen op voorraad:\n${wijnLijst}\n\nGeef je antwoord als JSON in exact dit formaat:\n{"topkeuze":{"naam":"...","onderbouwing":"..."},"alternatieven":[{"naam":"...","onderbouwing":"..."},{"naam":"...","onderbouwing":"..."},{"naam":"...","onderbouwing":"..."}]}\n\nGeen uitleg buiten de JSON. Alleen de JSON.`
  }], 'Je bent een wijnexpert. Antwoord uitsluitend met geldige JSON, geen tekst erbuiten, geen markdown. Antwoord in het Nederlands.')

  return extractJSON(text) as WijnAdvies
}
