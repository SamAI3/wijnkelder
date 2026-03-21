import { useMemo, useState } from 'react'
import { BarChart2, Wine, Euro, TrendingUp, RefreshCw } from 'lucide-react'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { Wijn } from '../../types'
import { getBewaarStatus } from '../../utils/bewaaradvies'
import { getFlag } from '../../utils/flags'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

async function haalDrinkvenster(wijn: Wijn): Promise<{ drinkVanaf: number; drinkVoor: number } | null> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-allow-browser': 'true',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 128,
        messages: [{
          role: 'user',
          content: `Wat is het ideale drinkvenster voor deze wijn? Geef alleen een JSON terug: {"drinkVanaf": jaar, "drinkVoor": jaar}. Wijn: ${wijn.naam}, Wijnhuis: ${wijn.wijnhuis}, Land: ${wijn.land}, Druiven: ${wijn.druivensoorten.join(', ')}, Oogstjaar: ${wijn.jaartal}. Baseer je op algemene wijnkennis en het specifieke wijntype.`,
        }],
        system: 'Antwoord uitsluitend met geldige JSON, geen tekst erbuiten.',
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text: string = data.content[0].text
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

interface Props {
  wijnen: Wijn[]
}

export function DashboardScreen({ wijnen }: Props) {
  const [vernieuwen, setVernieuwen] = useState<{ bezig: boolean; verwerkt: number; totaal: number; klaar: number | null }>({
    bezig: false, verwerkt: 0, totaal: 0, klaar: null,
  })

  async function handleVernieuwen() {
    setVernieuwen({ bezig: true, verwerkt: 0, totaal: 0, klaar: null })
    try {
      const snap = await getDocs(collection(db, 'wijnen'))
      const teVerwerken = snap.docs.filter(d => {
        const data = d.data()
        return !data.drinkVanaf || !data.drinkVoor || data.drinkVanaf === 0 || data.drinkVoor === 0
      })
      setVernieuwen(v => ({ ...v, totaal: teVerwerken.length }))
      if (teVerwerken.length === 0) {
        setVernieuwen({ bezig: false, verwerkt: 0, totaal: 0, klaar: 0 })
        return
      }
      let bijgewerkt = 0
      const BATCH = 5
      for (let i = 0; i < teVerwerken.length; i += BATCH) {
        const chunk = teVerwerken.slice(i, i + BATCH)
        await Promise.all(chunk.map(async (d) => {
          const wijnData = { id: d.id, ...d.data() } as Wijn
          const advies = await haalDrinkvenster(wijnData)
          if (advies) {
            await updateDoc(doc(db, 'wijnen', d.id), { drinkVanaf: advies.drinkVanaf, drinkVoor: advies.drinkVoor })
            bijgewerkt++
          }
        }))
        setVernieuwen(v => ({ ...v, verwerkt: Math.min(i + BATCH, teVerwerken.length) }))
      }
      setVernieuwen({ bezig: false, verwerkt: 0, totaal: 0, klaar: bijgewerkt })
    } catch {
      setVernieuwen({ bezig: false, verwerkt: 0, totaal: 0, klaar: null })
    }
  }

  const stats = useMemo(() => {
    const totaalFlessen = wijnen.reduce((s, w) => s + w.flessenSamen + w.flessenSam + w.flessenRiv, 0)
    const opVoorraad = wijnen.filter(w => w.flessenSamen + w.flessenSam + w.flessenRiv > 0)

    const kleurVerdeling: Record<string, number> = {}
    const landVerdeling: Record<string, number> = {}
    const druifVerdeling: Record<string, number> = {}

    opVoorraad.forEach(w => {
      kleurVerdeling[w.kleur] = (kleurVerdeling[w.kleur] ?? 0) + w.flessenSamen + w.flessenSam + w.flessenRiv
      landVerdeling[w.land] = (landVerdeling[w.land] ?? 0) + w.flessenSamen + w.flessenSam + w.flessenRiv
      w.druivensoorten.forEach(d => { druifVerdeling[d] = (druifVerdeling[d] ?? 0) + 1 })
    })

    const eigenaarVerdeling = {
      Samen: wijnen.reduce((s, w) => s + w.flessenSamen, 0),
      Sam: wijnen.reduce((s, w) => s + w.flessenSam, 0),
      Riv: wijnen.reduce((s, w) => s + w.flessenRiv, 0),
    }

    const prijzen = wijnen.map(w => w.prijs).filter(p => p > 0)
    const gemPrijs = prijzen.length ? prijzen.reduce((a, b) => a + b) / prijzen.length : 0
    const duurste = wijnen.reduce((a, b) => b.prijs > a.prijs ? b : a, wijnen[0])
    const goedkoopste = wijnen.filter(w => w.prijs > 0).reduce((a, b) => b.prijs < a.prijs ? b : a, wijnen[0])

    const prijsCategorien = {
      '< €10': wijnen.filter(w => w.prijs < 10).length,
      '€10–€20': wijnen.filter(w => w.prijs >= 10 && w.prijs < 20).length,
      '€20–€30': wijnen.filter(w => w.prijs >= 20 && w.prijs < 30).length,
      '> €30': wijnen.filter(w => w.prijs >= 30).length,
    }

    const bewaar = { perfect: 0, te_jong: 0, over_hoogtepunt: 0, onbekend: 0 }
    opVoorraad.forEach(w => { bewaar[getBewaarStatus(w)]++ })

    return {
      totaalFlessen,
      uniekeWijnen: wijnen.length,
      opVoorraad: opVoorraad.length,
      kleurVerdeling,
      landVerdeling,
      druifVerdeling,
      eigenaarVerdeling,
      gemPrijs,
      duurste,
      goedkoopste,
      prijsCategorien,
      bewaar,
    }
  }, [wijnen])

  const kleurKleuren: Record<string, string> = {
    'Rood': '#8B1A2F',
    'Wit': '#d4ac0d',
    'Rosé': '#e91e63',
    'Oranje': '#f97316',
  }

  const topLanden = Object.entries(stats.landVerdeling).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const topDruiven = Object.entries(stats.druifVerdeling).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxLand = Math.max(...topLanden.map(([, n]) => n), 1)
  const maxDruif = Math.max(...topDruiven.map(([, n]) => n), 1)
  const totaalKleuren = Object.values(stats.kleurVerdeling).reduce((a, b) => a + b, 0) || 1
  const totaalEigenaar = Object.values(stats.eigenaarVerdeling).reduce((a, b) => a + b, 0) || 1

  return (
    <div style={{ minHeight: '100dvh', background: '#FAF8F5', paddingBottom: '80px' }}>
      <header style={{ background: '#8B1A2F', color: 'white', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart2 size={24} />
          <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Dashboard</h1>
        </div>
      </header>

      <div style={{ padding: '16px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Toptellers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Totaal flessen', value: stats.totaalFlessen, icon: <Wine size={20} color="#8B1A2F" /> },
            { label: 'Unieke wijnen', value: stats.uniekeWijnen, icon: <TrendingUp size={20} color="#8B1A2F" /> },
            { label: 'Op voorraad', value: stats.opVoorraad, icon: <Wine size={20} color="#8B1A2F" /> },
            { label: 'Gem. prijs', value: `€${stats.gemPrijs.toFixed(2)}`, icon: <Euro size={20} color="#8B1A2F" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{
              background: 'white', borderRadius: '12px', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '8px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {icon}
                <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{label}</span>
              </div>
              <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1a1a' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Bewaaradvies */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700 }}>Bewaaradvies (op voorraad)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { label: 'Nu perfect', count: stats.bewaar.perfect, emoji: '🟢', bg: '#dcfce7', color: '#166534' },
              { label: 'Nog te jong', count: stats.bewaar.te_jong, emoji: '🟡', bg: '#fef9c3', color: '#854d0e' },
              { label: 'Over hoogtepunt', count: stats.bewaar.over_hoogtepunt, emoji: '🔴', bg: '#fee2e2', color: '#991b1b' },
              { label: 'Onbekend', count: stats.bewaar.onbekend, emoji: '⚪', bg: '#f3f4f6', color: '#6b7280' },
            ].map(({ label, count, emoji, bg, color }) => (
              <div key={label} style={{ background: bg, borderRadius: '10px', padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{emoji}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{count}</div>
                <div style={{ fontSize: '0.62rem', color, marginTop: '2px', lineHeight: 1.3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Kleurverdeling donut */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700 }}>Verdeling per kleur</h3>
          <DonutChart data={stats.kleurVerdeling} kleuren={kleurKleuren} totaal={totaalKleuren} />
        </div>

        {/* Landen */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700 }}>Top landen (flessen op voorraad)</h3>
          {topLanden.map(([land, count]) => (
            <BalBalk key={land} label={`${getFlag(land)} ${land}`} count={count} max={maxLand} kleur="#8B1A2F" />
          ))}
        </div>

        {/* Top druiven */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700 }}>Top druivensoorten</h3>
          {topDruiven.map(([druif, count]) => (
            <BalBalk key={druif} label={druif} count={count} max={maxDruif} kleur="#c2410c" />
          ))}
        </div>

        {/* Eigenaarschap */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700 }}>Eigenaarschap</h3>
          {Object.entries(stats.eigenaarVerdeling).map(([naam, count]) => (
            <BalBalk key={naam} label={naam} count={count} max={totaalEigenaar} kleur="#7c3aed" showPct />
          ))}
        </div>

        {/* Prijsverdeling */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700 }}>Prijsverdeling</h3>
          {Object.entries(stats.prijsCategorien).map(([cat, count]) => (
            <BalBalk key={cat} label={cat} count={count} max={Math.max(...Object.values(stats.prijsCategorien), 1)} kleur="#0284c7" />
          ))}
        </div>

        {/* Duurste / goedkoopste */}
        {stats.duurste && stats.goedkoopste && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700 }}>Uitschieters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: '#fdf2f4', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#8B1A2F', fontWeight: 600, marginBottom: '4px' }}>DUURSTE</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3 }}>{stats.duurste.naam}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#8B1A2F', marginTop: '4px' }}>€{stats.duurste.prijs.toFixed(2)}</div>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>GOEDKOOPSTE</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3 }}>{stats.goedkoopste.naam}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534', marginTop: '4px' }}>€{stats.goedkoopste.prijs.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
        {/* Bewaaradvies vernieuwen */}
        <div style={{ textAlign: 'center', paddingTop: '4px' }}>
          {vernieuwen.bezig ? (
            <div style={{ fontSize: '0.85rem', color: '#8B1A2F', fontWeight: 500 }}>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', marginRight: '6px', verticalAlign: 'middle' }} />
              {vernieuwen.verwerkt} van {vernieuwen.totaal} wijnen verwerkt...
            </div>
          ) : (
            <>
              {vernieuwen.klaar !== null && (
                <div style={{ fontSize: '0.82rem', color: '#166534', marginBottom: '8px', fontWeight: 500 }}>
                  ✓ {vernieuwen.klaar === 0 ? 'Alle wijnen hadden al een bewaaradvies.' : `${vernieuwen.klaar} wijn${vernieuwen.klaar !== 1 ? 'en' : ''} bijgewerkt.`}
                </div>
              )}
              <button onClick={handleVernieuwen} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', background: 'white',
                border: '1.5px solid #e5e7eb', borderRadius: '8px',
                fontSize: '0.82rem', color: '#6b7280', cursor: 'pointer',
                fontWeight: 500,
              }}>
                <RefreshCw size={13} /> Bewaaradvies vernieuwen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function BalBalk({ label, count, max, kleur, showPct }: { label: string; count: number; max: number; kleur: string; showPct?: boolean }) {
  const pct = Math.round((count / max) * 100)
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem' }}>
        <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
        <span style={{ color: kleur, fontWeight: 700 }}>{showPct ? `${pct}%` : count}</span>
      </div>
      <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: kleur,
          borderRadius: '4px', transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

function DonutChart({ data, kleuren, totaal }: { data: Record<string, number>; kleuren: Record<string, string>; totaal: number }) {
  const items = Object.entries(data).filter(([, n]) => n > 0)
  const size = 140
  const r = 50
  const cx = size / 2
  const cy = size / 2
  let startAngle = -90

  const slices = items.map(([kleur, count]) => {
    const angle = (count / totaal) * 360
    const endAngle = startAngle + angle
    const start = polarToCart(cx, cy, r, startAngle)
    const end = polarToCart(cx, cy, r, endAngle)
    const largeArc = angle > 180 ? 1 : 0
    const d = `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
    const slice = { kleur, count, d, color: kleuren[kleur] ?? '#6b7280' }
    startAngle = endAngle
    return slice
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {slices.map(s => (
          <path key={s.kleur} d={s.d} fill={s.color} stroke="white" strokeWidth="2" />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="700" fill="#1a1a1a">
          {totaal}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#6b7280">
          flessen
        </text>
      </svg>
      <div style={{ flex: 1 }}>
        {slices.map(s => (
          <div key={s.kleur} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', color: '#374151', flex: 1 }}>{s.kleur}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a' }}>{s.count}</span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>({Math.round(s.count / totaal * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function polarToCart(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
