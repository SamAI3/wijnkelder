import { useState, useEffect } from 'react'
import { Utensils, Send, Wine } from 'lucide-react'
import type { Wijn } from '../../types'
import { wijnAdviesEten, type WijnAdvies } from '../../utils/anthropic'

interface Props {
  wijnen: Wijn[]
}

const LAADTEKSTEN = ['Wijnen vergelijken...', 'Smaken afwegen...', 'Perfecte match zoeken...']

function LaadAnimatie() {
  const [tekstIndex, setTekstIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTekstIndex(i => (i + 1) % LAADTEKSTEN.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: '20px',
    }}>
      <div style={{ position: 'relative', width: '72px', height: '72px' }}>
        {/* Draaiende ring */}
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ position: 'absolute', inset: 0, animation: 'spin 1.4s linear infinite' }}>
          <circle cx="36" cy="36" r="30" fill="none" stroke="#f0ebe7" strokeWidth="4" />
          <circle cx="36" cy="36" r="30" fill="none" stroke="#8B1A2F" strokeWidth="4"
            strokeDasharray="48 140" strokeLinecap="round" />
        </svg>
        {/* Wijnglas in het midden */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Wine size={28} color="#8B1A2F" />
        </div>
      </div>
      <p style={{
        margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#8B1A2F',
        animation: 'fadeIn 0.4s ease',
        minWidth: '200px', textAlign: 'center',
      }}>
        {LAADTEKSTEN[tekstIndex]}
      </p>
    </div>
  )
}

function zoekWijn(naam: string, wijnen: Wijn[]): Wijn | undefined {
  const lower = naam.toLowerCase()
  return wijnen.find(w => w.naam.toLowerCase() === lower)
    ?? wijnen.find(w => lower.includes(w.naam.toLowerCase()) || w.naam.toLowerCase().includes(lower))
}

function WijnChips({ wijn, licht }: { wijn: Wijn; licht?: boolean }) {
  const eigenaren = [
    wijn.flessenSamen > 0 && 'Samen',
    wijn.flessenSam > 0 && 'Sam',
    wijn.flessenRiv > 0 && 'Riv',
  ].filter(Boolean) as string[]

  const chipStijl: React.CSSProperties = licht
    ? { background: 'rgba(255,255,255,0.18)', color: 'white' }
    : { background: '#f3f4f6', color: '#4b5563' }

  const chips = [
    wijn.kleur,
    String(wijn.jaartal),
    `€${wijn.prijs.toFixed(2)}`,
    ...eigenaren,
  ]

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
      {chips.map(chip => (
        <span key={chip} style={{
          ...chipStijl,
          borderRadius: '20px', padding: '2px 9px',
          fontSize: '0.74rem', fontWeight: 500,
        }}>
          {chip}
        </span>
      ))}
    </div>
  )
}

function AdviesWeergave({ advies, wijnen }: { advies: WijnAdvies; wijnen: Wijn[] }) {
  const topWijn = zoekWijn(advies.topkeuze.naam, wijnen)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Topkeuze */}
      <div style={{ background: '#8B1A2F', borderRadius: '14px', padding: '20px', color: 'white' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase' }}>
          Topkeuze
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.3 }}>
          {advies.topkeuze.naam.replace(/\s*\(.*?\)\s*$/, '')}
        </div>
        <div style={{ fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.9 }}>
          {advies.topkeuze.onderbouwing}
        </div>
        {topWijn && <WijnChips wijn={topWijn} licht />}
      </div>

      {/* Alternatieven */}
      {advies.alternatieven.length > 0 && (
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '2px' }}>
            Ook een goede keuze
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {advies.alternatieven.map((alt, i) => {
              const altWijn = zoekWijn(alt.naam, wijnen)
              return (
                <div key={i} style={{
                  background: 'white', borderRadius: '12px', padding: '14px 16px',
                  border: '1px solid #f0ebe7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
                    {alt.naam.replace(/\s*\(.*?\)\s*$/, '')}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.5 }}>
                    {alt.onderbouwing}
                  </div>
                  {altWijn && <WijnChips wijn={altWijn} />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function EtenScreen({ wijnen }: Props) {
  const [maaltijd, setMaaltijd] = useState('')
  const [advies, setAdvies] = useState<WijnAdvies | null>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  const wijnenOpVoorraad = wijnen.filter(w => w.flessenSamen + w.flessenSam + w.flessenRiv > 0)

  async function handleAdvies() {
    if (!maaltijd.trim()) return
    if (wijnenOpVoorraad.length === 0) {
      setFout('Er zijn geen wijnen op voorraad.')
      return
    }
    setBezig(true)
    setFout(null)
    setAdvies(null)
    try {
      const result = await wijnAdviesEten(maaltijd, wijnenOpVoorraad.map(w => ({
        naam: w.naam,
        wijnhuis: w.wijnhuis,
        kleur: w.kleur,
        druivensoorten: w.druivensoorten,
        smaakomschrijving: w.smaakomschrijving,
      })))
      setAdvies(result)
    } catch (err) {
      setFout(`Advies ophalen mislukt: ${err instanceof Error ? err.message : 'Onbekende fout'}`)
    } finally {
      setBezig(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FAF8F5', paddingBottom: '100px' }}>
      <header style={{ background: '#8B1A2F', color: 'white', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Utensils size={24} />
          <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Wat eten we?</h1>
        </div>
      </header>

      <div style={{ padding: '16px' }}>
        {/* Invoerveld */}
        <div style={{
          background: 'white', borderRadius: '12px', padding: '16px',
          marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              background: '#fdf2f4', borderRadius: '10px', padding: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wine size={18} color="#8B1A2F" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a' }}>Persoonlijk wijnadvies</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{wijnenOpVoorraad.length} wijnen op voorraad</div>
            </div>
          </div>

          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: '#374151', marginBottom: '8px' }}>
            Beschrijf je maaltijd
          </label>
          <textarea
            value={maaltijd}
            onChange={e => setMaaltijd(e.target.value)}
            placeholder="Bijv: Gegrilde zalm met citroenboter en asperges..."
            rows={3}
            style={{
              width: '100%', border: '2px solid #e5e7eb', borderRadius: '8px',
              padding: '10px', fontSize: '0.95rem', resize: 'vertical',
              outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
            onFocus={e => (e.target.style.borderColor = '#8B1A2F')}
            onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
          />
          <button
            onClick={handleAdvies}
            disabled={bezig || !maaltijd.trim()}
            style={{
              marginTop: '12px', width: '100%', padding: '13px',
              background: bezig || !maaltijd.trim() ? '#d1d5db' : '#8B1A2F',
              border: 'none', borderRadius: '8px', color: 'white',
              fontSize: '0.95rem', fontWeight: 600,
              cursor: bezig || !maaltijd.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 0.2s',
            }}
          >
            <Send size={18} /> Advies vragen
          </button>
        </div>

        {/* Fout */}
        {fout && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: '8px', padding: '12px', marginBottom: '16px',
            fontSize: '0.88rem', color: '#991b1b',
          }}>
            {fout}
          </div>
        )}

        {/* Laadanimatie */}
        {bezig && <LaadAnimatie />}

        {/* Advies */}
        {advies && !bezig && <AdviesWeergave advies={advies} wijnen={wijnen} />}

        {/* Lege staat */}
        {wijnenOpVoorraad.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', background: 'white', borderRadius: '12px' }}>
            <Wine size={32} color="#d1d5db" style={{ margin: '0 auto 10px' }} />
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
              Er zijn geen wijnen op voorraad. Voeg wijnen toe om advies te ontvangen.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
